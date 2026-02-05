-- Create storage bucket for training videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'training-videos', 
  'training-videos', 
  true,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read training videos (public bucket)
CREATE POLICY "Training videos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'training-videos');

-- Only authenticated users can upload (admin check done in app)
CREATE POLICY "Authenticated users can upload training videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'training-videos' AND auth.role() = 'authenticated');

-- Only authenticated users can delete (admin check done in app)
CREATE POLICY "Authenticated users can delete training videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'training-videos' AND auth.role() = 'authenticated');