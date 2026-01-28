-- Criar função segura para ranking de comércios (todos os aprovados, com plan_id)
CREATE OR REPLACE FUNCTION public.get_ranking_commerces()
RETURNS TABLE (
  id uuid,
  fantasy_name text,
  logo_url text,
  city text,
  neighborhood text,
  cep text,
  plan_id uuid
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    c.id,
    c.fantasy_name,
    c.logo_url,
    c.city,
    c.neighborhood,
    c.cep,
    c.plan_id
  FROM public.commerces c
  WHERE c.status = 'approved'::public.commerce_status
  ORDER BY c.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_ranking_commerces() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_ranking_commerces() TO anon;
GRANT EXECUTE ON FUNCTION public.get_ranking_commerces() TO authenticated;