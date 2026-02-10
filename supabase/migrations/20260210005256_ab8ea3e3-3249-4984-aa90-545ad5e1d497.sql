
-- 1. Novas colunas em products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_composite boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_fractioned boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS hide_from_menu boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fraction_unit text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fraction_total numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS fraction_per_serving numeric;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_per_serving numeric;

-- 2. Nova tabela composite_product_items
CREATE TABLE IF NOT EXISTS public.composite_product_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- RLS para composite_product_items
ALTER TABLE public.composite_product_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Commerce owners can manage composite items"
ON public.composite_product_items
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    JOIN public.commerces c ON c.id = p.commerce_id
    WHERE p.id = composite_product_items.composite_product_id
    AND (c.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'master_admin'))
  )
);

CREATE POLICY "Anyone can view composite items for active products"
ON public.composite_product_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.products p
    WHERE p.id = composite_product_items.composite_product_id
    AND p.is_active = true
  )
);

-- 3. Remover triggers indevidos de system_updates
DROP TRIGGER IF EXISTS trg_system_update_products ON public.products;
DROP TRIGGER IF EXISTS trg_system_update_categories ON public.categories;
DROP TRIGGER IF EXISTS trg_system_update_orders ON public.orders;
DROP TRIGGER IF EXISTS trg_system_update_expenses ON public.expenses;
DROP TRIGGER IF EXISTS trg_system_update_profiles ON public.profiles;
DROP TRIGGER IF EXISTS trg_system_update_coupons ON public.commerce_coupons;
DROP TRIGGER IF EXISTS trg_system_update_delivery ON public.delivery_zones;
DROP TRIGGER IF EXISTS trg_system_update_payment ON public.payment_methods;
DROP TRIGGER IF EXISTS trg_system_update_tables ON public.tables;

-- 4. Limpar registros indevidos da system_updates
DELETE FROM public.system_updates WHERE module IN ('Produtos','Categorias','Pedidos','Financeiro','Cupons','Delivery','Pagamentos','Mesas/Comandas','Clientes');

-- 5. Atualizar funcao de deducao de estoque para suportar produtos compostos
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
