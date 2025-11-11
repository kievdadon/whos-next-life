-- Remove banking fields from business_applications and driver_applications tables
-- Banking details should be handled exclusively by Stripe Connect
-- This reduces PCI-DSS compliance burden and attack surface

-- First drop the triggers
DROP TRIGGER IF EXISTS strip_business_banking_on_select ON public.business_applications;
DROP TRIGGER IF EXISTS strip_driver_banking_on_select ON public.driver_applications;

-- Then drop the trigger functions
DROP FUNCTION IF EXISTS public.strip_business_banking_fields() CASCADE;
DROP FUNCTION IF EXISTS public.strip_driver_banking_fields() CASCADE;

-- Now remove the banking columns from business_applications
ALTER TABLE public.business_applications
DROP COLUMN IF EXISTS routing_number,
DROP COLUMN IF EXISTS account_number,
DROP COLUMN IF EXISTS account_holder_name;

-- Remove the banking columns from driver_applications
ALTER TABLE public.driver_applications
DROP COLUMN IF EXISTS routing_number,
DROP COLUMN IF EXISTS account_number,
DROP COLUMN IF EXISTS account_holder_name;

-- Note: stripe_connect_account_id remains in both tables for Stripe Connect integration
-- All banking operations should go through Stripe Connect API