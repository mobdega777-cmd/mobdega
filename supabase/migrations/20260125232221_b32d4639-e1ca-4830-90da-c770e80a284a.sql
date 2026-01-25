-- Create trigger to notify admin when commerce confirms payment
DROP TRIGGER IF EXISTS notify_admin_on_invoice_payment ON public.invoices;

CREATE TRIGGER notify_admin_on_invoice_payment
AFTER UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.notify_admin_on_payment_confirmation();