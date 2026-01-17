-- Create billing_config table for admin payment settings
CREATE TABLE public.billing_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL DEFAULT 'cnpj',
  qr_code_url TEXT,
  bank_name TEXT,
  account_holder TEXT NOT NULL,
  cnpj TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.billing_config ENABLE ROW LEVEL SECURITY;

-- Only master admin can manage billing config
CREATE POLICY "Master admin can manage billing config"
ON public.billing_config
FOR ALL
USING (public.is_master_admin());

-- Anyone can read billing config (for invoice display)
CREATE POLICY "Anyone can read billing config"
ON public.billing_config
FOR SELECT
USING (true);

-- Add payment_confirmed field to invoices
ALTER TABLE public.invoices 
ADD COLUMN payment_confirmed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN payment_confirmed_by_commerce BOOLEAN DEFAULT false;

-- Trigger for billing_config updated_at
CREATE TRIGGER update_billing_config_updated_at
BEFORE UPDATE ON public.billing_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();