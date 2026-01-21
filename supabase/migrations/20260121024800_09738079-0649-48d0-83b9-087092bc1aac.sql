-- Allow commerce owners to view profiles of customers who placed orders at their commerce
CREATE POLICY "Commerce owners can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.commerces c ON o.commerce_id = c.id
    WHERE o.user_id = profiles.user_id
    AND c.owner_id = auth.uid()
  )
);