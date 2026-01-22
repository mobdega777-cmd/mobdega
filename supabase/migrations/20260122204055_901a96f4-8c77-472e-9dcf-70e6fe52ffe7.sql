-- Add auto-invoice configuration fields to commerces table
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS auto_invoice_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS auto_invoice_day integer DEFAULT 5 CHECK (auto_invoice_day >= 1 AND auto_invoice_day <= 28);

-- Create notifications table for admin alerts
CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  commerce_id uuid REFERENCES public.commerces(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE CASCADE,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only master admin can manage notifications
CREATE POLICY "Master admin can manage notifications" 
ON public.admin_notifications 
FOR ALL 
USING (is_master_admin());

-- Create function to notify admin when commerce confirms payment
CREATE OR REPLACE FUNCTION public.notify_admin_on_payment_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_confirmed_by_commerce = true AND OLD.payment_confirmed_by_commerce IS DISTINCT FROM true THEN
    INSERT INTO public.admin_notifications (type, title, message, commerce_id, invoice_id)
    SELECT 
      'payment_confirmation',
      'Pagamento Informado',
      'O comércio ' || c.fantasy_name || ' informou o pagamento da fatura de ' || NEW.reference_month,
      NEW.commerce_id,
      NEW.id
    FROM public.commerces c
    WHERE c.id = NEW.commerce_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment confirmation notification
DROP TRIGGER IF EXISTS on_payment_confirmation ON public.invoices;
CREATE TRIGGER on_payment_confirmation
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_payment_confirmation();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;