-- Drop old constraint and add new one allowing days 1-31
ALTER TABLE public.commerces DROP CONSTRAINT IF EXISTS commerces_auto_invoice_day_check;
ALTER TABLE public.commerces ADD CONSTRAINT commerces_auto_invoice_day_check CHECK (auto_invoice_day >= 1 AND auto_invoice_day <= 31);