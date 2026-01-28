-- Fix commerce_photos RLS policy to use direct check instead of subquery to blocked table
DROP POLICY IF EXISTS "Authenticated users can view approved commerce photos" ON commerce_photos;

-- Create a new policy that allows anyone to view photos for approved commerces
-- Using SECURITY DEFINER function to check commerce status
CREATE OR REPLACE FUNCTION public.is_commerce_approved(p_commerce_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM commerces 
    WHERE id = p_commerce_id 
    AND status = 'approved'::commerce_status
  );
$$;

-- Grant execute to public roles
GRANT EXECUTE ON FUNCTION public.is_commerce_approved(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_commerce_approved(uuid) TO authenticated;

-- Recreate the policy using the new function
CREATE POLICY "Anyone can view photos for approved commerces"
ON commerce_photos FOR SELECT
USING (is_commerce_approved(commerce_id));