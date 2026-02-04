-- Add Instagram and Facebook URL columns to commerces table
ALTER TABLE public.commerces
ADD COLUMN instagram_url text DEFAULT NULL,
ADD COLUMN facebook_url text DEFAULT NULL;