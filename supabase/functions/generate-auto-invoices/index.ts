import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Commerce {
  id: string;
  fantasy_name: string;
  auto_invoice_day: number;
  auto_invoice_enabled: boolean;
  plan_id: string;
  coupon_code: string | null;
}

interface Plan {
  id: string;
  price: number;
}

interface DiscountCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  is_active: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const currentDay = now.getDate();
    
    // Calculate the reference month (next month for the invoice)
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const referenceMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;

    console.log(`Running auto-invoice generation for reference month: ${referenceMonth}`);
    console.log(`Current day: ${currentDay}`);

    // Fetch all commerces with auto_invoice_enabled = true
    const { data: commerces, error: commercesError } = await supabase
      .from('commerces')
      .select('id, fantasy_name, auto_invoice_day, auto_invoice_enabled, plan_id, coupon_code')
      .eq('auto_invoice_enabled', true)
      .eq('status', 'approved')
      .not('plan_id', 'is', null);

    if (commercesError) {
      console.error('Error fetching commerces:', commercesError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch commerces', details: commercesError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!commerces || commerces.length === 0) {
      console.log('No commerces with auto-invoice enabled found');
      return new Response(
        JSON.stringify({ message: 'No commerces to process', invoicesCreated: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all plans
    const planIds = [...new Set(commerces.map(c => c.plan_id).filter(Boolean))];
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('id, price')
      .in('id', planIds);

    if (plansError) {
      console.error('Error fetching plans:', plansError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch plans', details: plansError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const planPriceMap = new Map<string, number>();
    plans?.forEach(p => planPriceMap.set(p.id, Number(p.price)));

    // Fetch all discount coupons that are active
    const couponCodes = [...new Set(commerces.map(c => c.coupon_code).filter(Boolean) as string[])];
    const couponMap = new Map<string, DiscountCoupon>();
    
    if (couponCodes.length > 0) {
      const { data: coupons } = await supabase
        .from('discount_coupons')
        .select('id, code, discount_type, discount_value, is_active')
        .in('code', couponCodes)
        .eq('is_active', true);

      coupons?.forEach(c => couponMap.set(c.code.toUpperCase(), c));
    }

    let invoicesCreated = 0;
    const errors: string[] = [];

    for (const commerce of commerces as Commerce[]) {
      const invoiceDay = commerce.auto_invoice_day || 10;
      
      // Calculate how many days until the invoice due date
      // The due date is: next month, day = invoiceDay
      const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), invoiceDay);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Commerce ${commerce.fantasy_name}: due day ${invoiceDay}, days until due: ${daysUntilDue}`);

      // Only create invoice if we're within 10 days of the due date
      if (daysUntilDue > 10 || daysUntilDue < 0) {
        console.log(`Skipping ${commerce.fantasy_name}: not within 10-day window`);
        continue;
      }

      // Check if invoice already exists for this commerce and reference month
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('commerce_id', commerce.id)
        .eq('reference_month', referenceMonth)
        .eq('type', 'receivable')
        .maybeSingle();

      if (existingInvoice) {
        console.log(`Invoice already exists for ${commerce.fantasy_name} in ${referenceMonth}`);
        continue;
      }

      // Calculate the invoice amount
      const planPrice = planPriceMap.get(commerce.plan_id) || 0;
      let finalAmount = planPrice;

      // Apply coupon discount if available
      if (commerce.coupon_code) {
        const coupon = couponMap.get(commerce.coupon_code.toUpperCase());
        if (coupon && coupon.is_active) {
          if (coupon.discount_type === 'percentage') {
            finalAmount = planPrice * (1 - coupon.discount_value / 100);
          } else if (coupon.discount_type === 'fixed') {
            finalAmount = Math.max(0, planPrice - coupon.discount_value);
          }
          console.log(`Applied coupon ${coupon.code}: ${planPrice} -> ${finalAmount}`);
        }
      }

      // Create the invoice
      const dueDateStr = dueDate.toISOString().split('T')[0];
      
      const { error: insertError } = await supabase
        .from('invoices')
        .insert({
          commerce_id: commerce.id,
          amount: finalAmount,
          due_date: dueDateStr,
          reference_month: referenceMonth,
          type: 'receivable',
          status: 'pending',
          notes: commerce.coupon_code 
            ? `Fatura automática. Cupom aplicado: ${commerce.coupon_code}`
            : 'Fatura automática'
        });

      if (insertError) {
        console.error(`Error creating invoice for ${commerce.fantasy_name}:`, insertError);
        errors.push(`${commerce.fantasy_name}: ${insertError.message}`);
      } else {
        console.log(`Created invoice for ${commerce.fantasy_name}: R$ ${finalAmount.toFixed(2)} due ${dueDateStr}`);
        invoicesCreated++;
      }
    }

    const response = {
      message: `Auto-invoice generation completed`,
      referenceMonth,
      commercesProcessed: commerces.length,
      invoicesCreated,
      errors: errors.length > 0 ? errors : undefined
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
