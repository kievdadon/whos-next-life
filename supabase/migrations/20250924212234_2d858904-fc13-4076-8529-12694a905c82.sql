-- Add website configuration storage to business applications
ALTER TABLE public.business_applications 
ADD COLUMN IF NOT EXISTS website_config JSONB DEFAULT NULL;