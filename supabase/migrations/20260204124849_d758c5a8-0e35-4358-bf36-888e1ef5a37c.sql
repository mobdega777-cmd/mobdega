-- Adicionar campos de vencimento e pagamento para despesas
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS due_date date,
ADD COLUMN IF NOT EXISTS is_paid boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone;