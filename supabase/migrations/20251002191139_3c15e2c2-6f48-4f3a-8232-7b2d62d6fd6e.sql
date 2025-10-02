-- Fix recursive SELECT policy on business_applications and add audit log retention + strip sensitive banking data

-- 1) Remove recursive/unsafe SELECT policy on business_applications and replace with safe condition
DROP POLICY IF EXISTS "Users can view their own applications (safe view)" ON public.business_applications;
CREATE POLICY "Users can view their own applications"
ON public.business_applications
FOR SELECT
USING (email = auth.email());

-- 2) Add retention for audit_logs (90 days) via AFTER INSERT trigger
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.audit_logs
  WHERE created_at < now() - interval '90 days';
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_retention_cleanup ON public.audit_logs;
CREATE TRIGGER audit_logs_retention_cleanup
AFTER INSERT ON public.audit_logs
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_audit_logs_retention();

-- 3) Strip sensitive banking fields on write for business_applications and driver_applications
CREATE OR REPLACE FUNCTION public.strip_business_banking_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.routing_number := NULL;
  NEW.account_number := NULL;
  NEW.account_holder_name := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS business_applications_strip_banking ON public.business_applications;
CREATE TRIGGER business_applications_strip_banking
BEFORE INSERT OR UPDATE ON public.business_applications
FOR EACH ROW
EXECUTE FUNCTION public.strip_business_banking_fields();

CREATE OR REPLACE FUNCTION public.strip_driver_banking_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.routing_number := NULL;
  NEW.account_number := NULL;
  NEW.account_holder_name := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS driver_applications_strip_banking ON public.driver_applications;
CREATE TRIGGER driver_applications_strip_banking
BEFORE INSERT OR UPDATE ON public.driver_applications
FOR EACH ROW
EXECUTE FUNCTION public.strip_driver_banking_fields();

-- 4) Immediately redact any existing sensitive values
UPDATE public.business_applications
SET routing_number = NULL,
    account_number = NULL,
    account_holder_name = NULL
WHERE routing_number IS NOT NULL OR account_number IS NOT NULL OR account_holder_name IS NOT NULL;

UPDATE public.driver_applications
SET routing_number = NULL,
    account_number = NULL,
    account_holder_name = NULL
WHERE routing_number IS NOT NULL OR account_number IS NOT NULL OR account_holder_name IS NOT NULL;
