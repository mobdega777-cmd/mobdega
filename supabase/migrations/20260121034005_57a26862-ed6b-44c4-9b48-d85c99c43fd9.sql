-- Allow commerce owners/admins to view favorites for their own commerce
-- This is required to correctly show the "Favoritaram" count in the commerce CRM dashboard.

ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commerce owners can view favorites for their commerce"
ON public.favorites
FOR SELECT
USING (public.is_commerce_owner_or_admin(commerce_id));
