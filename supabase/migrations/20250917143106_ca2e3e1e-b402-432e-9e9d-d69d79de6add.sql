-- Make driver-documents bucket public temporarily for testing
UPDATE storage.buckets 
SET public = true 
WHERE id = 'driver-documents';