-- Create storage bucket for driver application documents
INSERT INTO storage.buckets (id, name, public) VALUES ('driver-documents', 'driver-documents', false);

-- Create RLS policies for driver documents storage
CREATE POLICY "Users can upload their own driver documents"
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own driver documents"
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own driver documents"
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add columns to driver_applications table for document storage
ALTER TABLE driver_applications 
ADD COLUMN drivers_license_url text,
ADD COLUMN secondary_id_url text,
ADD COLUMN date_of_birth date,
ADD COLUMN emergency_contact_name text,
ADD COLUMN emergency_contact_phone text,
ADD COLUMN city text,
ADD COLUMN state text,
ADD COLUMN zip_code text,
ADD COLUMN insurance_provider text;