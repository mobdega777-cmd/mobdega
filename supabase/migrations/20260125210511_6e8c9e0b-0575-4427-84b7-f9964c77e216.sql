-- Create table for commerce photos (gallery)
CREATE TABLE public.commerce_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  commerce_id UUID NOT NULL REFERENCES public.commerces(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.commerce_photos ENABLE ROW LEVEL SECURITY;

-- Commerce owners can manage their own photos
CREATE POLICY "Commerce owners can view their photos"
ON public.commerce_photos FOR SELECT
USING (public.is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Commerce owners can insert photos"
ON public.commerce_photos FOR INSERT
WITH CHECK (public.is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Commerce owners can update photos"
ON public.commerce_photos FOR UPDATE
USING (public.is_commerce_owner_or_admin(commerce_id));

CREATE POLICY "Commerce owners can delete photos"
ON public.commerce_photos FOR DELETE
USING (public.is_commerce_owner_or_admin(commerce_id));

-- Authenticated users can view photos of approved commerces
CREATE POLICY "Authenticated users can view approved commerce photos"
ON public.commerce_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.commerces
    WHERE id = commerce_id AND status = 'approved'
  )
);

-- Create table for training videos
CREATE TABLE public.training_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT DEFAULT 'geral',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;

-- Master admin can manage videos
CREATE POLICY "Master admin can manage training videos"
ON public.training_videos FOR ALL
USING (public.is_master_admin());

-- Commerce owners can view active videos
CREATE POLICY "Commerce users can view active training videos"
ON public.training_videos FOR SELECT
USING (
  is_active = true AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('commerce', 'master_admin')
  )
);

-- Add payment_due_day to commerces table for contract
ALTER TABLE public.commerces 
ADD COLUMN IF NOT EXISTS payment_due_day INTEGER DEFAULT 10;

-- Trigger for updated_at
CREATE TRIGGER update_commerce_photos_updated_at
BEFORE UPDATE ON public.commerce_photos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_training_videos_updated_at
BEFORE UPDATE ON public.training_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();