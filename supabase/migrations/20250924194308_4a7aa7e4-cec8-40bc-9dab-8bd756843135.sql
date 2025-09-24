-- Drop the overly complex policies and create simple ones for drivers
DROP POLICY IF EXISTS "Drivers can upload their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can view their own documents" ON storage.objects;
DROP POLICY IF EXISTS "Drivers can update their own documents" ON storage.objects;

-- Create simple policies for driver photo uploads
CREATE POLICY "Authenticated users can upload to driver-documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view driver-documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-documents');

CREATE POLICY "Authenticated users can update driver-documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'driver-documents' AND auth.uid() IS NOT NULL);