-- Create payment_methods table for commerce payment configuration
CREATE TABLE public.payment_methods (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'custom', -- 'credit', 'debit', 'pix', 'cash', 'custom'
    fee_percentage NUMERIC DEFAULT 0,
    fee_fixed NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    pix_key TEXT,
    pix_key_type TEXT,
    pix_qr_code_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Commerce owners can manage payment methods"
ON public.payment_methods
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true OR is_commerce_owner_or_admin(commerce_id));

-- Trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();