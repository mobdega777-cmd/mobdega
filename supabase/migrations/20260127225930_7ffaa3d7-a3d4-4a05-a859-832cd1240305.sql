-- Recriar views com security_invoker para resolver o aviso do linter
DROP VIEW IF EXISTS public.reviews_public;
DROP VIEW IF EXISTS public.commerces_public;

-- View de reviews anonimizada com security_invoker
CREATE VIEW public.reviews_public
WITH (security_invoker=on) AS
SELECT 
  id,
  commerce_id,
  rating,
  comment,
  created_at
FROM public.reviews;

-- View pública de comércios com security_invoker
CREATE VIEW public.commerces_public
WITH (security_invoker=on) AS
SELECT 
  id,
  fantasy_name,
  logo_url,
  cover_url,
  phone,
  whatsapp,
  address,
  address_number,
  neighborhood,
  city,
  cep,
  is_open,
  opening_hours,
  delivery_enabled,
  table_payment_required,
  status,
  created_at,
  plan_id
FROM public.commerces
WHERE status = 'approved';

-- Conceder permissões
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;