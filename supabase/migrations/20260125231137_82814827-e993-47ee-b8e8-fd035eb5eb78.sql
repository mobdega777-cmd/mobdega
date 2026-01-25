-- Add payment_method column to table_participants for bill request
ALTER TABLE public.table_participants 
ADD COLUMN IF NOT EXISTS selected_payment_method TEXT DEFAULT NULL;

COMMENT ON COLUMN public.table_participants.selected_payment_method IS 'Payment method selected when requesting the bill';
