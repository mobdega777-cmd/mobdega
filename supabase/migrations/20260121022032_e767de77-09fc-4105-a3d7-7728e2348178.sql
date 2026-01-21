-- Atomic stock deduction when an order is finalized (delivered)

-- Helper: apply stock deduction for a delivered order only once
CREATE OR REPLACE FUNCTION public.apply_stock_deduction_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rowcount integer;
BEGIN
  -- Mark as deducted only if not yet deducted (prevents double-run even under concurrency)
  UPDATE public.orders
  SET stock_deducted = true
  WHERE id = _order_id
    AND stock_deducted = false
    AND status = 'delivered'::order_status;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;

  -- If already deducted (or not delivered), do nothing
  IF v_rowcount = 0 THEN
    RETURN;
  END IF;

  -- Deduct stock per item (clamp at 0)
  UPDATE public.products p
  SET stock = GREATEST(0, COALESCE(p.stock, 0) - oi.quantity)
  FROM public.order_items oi
  WHERE oi.order_id = _order_id
    AND oi.product_id = p.id;
END;
$$;

-- Trigger function: when an order becomes delivered (insert or update), apply deduction
CREATE OR REPLACE FUNCTION public.tg_orders_apply_stock_deduction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT: delivered orders should deduct once
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'delivered'::order_status THEN
      PERFORM public.apply_stock_deduction_for_order(NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  -- On UPDATE: only when status transitions to delivered
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'delivered'::order_status AND (OLD.status IS DISTINCT FROM NEW.status) THEN
      PERFORM public.apply_stock_deduction_for_order(NEW.id);
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_apply_stock_deduction ON public.orders;
CREATE TRIGGER orders_apply_stock_deduction
AFTER INSERT OR UPDATE OF status ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.tg_orders_apply_stock_deduction();
