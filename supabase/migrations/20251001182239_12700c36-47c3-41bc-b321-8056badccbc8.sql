-- Create storage bucket for worker profile photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('worker-profiles', 'worker-profiles', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for worker-profiles bucket
CREATE POLICY "Anyone can view worker profile photos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'worker-profiles');

CREATE POLICY "Authenticated users can upload their own profile photo"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'worker-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile photo"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'worker-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile photo"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'worker-profiles' AND
  auth.uid()::text = (storage.foldername(name))[1]
);