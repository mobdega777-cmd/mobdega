-- 1. Corrigir política de Tables para prevenir DoS cross-commerce
DROP POLICY IF EXISTS "Users can claim available tables" ON public.tables;

CREATE POLICY "Users can claim available tables"
ON public.tables
FOR UPDATE
TO authenticated
USING (
  (status = 'available'::table_status OR status IS NULL)
  AND (
    session_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM table_participants tp
      JOIN table_sessions ts ON ts.id = tp.session_id
      WHERE ts.table_id = tables.id 
      AND tp.user_id = auth.uid()
      AND ts.status = 'active'
    )
  )
)
WITH CHECK (status = 'occupied'::table_status);

-- 2. Criar view pública de reviews para anonimizar user_id
CREATE OR REPLACE VIEW public.reviews_public AS
SELECT 
  id,
  commerce_id,
  rating,
  comment,
  created_at
FROM public.reviews;

-- 3. Conceder permissões na view
GRANT SELECT ON public.reviews_public TO anon;
GRANT SELECT ON public.reviews_public TO authenticated;