-- Add bill_requested fields to table_participants for "Pedir Conta" functionality
ALTER TABLE public.table_participants 
ADD COLUMN IF NOT EXISTS bill_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bill_requested_at TIMESTAMPTZ DEFAULT NULL;

-- Add index for quick lookups of pending bill requests
CREATE INDEX IF NOT EXISTS idx_table_participants_bill_requested 
ON public.table_participants(session_id) 
WHERE bill_requested = true;