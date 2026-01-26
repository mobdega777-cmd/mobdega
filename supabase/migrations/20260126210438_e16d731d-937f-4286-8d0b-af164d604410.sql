-- Restringir políticas do billing_config para apenas master_admin
DROP POLICY IF EXISTS "Anyone can read billing config" ON public.billing_config;

CREATE POLICY "Only master admin can read billing config"
ON public.billing_config
FOR SELECT
USING (is_master_admin());

-- Adicionar políticas restritivas para storage.objects no bucket commerce-assets
-- Restringir UPDATE apenas para donos ou admins
CREATE POLICY "Only owners can update commerce assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'commerce-assets' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_master_admin()
  )
);

-- Restringir DELETE apenas para donos ou admins
CREATE POLICY "Only owners can delete commerce assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'commerce-assets' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR is_master_admin()
  )
);