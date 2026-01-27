-- =====================================================
-- SECURITY HARDENING MIGRATION
-- Fixes critical RLS vulnerabilities identified in scan
-- =====================================================

-- 1. STORAGE: Remove conflicting permissive policies
-- These policies allowed any authenticated user to modify commerce assets
DROP POLICY IF EXISTS "Users can update their own commerce assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own commerce assets" ON storage.objects;

-- 2. PROFILES: Remove commerce owners access to customer profiles
-- Commerce owners should only see delivery info from orders table, not full profiles
DROP POLICY IF EXISTS "Commerce owners can view customer profiles" ON public.profiles;

-- 3. PAYMENT_METHODS: Restrict to authenticated users only
-- This prevents anonymous users from seeing PIX keys and banking info
DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;

CREATE POLICY "Authenticated users can view active payment methods"
ON public.payment_methods FOR SELECT
TO authenticated
USING ((is_active = true) OR is_commerce_owner_or_admin(commerce_id));

-- 4. TABLE_PARTICIPANTS: Restrict visibility to participants and commerce owners
DROP POLICY IF EXISTS "Anyone can view table participants" ON public.table_participants;

CREATE POLICY "Participants and commerce owners can view table participants"
ON public.table_participants FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.table_participants tp2
    WHERE tp2.session_id = table_participants.session_id
    AND tp2.user_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.table_sessions ts
    WHERE ts.id = table_participants.session_id
    AND is_commerce_owner_or_admin(ts.commerce_id)
  )
  OR is_master_admin()
);

-- 5. TABLE_SESSIONS: Restrict visibility to participants and commerce owners
DROP POLICY IF EXISTS "Anyone can view table sessions for a commerce" ON public.table_sessions;

CREATE POLICY "Participants and commerce owners can view table sessions"
ON public.table_sessions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.table_participants tp
    WHERE tp.session_id = table_sessions.id
    AND tp.user_id = auth.uid()
  )
  OR is_commerce_owner_or_admin(commerce_id)
  OR is_master_admin()
);

-- 6. BILLING_CONFIG: Defense in depth - deny anonymous access
CREATE POLICY "Deny anonymous access to billing config"
ON public.billing_config FOR ALL
TO anon
USING (false);