-- Drop existing policy
DROP POLICY IF EXISTS "Commerce users can view active training videos" ON public.training_videos;

-- Create new policy that checks if user is commerce owner (approved)
CREATE POLICY "Commerce owners can view active training videos" 
ON public.training_videos 
FOR SELECT 
USING (
  is_active = true 
  AND (
    public.is_master_admin() 
    OR EXISTS (
      SELECT 1 FROM public.commerces 
      WHERE owner_id = auth.uid() 
      AND status = 'approved'::commerce_status
    )
  )
);