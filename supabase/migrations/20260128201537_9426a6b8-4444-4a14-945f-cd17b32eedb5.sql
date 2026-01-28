-- Add tax configuration columns to commerces table
ALTER TABLE public.commerces
ADD COLUMN IF NOT EXISTS tax_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS tax_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_regime text DEFAULT 'simples',
ADD COLUMN IF NOT EXISTS tax_payment_day integer DEFAULT 20;

-- Add comment for documentation
COMMENT ON COLUMN public.commerces.tax_type IS 'fixed or percentage';
COMMENT ON COLUMN public.commerces.tax_regime IS 'mei, simples, lucro_presumido, lucro_real';
COMMENT ON COLUMN public.commerces.tax_payment_day IS 'Day of month for tax payment (1-28)';