
-- 1. PROFILES: Remove overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 2. PROFILES: Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 3. PROFILES: Commerce owners can view profiles of customers who ordered from them
CREATE POLICY "Commerce owners can view customer profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.commerces c ON c.id = o.commerce_id
    WHERE o.user_id = profiles.user_id
      AND c.owner_id = auth.uid()
  )
);

-- 4. PROFILES: Master admin can view all profiles
CREATE POLICY "Master admin can view all profiles"
ON public.profiles
FOR SELECT
USING (is_master_admin());

-- 5. CASH_REGISTERS: Remove generic ALL policy
DROP POLICY IF EXISTS "Commerce owners can manage cash registers" ON public.cash_registers;

-- 6. CASH_REGISTERS: Granular SELECT
CREATE POLICY "Commerce owners can view cash registers"
ON public.cash_registers
FOR SELECT
USING (is_commerce_owner_or_admin(commerce_id));

-- 7. CASH_REGISTERS: Granular INSERT
CREATE POLICY "Commerce owners can create cash registers"
ON public.cash_registers
FOR INSERT
WITH CHECK (is_commerce_owner_or_admin(commerce_id));

-- 8. CASH_REGISTERS: Granular UPDATE
CREATE POLICY "Commerce owners can update cash registers"
ON public.cash_registers
FOR UPDATE
USING (is_commerce_owner_or_admin(commerce_id));

-- 9. CASH_REGISTERS: Granular DELETE
CREATE POLICY "Commerce owners can delete cash registers"
ON public.cash_registers
FOR DELETE
USING (is_commerce_owner_or_admin(commerce_id));

-- 10. COMMERCE_NOTIFICATIONS: Add DELETE for commerce owners
CREATE POLICY "Commerce owners can delete their notifications"
ON public.commerce_notifications
FOR DELETE
USING (
  commerce_id IN (
    SELECT id FROM public.commerces WHERE owner_id = auth.uid()
  )
);
