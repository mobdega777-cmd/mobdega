-- Create a SECURITY DEFINER function to get session info for joining
-- This allows any authenticated user to get basic session info needed to join
CREATE OR REPLACE FUNCTION public.get_session_info_for_join(p_session_id UUID)
RETURNS TABLE (
  id UUID,
  table_id UUID,
  commerce_id UUID,
  bill_mode TEXT,
  opened_at TIMESTAMPTZ,
  opened_by_user_id UUID,
  status TEXT,
  host_name TEXT,
  participants_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.table_id,
    ts.commerce_id,
    ts.bill_mode,
    ts.opened_at,
    ts.opened_by_user_id,
    ts.status,
    (
      SELECT p.full_name 
      FROM profiles p 
      JOIN table_participants tp ON tp.user_id = p.user_id 
      WHERE tp.session_id = ts.id AND tp.is_host = true 
      LIMIT 1
    ) as host_name,
    (
      SELECT COUNT(*) 
      FROM table_participants tp 
      WHERE tp.session_id = ts.id
    ) as participants_count
  FROM table_sessions ts
  WHERE ts.id = p_session_id 
    AND ts.status = 'active';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_session_info_for_join(UUID) TO authenticated;