-- 1. Adicionar política para comércios verem perfis de clientes que compraram na loja
CREATE POLICY "Commerce owners can view profiles of customers who ordered"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.commerces c ON c.id = o.commerce_id
    WHERE o.user_id = profiles.user_id
    AND c.owner_id = auth.uid()
  )
  OR auth.uid() = user_id
  OR is_master_admin()
);

-- Drop a política antiga que era muito restritiva
DROP POLICY IF EXISTS "Users can view their own profile or admin can view all" ON public.profiles;

-- 2. Adicionar plan_id na view commerces_public para o ranking funcionar
DROP VIEW IF EXISTS public.commerces_public;

CREATE VIEW public.commerces_public AS
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
  plan_id,
  created_at
FROM public.commerces
WHERE status = 'approved';

-- Permitir acesso à view
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;