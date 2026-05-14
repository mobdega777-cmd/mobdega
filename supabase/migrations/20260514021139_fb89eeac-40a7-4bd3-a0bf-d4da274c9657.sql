CREATE OR REPLACE FUNCTION public.get_pending_transaction_billing(p_commerce_id uuid)
 RETURNS TABLE(orders_count integer, total_sales numeric, calculated_amount numeric)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    AND status IN ('delivered'::order_status, 'preparing'::order_status, 'delivering'::order_status, 'confirmed'::order_status, 'pending'::order_status);

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
$function$;