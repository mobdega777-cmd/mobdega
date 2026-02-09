
-- Add reply columns to reviews
ALTER TABLE public.reviews ADD COLUMN commerce_reply text;
ALTER TABLE public.reviews ADD COLUMN commerce_reply_at timestamptz;

-- Trigger to notify commerce on new review
CREATE OR REPLACE FUNCTION public.notify_commerce_on_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  VALUES (NEW.commerce_id, 'new_review', 'Nova Avaliação', 
    'Você recebeu uma avaliação de ' || NEW.rating || ' estrelas.');
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_notify_commerce_on_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_commerce_on_new_review();

-- RLS policy for commerce owner to reply
CREATE POLICY "Commerce owner can reply to reviews"
  ON public.reviews FOR UPDATE
  USING (is_commerce_owner_or_admin(commerce_id))
  WITH CHECK (is_commerce_owner_or_admin(commerce_id));
