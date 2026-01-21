-- Allow any authenticated user to update tables from 'available' to 'occupied' status
-- This is needed for customers to claim an available table in the commerce storefront
CREATE POLICY "Users can claim available tables"
ON public.tables
FOR UPDATE
USING (
  -- Table must be currently available (or null = available)
  (status = 'available' OR status IS NULL)
)
WITH CHECK (
  -- Can only set to 'occupied'
  status = 'occupied'
);