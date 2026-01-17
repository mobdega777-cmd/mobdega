-- Create delivery_zones table for managing delivery areas by CEP ranges
CREATE TABLE public.delivery_zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cep_start TEXT NOT NULL,
  cep_end TEXT NOT NULL,
  delivery_fee NUMERIC NOT NULL DEFAULT 0,
  estimated_time INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_zones ENABLE ROW LEVEL SECURITY;

-- Anyone can view active delivery zones (for customer checkout validation)
CREATE POLICY "Anyone can view active delivery zones"
ON public.delivery_zones
FOR SELECT
USING (is_active = true OR is_commerce_owner_or_admin(commerce_id));

-- Commerce owners can manage their delivery zones
CREATE POLICY "Commerce owners can manage delivery zones"
ON public.delivery_zones
FOR ALL
USING (is_commerce_owner_or_admin(commerce_id));

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_zones_updated_at
BEFORE UPDATE ON public.delivery_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_delivery_zones_commerce_id ON public.delivery_zones(commerce_id);
CREATE INDEX idx_delivery_zones_cep_range ON public.delivery_zones(cep_start, cep_end);