-- Allow customers to view tables for ordering
CREATE POLICY "Anyone can view tables for commerce"
ON public.tables
FOR SELECT
USING (true);