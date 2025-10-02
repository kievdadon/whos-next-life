-- Drop and recreate views with SECURITY INVOKER (safer than SECURITY DEFINER)
DROP VIEW IF EXISTS business_applications_safe;
DROP VIEW IF EXISTS driver_applications_safe;

-- Recreate views with SECURITY INVOKER (uses querying user's permissions)
CREATE VIEW business_applications_safe 
WITH (security_invoker = true) AS
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

CREATE VIEW driver_applications_safe 
WITH (security_invoker = true) AS
SELECT 
  id, full_name, email, phone, address, city, state, zip_code,
  license_number, vehicle_type, vehicle_year, vehicle_make, vehicle_model,
  insurance_policy, insurance_provider, availability, experience, status,
  approved_at, created_at, updated_at, drivers_license_url, secondary_id_url,
  emergency_contact_name, emergency_contact_phone, date_of_birth, payout_enabled,
  stripe_connect_account_id
FROM driver_applications;