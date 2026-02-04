-- Corrigir a função notify_commerce_on_new_invoice para usar os valores corretos do enum invoice_type
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
            WHEN NEW.type = 'receivable' THEN 'mensalidade'
            WHEN NEW.type = 'payable' THEN 'despesa'
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