-- Create commerce_notifications table for commerce-specific notifications
CREATE TABLE public.commerce_notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commerce_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Commerce owners can view their own notifications
CREATE POLICY "Commerce owners can view their notifications"
ON public.commerce_notifications
FOR SELECT
USING (
    commerce_id IN (
        SELECT id FROM public.commerces WHERE owner_id = auth.uid()
    )
);

-- Policy: Commerce owners can update their own notifications (mark as read)
CREATE POLICY "Commerce owners can update their notifications"
ON public.commerce_notifications
FOR UPDATE
USING (
    commerce_id IN (
        SELECT id FROM public.commerces WHERE owner_id = auth.uid()
    )
);

-- Policy: System/triggers can insert notifications (using service role)
CREATE POLICY "Allow insert for authenticated users"
ON public.commerce_notifications
FOR INSERT
WITH CHECK (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.commerce_notifications;

-- Create function to notify commerce on new invoice
CREATE OR REPLACE FUNCTION public.notify_commerce_on_new_invoice()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.commerce_notifications (
        commerce_id,
        type,
        title,
        message,
        invoice_id
    ) VALUES (
        NEW.commerce_id,
        'new_invoice',
        'Nova Fatura Disponível',
        'Uma nova fatura de ' || 
        CASE 
            WHEN NEW.type = 'monthly' THEN 'mensalidade'
            WHEN NEW.type = 'tax' THEN 'imposto'
            ELSE 'cobrança'
        END || 
        ' no valor de R$ ' || 
        TRIM(TO_CHAR(NEW.amount, 'FM999G999D00')) || 
        ' foi gerada para o mês de ' || NEW.reference_month || '.',
        NEW.id
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-create notification when invoice is created
CREATE TRIGGER on_invoice_created_notify_commerce
    AFTER INSERT ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_commerce_on_new_invoice();