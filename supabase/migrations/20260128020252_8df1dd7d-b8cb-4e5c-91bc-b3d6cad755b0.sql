
-- Ajuste: permitir que o criador da sessão consiga SELECT imediatamente após INSERT
-- Isso evita erro quando o cliente usa return=representation antes de inserir table_participants.

DROP POLICY IF EXISTS "Participants and commerce owners can view table sessions" ON public.table_sessions;

CREATE POLICY "Participants and commerce owners can view table sessions"
ON public.table_sessions
FOR SELECT
TO authenticated
USING (
  opened_by_user_id = auth.uid()
  OR public.is_session_participant(id, auth.uid())
  OR public.is_commerce_owner_or_admin(commerce_id)
  OR public.is_master_admin()
);

-- Ajuste: permitir UPDATE pelo criador também (em fluxos onde ele ainda não entrou como participant)
DROP POLICY IF EXISTS "Session participants can update session" ON public.table_sessions;

CREATE POLICY "Session participants can update session"
ON public.table_sessions
FOR UPDATE
USING (
  opened_by_user_id = auth.uid()
  OR public.is_session_participant(id, auth.uid())
  OR public.is_commerce_owner_or_admin(commerce_id)
);
