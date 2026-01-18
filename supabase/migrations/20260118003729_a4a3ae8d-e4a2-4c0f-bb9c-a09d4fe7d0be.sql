-- Allow master admin to view all profiles for customer management
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile or admin can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR is_master_admin());