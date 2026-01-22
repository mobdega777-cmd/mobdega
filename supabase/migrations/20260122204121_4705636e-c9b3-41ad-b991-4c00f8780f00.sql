-- Fix search_path for notify function
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;