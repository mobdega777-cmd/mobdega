-- Função segura para listagem pública de comércios (bypass de RLS com retorno apenas de campos não sensíveis)
CREATE OR REPLACE FUNCTION public.get_public_commerces(p_limit integer DEFAULT 50)
RETURNS TABLE (
  id uuid,
  fantasy_name text,
  city text,
  cep text,
  logo_url text,
  cover_url text,
  neighborhood text,
  is_open boolean,
  opening_hours jsonb,
  whatsapp text,
  phone text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.fantasy_name,
    c.city,
    c.cep,
    c.logo_url,
    c.cover_url,
    c.neighborhood,
    c.is_open,
    c.opening_hours,
    c.whatsapp,
    c.phone
  FROM public.commerces c
  WHERE c.status = 'approved'::public.commerce_status
  ORDER BY c.created_at DESC
  LIMIT COALESCE(p_limit, 50);
$$;

REVOKE ALL ON FUNCTION public.get_public_commerces(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_commerces(integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_public_commerces(integer) TO authenticated;