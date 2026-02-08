-- Atualizar constraint para incluir tipo 'pos' para vendas de balcão/PDV
ALTER TABLE public.orders DROP CONSTRAINT orders_order_type_check;

ALTER TABLE public.orders ADD CONSTRAINT orders_order_type_check 
CHECK (order_type = ANY (ARRAY['delivery'::text, 'pickup'::text, 'table'::text, 'pos'::text]));