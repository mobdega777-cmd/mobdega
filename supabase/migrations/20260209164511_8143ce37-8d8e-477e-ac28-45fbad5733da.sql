-- Allow authenticated users to view basic profile info (needed for review names, etc.)
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Drop the old restrictive policy since the new one is broader
DROP POLICY IF EXISTS "Commerce owners can view profiles of customers who ordered" ON public.profiles;