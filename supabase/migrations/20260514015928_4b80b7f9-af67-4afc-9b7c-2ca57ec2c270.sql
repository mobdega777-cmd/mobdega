-- Configuração global de cobrança por transação
CREATE TABLE IF NOT EXISTS public.transaction_billing_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  charge_type text NOT NULL DEFAULT 'fixed',
  charge_value numeric NOT NULL DEFAULT 0,
  min_invoice_amount numeric NOT NULL DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT charge_type_check CHECK (charge_type IN ('fixed','percent'))
);

ALTER TABLE public.transaction_billing_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view transaction billing config"
  ON public.transaction_billing_config FOR SELECT
  USING (true);

CREATE POLICY "Master admin can manage transaction billing config"
  ON public.transaction_billing_config FOR ALL
  USING (is_master_admin())
  WITH CHECK (is_master_admin());

CREATE TRIGGER update_transaction_billing_config_updated_at
  BEFORE UPDATE ON public.transaction_billing_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed registro padrão único
INSERT INTO public.transaction_billing_config (charge_type, charge_value, min_invoice_amount, description)
VALUES ('fixed', 0.50, 0, 'Taxa por transação realizada')
ON CONFLICT DO NOTHING;

-- Marcar pedidos já cobrados
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS transaction_billed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS billed_invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_transaction_billed
  ON public.orders(commerce_id, transaction_billed);

-- RPC: calcular pendência de cobrança por transação para um comércio
CREATE OR REPLACE FUNCTION public.get_pending_transaction_billing(p_commerce_id uuid)
RETURNS TABLE(orders_count integer, total_sales numeric, calculated_amount numeric)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cfg record;
  v_count integer := 0;
  v_total numeric := 0;
  v_calc numeric := 0;
BEGIN
  SELECT charge_type, charge_value, min_invoice_amount
  INTO v_cfg
  FROM public.transaction_billing_config
  ORDER BY created_at ASC
  LIMIT 1;

  SELECT COUNT(*)::int, COALESCE(SUM(total),0)
  INTO v_count, v_total
  FROM public.orders
  WHERE commerce_id = p_commerce_id
    AND transaction_billed = false
    AND status IN ('delivered'::order_status, 'preparing'::order_status, 'ready'::order_status, 'pending'::order_status);

  IF v_cfg.charge_type = 'percent' THEN
    v_calc := ROUND(v_total * (COALESCE(v_cfg.charge_value,0) / 100.0), 2);
  ELSE
    v_calc := ROUND(v_count * COALESCE(v_cfg.charge_value,0), 2);
  END IF;

  IF v_calc < COALESCE(v_cfg.min_invoice_amount, 0) THEN
    v_calc := v_cfg.min_invoice_amount;
  END IF;

  RETURN QUERY SELECT v_count, v_total, v_calc;
END;
$$;

-- RPC: marcar pedidos como cobrados ao criar fatura
CREATE OR REPLACE FUNCTION public.mark_orders_as_billed(p_commerce_id uuid, p_invoice_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  IF NOT is_master_admin() THEN
    RAISE EXCEPTION 'Only master admin can mark orders as billed';
  END IF;

  UPDATE public.orders
  SET transaction_billed = true,
      billed_invoice_id = p_invoice_id
  WHERE commerce_id = p_commerce_id
    AND transaction_billed = false;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;