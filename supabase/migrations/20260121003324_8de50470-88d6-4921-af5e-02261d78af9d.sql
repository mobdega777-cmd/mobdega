ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS stock_deducted boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_orders_stock_deducted ON public.orders (stock_deducted);
