-- Criar tabela de cupons do comércio para clientes
CREATE TABLE public.commerce_coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_value NUMERIC,
  max_discount NUMERIC,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT now(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  first_order_only BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(commerce_id, code)
);

-- Enable RLS
ALTER TABLE public.commerce_coupons ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Commerce owners can manage their coupons"
ON public.commerce_coupons
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Anyone can view active coupons for ordering"
ON public.commerce_coupons
FOR SELECT
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_commerce_coupons_updated_at
BEFORE UPDATE ON public.commerce_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index for performance
CREATE INDEX idx_commerce_coupons_commerce_id ON public.commerce_coupons(commerce_id);
CREATE INDEX idx_commerce_coupons_code ON public.commerce_coupons(code);