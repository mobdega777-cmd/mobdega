-- Parte 1: Permitir que usuários autenticados insiram notificações
CREATE POLICY "Authenticated users can insert notifications"
ON public.admin_notifications
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Parte 2: Adicionar colunas de cupom na tabela orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS coupon_code text,
ADD COLUMN IF NOT EXISTS coupon_discount numeric DEFAULT 0;