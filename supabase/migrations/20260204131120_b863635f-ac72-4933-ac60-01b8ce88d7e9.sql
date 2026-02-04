-- Allow commerce owners to read billing config for payment info
CREATE POLICY "Commerce owners can read billing config"
ON public.billing_config
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.commerces 
        WHERE owner_id = auth.uid() 
        AND status = 'approved'
    )
);