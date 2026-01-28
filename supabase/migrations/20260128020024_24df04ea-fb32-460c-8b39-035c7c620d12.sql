
-- Criar função SECURITY DEFINER para verificar se usuário é participante de uma sessão
CREATE OR REPLACE FUNCTION public.is_session_participant(_session_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.table_participants
    WHERE session_id = _session_id
      AND user_id = _user_id
  )
$$;

-- Criar função SECURITY DEFINER para verificar se comércio da sessão pertence ao usuário
CREATE OR REPLACE FUNCTION public.is_session_commerce_owner(_session_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.table_sessions ts
    JOIN public.commerces c ON c.id = ts.commerce_id
    WHERE ts.id = _session_id
      AND (c.owner_id = auth.uid() OR public.is_master_admin())
  )
$$;

-- Criar função SECURITY DEFINER para obter commerce_id de uma sessão
CREATE OR REPLACE FUNCTION public.get_session_commerce_id(_session_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT commerce_id FROM public.table_sessions WHERE id = _session_id
$$;

-- Drop das políticas problemáticas
DROP POLICY IF EXISTS "Participants and commerce owners can view table sessions" ON public.table_sessions;
DROP POLICY IF EXISTS "Session participants can update session" ON public.table_sessions;
DROP POLICY IF EXISTS "Commerce owners can manage participants" ON public.table_participants;
DROP POLICY IF EXISTS "Participants and commerce owners can view table participants" ON public.table_participants;

-- Recriar política SELECT para table_sessions (usa função para evitar recursão)
CREATE POLICY "Participants and commerce owners can view table sessions"
ON public.table_sessions
FOR SELECT
TO authenticated
USING (
  public.is_session_participant(id, auth.uid())
  OR public.is_commerce_owner_or_admin(commerce_id)
  OR public.is_master_admin()
);

-- Recriar política UPDATE para table_sessions
CREATE POLICY "Session participants can update session"
ON public.table_sessions
FOR UPDATE
USING (
  public.is_session_participant(id, auth.uid())
  OR public.is_commerce_owner_or_admin(commerce_id)
);

-- Recriar política SELECT para table_participants
CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_session_commerce_owner(session_id)
  OR public.is_master_admin()
);

-- Recriar política ALL para commerce owners em table_participants
CREATE POLICY "Commerce owners can manage participants"
ON public.table_participants
FOR ALL
USING (
  public.is_session_commerce_owner(session_id)
);
