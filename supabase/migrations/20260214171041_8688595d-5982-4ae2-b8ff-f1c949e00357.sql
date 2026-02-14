DROP POLICY IF EXISTS "Commerce owners can view active training videos" 
  ON public.training_videos;

CREATE POLICY "Commerce owners can view active training videos" 
  ON public.training_videos 
  FOR SELECT 
  USING (
    is_active = true AND (
      is_master_admin() OR 
      EXISTS (
        SELECT 1 FROM commerces 
        WHERE commerces.owner_id = auth.uid() 
        AND commerces.status IN ('approved', 'pending')
      )
    )
  );