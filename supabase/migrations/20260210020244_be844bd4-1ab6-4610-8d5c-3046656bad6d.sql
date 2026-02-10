
CREATE OR REPLACE FUNCTION public.apply_stock_deduction_for_order(_order_id text)
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
  v_available integer;
BEGIN
  -- Mark as deducted only if not yet deducted
  UPDATE public.orders
  SET stock_deducted = true
  WHERE id = _order_id
    AND stock_deducted = false
    AND status = 'delivered'::order_status;

  GET DIAGNOSTICS v_rowcount = ROW_COUNT;

  IF v_rowcount = 0 THEN
    RETURN;
  END IF;

  -- Process each order item
  FOR v_item IN
    SELECT oi.product_id, oi.quantity
    FROM public.order_items oi
    WHERE oi.order_id = _order_id
      AND oi.product_id IS NOT NULL
  LOOP
    -- Check if product is composite
    SELECT is_composite, is_fractioned, fraction_per_serving
    INTO v_product
    FROM public.products
    WHERE id = v_item.product_id;

    IF v_product.is_composite THEN
      -- Deduct each component
      FOR v_component IN
        SELECT cpi.component_product_id, cpi.quantity AS component_qty,
               cp.is_fractioned AS comp_is_fractioned
        FROM public.composite_product_items cpi
        JOIN public.products cp ON cp.id = cpi.component_product_id
        WHERE cpi.composite_product_id = v_item.product_id
      LOOP
        UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - (v_component.component_qty * v_item.quantity))
        WHERE id = v_component.component_product_id;
      END LOOP;

      -- Recalculate composite product stock based on component availability (bottleneck)
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
      -- Normal product or fractioned: deduct directly
      IF v_product.is_fractioned AND v_product.fraction_per_serving IS NOT NULL THEN
        UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - (v_product.fraction_per_serving * v_item.quantity))
        WHERE id = v_item.product_id;
      ELSE
        UPDATE public.products
        SET stock = GREATEST(0, COALESCE(stock, 0) - v_item.quantity)
        WHERE id = v_item.product_id;
      END IF;
    END IF;
  END LOOP;
END;
$$;
