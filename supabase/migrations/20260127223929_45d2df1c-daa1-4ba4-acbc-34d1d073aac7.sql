-- 1. Recriar view sem security_invoker (permite acesso público aos campos selecionados)
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
  created_at
FROM public.commerces
WHERE status = 'approved';

-- Permitir acesso à view
GRANT SELECT ON public.commerces_public TO anon;
GRANT SELECT ON public.commerces_public TO authenticated;

-- 2. Criar função segura para lookup de email por documento (para login)
CREATE OR REPLACE FUNCTION public.get_commerce_email_by_document(p_document text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email 
  FROM public.commerces 
  WHERE REGEXP_REPLACE(document, '\D', '', 'g') = REGEXP_REPLACE(p_document, '\D', '', 'g')
  LIMIT 1;
$$;

-- Permitir chamada da função
GRANT EXECUTE ON FUNCTION public.get_commerce_email_by_document(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_commerce_email_by_document(text) TO authenticated;

-- 3. Corrigir política recursiva de table_participants
DROP POLICY IF EXISTS "Participants and commerce owners can view table participants" ON public.table_participants;

CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants FOR SELECT
USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM public.table_sessions ts
    WHERE ts.id = table_participants.session_id
    AND is_commerce_owner_or_admin(ts.commerce_id)
  )
  OR is_master_admin()
);