-- Create storage policies for driver documents
CREATE POLICY "Drivers can upload their own documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text IN (
  SELECT customer_id::text FROM delivery_orders WHERE driver_id IN (
    SELECT id FROM driver_applications WHERE email = auth.email() AND status = 'approved'
  )
) OR bucket_id = 'driver-documents');

CREATE POLICY "Drivers can view their own documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-documents');

CREATE POLICY "Drivers can update their own documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'driver-documents');