-- Allow commerce owners to update their own upgrade request fields
-- The existing policy already allows owners to update their own commerce:
-- "Commerce owners can update their own" - USING: ((owner_id = auth.uid()) OR is_master_admin())

-- Create notification type for upgrade requests
-- No changes needed, just use the existing notification system