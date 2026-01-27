-- Add change_for column to table_participants for cash payment change tracking
ALTER TABLE public.table_participants 
ADD COLUMN change_for numeric(10,2) DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.table_participants.change_for IS 'Amount customer will pay in cash (for calculating change needed)';