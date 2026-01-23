-- Remove old constraint and add new one with stock_purchase
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_type_check;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_type_check 
  CHECK (type = ANY (ARRAY['fixed'::text, 'variable'::text, 'stock_purchase'::text]));

-- Add custom message field to discount_coupons table
ALTER TABLE public.discount_coupons 
ADD COLUMN IF NOT EXISTS custom_message TEXT DEFAULT NULL;