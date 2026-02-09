
-- Trigger: notify all approved commerces when a new training video is added
CREATE OR REPLACE FUNCTION public.notify_commerces_on_new_training_video()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.commerce_notifications (commerce_id, type, title, message)
  SELECT 
    c.id,
    'new_training_video',
    'Novo Vídeo de Treinamento',
    'Um novo vídeo foi adicionado: ' || NEW.title
  FROM public.commerces c
  WHERE c.status = 'approved';
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_training_video
  AFTER INSERT ON public.training_videos
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_commerces_on_new_training_video();
