-- Helper RPC to allow storefront to detect active table sessions without exposing table_sessions via RLS
CREATE OR REPLACE FUNCTION public.get_active_sessions_for_tables(p_table_ids uuid[])
RETURNS TABLE(table_id uuid, session_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT DISTINCT ON (ts.table_id)
    ts.table_id,
    ts.id AS session_id
  FROM public.table_sessions ts
  WHERE ts.table_id = ANY(p_table_ids)
    AND ts.status = 'active'
  ORDER BY ts.table_id, ts.opened_at DESC;
$$;