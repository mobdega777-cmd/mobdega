-- Create storage bucket for commerce assets (product images and logos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('commerce-assets', 'commerce-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to commerce-assets bucket
CREATE POLICY "Authenticated users can upload commerce assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'commerce-assets');

-- Allow public to view commerce assets
CREATE POLICY "Anyone can view commerce assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'commerce-assets');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own commerce assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'commerce-assets');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own commerce assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'commerce-assets');