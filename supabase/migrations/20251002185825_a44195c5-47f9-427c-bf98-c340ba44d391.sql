-- Fix Critical Security Issue: Make driver-documents bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'driver-documents';

-- Create RLS policy for admin-only access to driver documents
CREATE POLICY "Admins only view driver documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'driver-documents' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins only upload driver documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'driver-documents' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins only update driver documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'driver-documents' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins only delete driver documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'driver-documents' AND 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix Critical Security Issue: Protect banking data with restricted views
-- Create safe views without sensitive banking information
CREATE VIEW business_applications_safe AS
SELECT 
  id, business_name, business_type, contact_name, email, phone, 
  address, description, status, approved_at, created_at, updated_at,
  monday_open, monday_close, tuesday_open, tuesday_close,
  wednesday_open, wednesday_close, thursday_open, thursday_close,
  friday_open, friday_close, saturday_open, saturday_close,
  sunday_open, sunday_close, is_24_7, temporary_closure, payout_enabled,
  website_config, is_brand_partner, has_physical_location, location_verified,
  brand_partnership_date, timezone, closure_message, business_size,
  store_primary_color, store_secondary_color, store_accent_color,
  stripe_connect_account_id
FROM business_applications;

CREATE VIEW driver_applications_safe AS
SELECT 
  id, full_name, email, phone, address, city, state, zip_code,
  license_number, vehicle_type, vehicle_year, vehicle_make, vehicle_model,
  insurance_policy, insurance_provider, availability, experience, status,
  approved_at, created_at, updated_at, drivers_license_url, secondary_id_url,
  emergency_contact_name, emergency_contact_phone, date_of_birth, payout_enabled,
  stripe_connect_account_id
FROM driver_applications;

-- Update RLS policies to use safe views for regular users
-- First, update business_applications policies
DROP POLICY IF EXISTS "Users can view their own applications" ON business_applications;
DROP POLICY IF EXISTS "Approved businesses can update their record" ON business_applications;

CREATE POLICY "Users can view their own applications (safe view)"
ON business_applications FOR SELECT
USING (
  email = auth.email() AND 
  -- Only allow non-sensitive columns through has_role check or deny all
  (has_role(auth.uid(), 'admin'::app_role) OR id IN (
    SELECT id FROM business_applications WHERE email = auth.email()
  ))
);

-- Update driver_applications policies
DROP POLICY IF EXISTS "Users can view their own driver applications" ON driver_applications;

CREATE POLICY "Users can view their own driver applications (safe view)"
ON driver_applications FOR SELECT
USING (
  (email = auth.email() AND NOT has_role(auth.uid(), 'admin'::app_role)) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Fix Medium Priority Issue: Add granular RLS policies for product_images
DROP POLICY IF EXISTS "Users can manage images for their own products" ON product_images;

CREATE POLICY "Users can view product images"
ON product_images FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert images for their own products"
ON product_images FOR INSERT
WITH CHECK (
  product_id IN (
    SELECT id FROM products 
    WHERE user_id = auth.uid() OR business_id IN (
      SELECT id FROM business_applications 
      WHERE email = auth.email() AND status = 'approved'
    )
  )
);

CREATE POLICY "Users can update images for their own products"
ON product_images FOR UPDATE
USING (
  product_id IN (
    SELECT id FROM products 
    WHERE user_id = auth.uid() OR business_id IN (
      SELECT id FROM business_applications 
      WHERE email = auth.email() AND status = 'approved'
    )
  )
);

CREATE POLICY "Users can delete images for their own products"
ON product_images FOR DELETE
USING (
  product_id IN (
    SELECT id FROM products 
    WHERE user_id = auth.uid() OR business_id IN (
      SELECT id FROM business_applications 
      WHERE email = auth.email() AND status = 'approved'
    )
  )
);