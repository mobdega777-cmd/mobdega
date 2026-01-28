-- Create function to get commerce details by ID for storefront
-- This function bypasses RLS to return public-facing commerce data
CREATE OR REPLACE FUNCTION public.get_commerce_storefront(p_commerce_id uuid)
RETURNS TABLE (
  id uuid,
  fantasy_name text,
  logo_url text,
  cover_url text,
  city text,
  neighborhood text,
  address text,
  address_number text,
  phone text,
  whatsapp text,
  is_open boolean,
  delivery_enabled boolean,
  opening_hours jsonb,
  table_payment_required boolean,
  status text
)
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT 
    c.id,
    c.fantasy_name,
    c.logo_url,
    c.cover_url,
    c.city,
    c.neighborhood,
    c.address,
    c.address_number,
    c.phone,
    c.whatsapp,
    c.is_open,
    c.delivery_enabled,
    c.opening_hours,
    c.table_payment_required,
    c.status::text
  FROM public.commerces c
  WHERE c.id = p_commerce_id
    AND c.status = 'approved'::public.commerce_status;
$$;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION public.get_commerce_storefront(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.get_commerce_storefront(uuid) TO authenticated;