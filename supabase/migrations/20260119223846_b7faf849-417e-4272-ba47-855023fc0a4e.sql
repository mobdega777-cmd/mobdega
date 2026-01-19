-- Add delivery_enabled column to commerces table
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS delivery_enabled boolean DEFAULT true;

-- Create comments for clarity
COMMENT ON COLUMN public.commerces.delivery_enabled IS 'Whether the commerce accepts delivery orders';