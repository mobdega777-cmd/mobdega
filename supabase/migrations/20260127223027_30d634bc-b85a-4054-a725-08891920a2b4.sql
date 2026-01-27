-- 1. Criar view pública para commerces (sem dados sensíveis do dono)
CREATE OR REPLACE VIEW public.commerces_public
WITH (security_invoker=on) AS
SELECT 
  id,
  fantasy_name,
  logo_url,
  cover_url,
  city,
  neighborhood,
  address,
  address_number,
  cep,
  phone,
  whatsapp,
  is_open,
  opening_hours,
  delivery_enabled,
  table_payment_required,
  status,
  created_at
FROM public.commerces
WHERE status = 'approved';

-- 2. Atualizar política de SELECT em commerces - remover acesso público
DROP POLICY IF EXISTS "Public can view approved commerces" ON public.commerces;

-- 3. Criar política restrita para donos/admin apenas
CREATE POLICY "Owners and admins can view full commerce data"
ON public.commerces FOR SELECT
USING (
  (owner_id = auth.uid()) 
  OR is_master_admin()
);

-- 4. Restringir cupons para usuários autenticados apenas
DROP POLICY IF EXISTS "Anyone can view active coupons for ordering" ON public.commerce_coupons;

CREATE POLICY "Authenticated users can view active coupons"
ON public.commerce_coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Permitir SELECT na view para anon e authenticated
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;