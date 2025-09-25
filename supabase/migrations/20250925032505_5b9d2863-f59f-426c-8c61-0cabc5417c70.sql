-- Add fields to track brand partnership and business verification status
ALTER TABLE business_applications 
ADD COLUMN is_brand_partner boolean DEFAULT false,
ADD COLUMN has_physical_location boolean DEFAULT false,
ADD COLUMN location_verified boolean DEFAULT false,
ADD COLUMN business_size text DEFAULT 'local',
ADD COLUMN brand_partnership_date timestamp with time zone;

-- Add comments for clarity
COMMENT ON COLUMN business_applications.is_brand_partner IS 'True for official brand partnerships (Walmart, H&M, etc.)';
COMMENT ON COLUMN business_applications.has_physical_location IS 'True if business has a physical storefront open to public';
COMMENT ON COLUMN business_applications.location_verified IS 'True if physical location has been verified';
COMMENT ON COLUMN business_applications.business_size IS 'Size classification: local, regional, national, international';
COMMENT ON COLUMN business_applications.brand_partnership_date IS 'Date when brand partnership was established';