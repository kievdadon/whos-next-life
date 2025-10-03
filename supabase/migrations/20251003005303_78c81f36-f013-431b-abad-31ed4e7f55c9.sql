-- Create business_locations table for multi-location support
CREATE TABLE IF NOT EXISTS public.business_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES public.business_applications(id) ON DELETE CASCADE,
  location_name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.business_locations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view active locations
CREATE POLICY "Anyone can view active business locations"
  ON public.business_locations
  FOR SELECT
  USING (is_active = true);

-- Policy: Business owners can manage their locations
CREATE POLICY "Business owners can manage their locations"
  ON public.business_locations
  FOR ALL
  USING (
    business_id IN (
      SELECT id FROM public.business_applications
      WHERE email = auth.email() AND status = 'approved'
    )
  );

-- Policy: Admins can manage all locations
CREATE POLICY "Admins can manage all business locations"
  ON public.business_locations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_business_locations_updated_at
  BEFORE UPDATE ON public.business_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Migrate existing business addresses to locations table
-- Only for approved businesses with physical locations
INSERT INTO public.business_locations (
  business_id,
  location_name,
  address,
  phone,
  is_active
)
SELECT 
  id,
  business_name || ' - Main Location',
  address,
  phone,
  true
FROM public.business_applications
WHERE 
  status = 'approved' 
  AND has_physical_location = true
  AND address IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.business_locations 
    WHERE business_id = business_applications.id
  );

-- Add index for faster location queries
CREATE INDEX idx_business_locations_business_id ON public.business_locations(business_id);
CREATE INDEX idx_business_locations_active ON public.business_locations(is_active) WHERE is_active = true;