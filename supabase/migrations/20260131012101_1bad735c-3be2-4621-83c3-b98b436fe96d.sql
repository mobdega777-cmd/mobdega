-- Add temporary password flag to commerces table
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS force_password_change boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS temp_password_set_at timestamp with time zone;

-- Add comment for documentation
COMMENT ON COLUMN public.commerces.force_password_change IS 'Flag to force user to change password on next login';
COMMENT ON COLUMN public.commerces.temp_password_set_at IS 'Timestamp when temporary password was set by admin';