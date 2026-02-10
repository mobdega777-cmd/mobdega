CREATE OR REPLACE FUNCTION public.apply_stock_deduction_for_order(_order_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rowcount integer;
  v_item record;
  v_component record;
  v_product record;
  v_min_stock integer;
BEGIN
  UPDATE public.orders
  SET stock_deducted = true
  WHERE id = _order_id
    AND stock_deducted = false
    AND status = 'delivered'::order_status;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;

  IF v_rowcount = 0 THEN
    RETURN;
  END IF;

  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
      AND oi.product_id IS NOT NULL
  LOOP
    SELECT is_composite, is_fractioned, fraction_per_serving
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    IF v_product.is_composite THEN
      FOR v_component IN
        SELECT cpi.component_product_id, cpi.quantity AS component_qty
        FROM public.composite_product_items cpi
        WHERE cpi.composite_product_id = v_item.product_id
      LOOP
        UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - (v_component.component_qty * v_item.quantity))
        WHERE id = v_component.component_product_id;
      END LOOP;

      SELECT MIN(
        CASE 
          WHEN cpi.quantity > 0 THEN FLOOR(COALESCE(cp.stock, 0)::numeric / cpi.quantity)
          ELSE 0
        END
      )::integer
      INTO v_min_stock
      FROM public.composite_product_items cpi
      JOIN public.products cp ON cp.id = cpi.component_product_id
      WHERE cpi.composite_product_id = v_item.product_id;

      UPDATE public.products
      SET stock = COALESCE(v_min_stock, 0)
      WHERE id = v_item.product_id;

    ELSE
      -- For all products (including fractioned), stock is in sellable units (doses for fractioned)
      -- Each sale deducts v_item.quantity directly
      UPDATE public.products
      SET stock = GREATEST(0, COALESCE(stock, 0) - v_item.quantity)
      WHERE id = v_item.product_id;
    END IF;
  END LOOP;
END;
$$;