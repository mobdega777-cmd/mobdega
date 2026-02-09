
-- Trigger function to auto-log system updates
CREATE OR REPLACE FUNCTION public.log_system_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_module text;
  v_type text;
  v_description text;
BEGIN
  v_module := TG_ARGV[0];

  IF TG_OP = 'INSERT' THEN
    v_type := 'create';
  ELSIF TG_OP = 'DELETE' THEN
    v_type := 'update';
  ELSE
    v_type := 'update';
  END IF;

  -- Build description based on table
  CASE TG_TABLE_NAME
    WHEN 'products' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo produto cadastrado: ' || NEW.name;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Produto removido: ' || OLD.name;
      ELSE
        v_description := 'Produto atualizado: ' || NEW.name;
      END IF;

    WHEN 'categories' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Nova categoria criada: ' || NEW.name;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Categoria removida: ' || OLD.name;
      ELSE
        v_description := 'Categoria atualizada: ' || NEW.name;
      END IF;

    WHEN 'commerces' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo comércio cadastrado: ' || NEW.fantasy_name;
      ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
          v_description := 'Status do comércio ' || NEW.fantasy_name || ' alterado para ' || NEW.status;
        ELSIF OLD.plan_id IS DISTINCT FROM NEW.plan_id THEN
          v_description := 'Plano do comércio ' || NEW.fantasy_name || ' atualizado';
        ELSIF OLD.is_open IS DISTINCT FROM NEW.is_open THEN
          v_description := 'Comércio ' || NEW.fantasy_name || CASE WHEN NEW.is_open THEN ' abriu' ELSE ' fechou' END;
        ELSE
          v_description := 'Configurações do comércio ' || NEW.fantasy_name || ' atualizadas';
        END IF;
      ELSE
        v_description := 'Comércio removido: ' || OLD.fantasy_name;
      END IF;

    WHEN 'orders' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo pedido #' || LEFT(NEW.id::text, 8) || ' criado';
      ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        v_description := 'Pedido #' || LEFT(NEW.id::text, 8) || ' atualizado para ' || NEW.status;
      ELSE
        RETURN COALESCE(NEW, OLD);
      END IF;

    WHEN 'invoices' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Nova fatura gerada ref. ' || NEW.reference_month;
      ELSIF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
        v_description := 'Fatura ref. ' || NEW.reference_month || ' atualizada para ' || NEW.status;
      ELSE
        RETURN COALESCE(NEW, OLD);
      END IF;

    WHEN 'plans' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo plano criado: ' || NEW.name;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Plano removido: ' || OLD.name;
      ELSE
        v_description := 'Plano atualizado: ' || NEW.name;
      END IF;

    WHEN 'commerce_coupons' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo cupom criado: ' || NEW.code;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Cupom removido: ' || OLD.code;
      ELSE
        v_description := 'Cupom atualizado: ' || NEW.code;
      END IF;

    WHEN 'delivery_zones' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Nova zona de entrega: ' || NEW.name;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Zona de entrega removida: ' || OLD.name;
      ELSE
        v_description := 'Zona de entrega atualizada: ' || NEW.name;
      END IF;

    WHEN 'payment_methods' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo método de pagamento: ' || NEW.name;
      ELSE
        v_description := 'Método de pagamento atualizado: ' || NEW.name;
      END IF;

    WHEN 'tables' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Nova mesa cadastrada: #' || NEW.number;
      ELSIF TG_OP = 'DELETE' THEN
        v_description := 'Mesa removida: #' || OLD.number;
      ELSE
        v_description := 'Mesa atualizada: #' || NEW.number;
      END IF;

    WHEN 'expenses' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Nova despesa registrada: ' || NEW.name;
      ELSE
        v_description := 'Despesa atualizada: ' || NEW.name;
      END IF;

    WHEN 'profiles' THEN
      IF TG_OP = 'INSERT' THEN
        v_description := 'Novo usuário cadastrado: ' || NEW.full_name;
      ELSE
        RETURN COALESCE(NEW, OLD);
      END IF;

    ELSE
      v_description := TG_OP || ' em ' || TG_TABLE_NAME;
  END CASE;

  INSERT INTO public.system_updates (type, module, description, published_at)
  VALUES (v_type, v_module, v_description, now());

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers on key tables
CREATE TRIGGER trg_system_update_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Produtos');

CREATE TRIGGER trg_system_update_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Categorias');

CREATE TRIGGER trg_system_update_commerces
  AFTER INSERT OR UPDATE ON public.commerces
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Comércios');

CREATE TRIGGER trg_system_update_orders
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Pedidos');

CREATE TRIGGER trg_system_update_invoices
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Financeiro');

CREATE TRIGGER trg_system_update_plans
  AFTER INSERT OR UPDATE OR DELETE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Planos');

CREATE TRIGGER trg_system_update_coupons
  AFTER INSERT OR UPDATE OR DELETE ON public.commerce_coupons
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Cupons');

CREATE TRIGGER trg_system_update_delivery
  AFTER INSERT OR UPDATE OR DELETE ON public.delivery_zones
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Delivery');

CREATE TRIGGER trg_system_update_payment
  AFTER INSERT OR UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Pagamentos');

CREATE TRIGGER trg_system_update_tables
  AFTER INSERT OR UPDATE OR DELETE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Mesas/Comandas');

CREATE TRIGGER trg_system_update_expenses
  AFTER INSERT OR UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Financeiro');

CREATE TRIGGER trg_system_update_profiles
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_system_update('Clientes');
