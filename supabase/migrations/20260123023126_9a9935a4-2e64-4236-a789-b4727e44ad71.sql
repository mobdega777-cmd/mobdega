-- Create a secure function to count total users (for public stats)
CREATE OR REPLACE FUNCTION public.get_public_stats()
RETURNS json
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total_commerces', (SELECT count(*) FROM public.commerces WHERE status = 'approved'),
    'total_users', (SELECT count(*) FROM public.profiles)
  );
$$;