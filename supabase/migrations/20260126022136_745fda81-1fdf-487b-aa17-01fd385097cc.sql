-- Allow commerce owners to update payment confirmation on their invoices
CREATE POLICY "Commerce owners can confirm payment" 
ON public.invoices 
FOR UPDATE 
USING (is_commerce_owner_or_admin(commerce_id))
WITH CHECK (is_commerce_owner_or_admin(commerce_id));