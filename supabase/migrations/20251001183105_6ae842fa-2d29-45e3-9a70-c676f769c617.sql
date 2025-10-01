-- Add image fields to gigs table
ALTER TABLE public.gigs 
ADD COLUMN IF NOT EXISTS image_url text,
ADD COLUMN IF NOT EXISTS image_urls text[] DEFAULT '{}';

-- Create storage bucket for gig images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gig-images', 'gig-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for gig-images bucket
CREATE POLICY "Anyone can view gig images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'gig-images');

CREATE POLICY "Authenticated users can upload gig images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'gig-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own gig images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'gig-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own gig images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'gig-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);