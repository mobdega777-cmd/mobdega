-- Add table_payment_required column to commerces
-- When true: shows payment modal for table orders
-- When false: skips payment and sends order directly to status tracking

ALTER TABLE public.commerces 
ADD COLUMN table_payment_required boolean NOT NULL DEFAULT true;