
-- Recriar a política de ALL para table_participants usando a nova função
DROP POLICY IF EXISTS "Commerce owners can manage participants" ON public.table_participants;

CREATE POLICY "Commerce owners can manage participants"
ON public.table_participants
FOR ALL
USING (
  public.is_session_commerce_owner(session_id)
);

-- Recriar a política de SELECT para table_participants
DROP POLICY IF EXISTS "Participants and commerce owners can view table participants" ON public.table_participants;

CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants
FOR SELECT
USING (
  user_id = auth.uid()
  OR public.is_session_commerce_owner(session_id)
  OR public.is_master_admin()
);
