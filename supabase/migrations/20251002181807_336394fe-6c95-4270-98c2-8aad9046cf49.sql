-- Add store color customization columns to business_applications
ALTER TABLE public.business_applications
ADD COLUMN IF NOT EXISTS store_primary_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS store_secondary_color TEXT DEFAULT '#EC4899',
ADD COLUMN IF NOT EXISTS store_accent_color TEXT DEFAULT '#10B981';