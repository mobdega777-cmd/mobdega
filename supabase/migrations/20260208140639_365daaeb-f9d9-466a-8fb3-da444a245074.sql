-- Allow commerce owners to insert orders on behalf of customers (for POS/Caixa functionality)
CREATE POLICY "Commerce owners can create orders for their tables"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_commerce_owner_or_admin(commerce_id)
);