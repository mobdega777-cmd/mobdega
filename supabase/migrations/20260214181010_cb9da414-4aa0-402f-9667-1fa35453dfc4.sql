
-- 1. Notify all approved commerces on new forum topic
CREATE OR REPLACE FUNCTION public.notify_commerces_on_new_forum_topic()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  SELECT 
    c.id,
    'new_forum_topic',
    'Novo Tópico no Fórum',
    'Novo tópico: ' || NEW.title
  FROM public.commerces c
  WHERE c.status = 'approved';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerces_on_new_forum_topic
AFTER INSERT ON public.forum_topics
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerces_on_new_forum_topic();

-- 2. Notify commerce when a user favorites their store
CREATE OR REPLACE FUNCTION public.notify_commerce_on_new_favorite()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_name text;
BEGIN
  SELECT p.full_name INTO v_user_name
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id
  LIMIT 1;

  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  VALUES (
    NEW.commerce_id,
    'new_favorite',
    'Novo Favorito!',
    COALESCE(v_user_name, 'Um usuário') || ' favoritou sua loja!'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerce_on_new_favorite
AFTER INSERT ON public.favorites
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerce_on_new_favorite();

-- 3. Notify commerce on new order
CREATE OR REPLACE FUNCTION public.notify_commerce_on_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order_type_label text;
BEGIN
  v_order_type_label := CASE 
    WHEN NEW.order_type = 'delivery' THEN 'delivery'
    WHEN NEW.order_type = 'table' THEN 'mesa'
    ELSE 'balcão'
  END;

  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  VALUES (
    NEW.commerce_id,
    'new_order',
    'Novo Pedido Recebido',
    'Novo pedido de ' || v_order_type_label || ' no valor de R$ ' || TRIM(TO_CHAR(NEW.total, 'FM999G999D00')) || '.'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerce_on_new_order
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerce_on_new_order();

-- 4. Notify commerce on low stock (<=5 and >0)
CREATE OR REPLACE FUNCTION public.notify_commerce_on_low_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.stock IS NOT NULL AND NEW.stock <= 5 AND NEW.stock > 0 
     AND (OLD.stock IS NULL OR OLD.stock > 5) THEN
    INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
    VALUES (
      NEW.commerce_id,
      'low_stock',
      'Estoque Baixo!',
      NEW.name || ' com apenas ' || NEW.stock || ' unidade(s) em estoque!'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerce_on_low_stock
AFTER UPDATE ON public.products
FOR EACH ROW
WHEN (NEW.stock IS DISTINCT FROM OLD.stock)
EXECUTE FUNCTION public.notify_commerce_on_low_stock();

-- 5. Notify all approved commerces on new system update
CREATE OR REPLACE FUNCTION public.notify_commerces_on_new_system_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  SELECT 
    c.id,
    'new_system_update',
    'Atualização do Sistema',
    NEW.module || ': ' || NEW.description
  FROM public.commerces c
  WHERE c.status = 'approved';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerces_on_new_system_update
AFTER INSERT ON public.system_updates
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerces_on_new_system_update();

-- 6. Notify commerce when someone replies to their forum topic
CREATE OR REPLACE FUNCTION public.notify_commerce_on_forum_reply()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_topic record;
BEGIN
  SELECT ft.title, ft.author_type, ft.commerce_id
  INTO v_topic
  FROM public.forum_topics ft
  WHERE ft.id = NEW.topic_id;

  -- Only notify if topic was created by a commerce and reply is not from the same commerce
  IF v_topic.author_type = 'commerce' AND v_topic.commerce_id IS NOT NULL 
     AND (NEW.commerce_id IS NULL OR NEW.commerce_id != v_topic.commerce_id) THEN
    INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
    VALUES (
      v_topic.commerce_id,
      'forum_reply',
      'Resposta no Fórum',
      NEW.author_name || ' respondeu ao seu tópico: ' || v_topic.title
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerce_on_forum_reply
AFTER INSERT ON public.forum_replies
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerce_on_forum_reply();

-- 7. Notify commerce on cash register open/close
CREATE OR REPLACE FUNCTION public.notify_commerce_on_cash_register()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
    VALUES (
      NEW.commerce_id,
      'cash_register_event',
      'Caixa Aberto',
      'Caixa aberto com valor inicial de R$ ' || TRIM(TO_CHAR(NEW.opening_amount, 'FM999G999D00')) || '.'
    );
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'closed' AND OLD.status != 'closed' THEN
    INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
    VALUES (
      NEW.commerce_id,
      'cash_register_event',
      'Caixa Fechado',
      'Caixa fechado. Diferença: R$ ' || TRIM(TO_CHAR(COALESCE(NEW.difference, 0), 'FM999G999D00')) || '.'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_commerce_on_cash_register
AFTER INSERT OR UPDATE ON public.cash_registers
FOR EACH ROW
EXECUTE FUNCTION public.notify_commerce_on_cash_register();
