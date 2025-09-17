-- Create storage policies for driver documents
CREATE POLICY "Users can upload their own driver documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own driver documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own driver documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own driver documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'driver-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);