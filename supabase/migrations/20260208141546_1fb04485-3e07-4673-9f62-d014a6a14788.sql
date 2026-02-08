-- Allow commerce owners/admins to insert items into orders they manage (Caixa/PDV)

CREATE OR REPLACE FUNCTION public.can_manage_order(_order_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o
    WHERE o.id = _order_id
      AND public.is_commerce_owner_or_admin(o.commerce_id)
  );
$$;

-- RLS policy for order_items
CREATE POLICY "Commerce owners can insert order items"
ON public.order_items
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_order(order_id));