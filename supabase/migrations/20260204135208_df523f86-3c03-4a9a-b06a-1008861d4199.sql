-- Drop and recreate the get_commerce_storefront function to include instagram_url and facebook_url
DROP FUNCTION IF EXISTS public.get_commerce_storefront(uuid);

CREATE FUNCTION public.get_commerce_storefront(p_commerce_id uuid)
 RETURNS TABLE(id uuid, fantasy_name text, logo_url text, cover_url text, city text, neighborhood text, address text, address_number text, phone text, whatsapp text, is_open boolean, delivery_enabled boolean, opening_hours jsonb, table_payment_required boolean, status text, instagram_url text, facebook_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
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
    c.status::text,
    c.instagram_url,
    c.facebook_url
  FROM public.commerces c
  WHERE c.id = p_commerce_id
    AND c.status = 'approved'::public.commerce_status;
$function$;