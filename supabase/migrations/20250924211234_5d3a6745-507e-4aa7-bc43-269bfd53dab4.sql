-- Security Fix 1: Remove ability for users to self-approve business applications
-- Drop existing policies that allow users to set status and approved_at
DROP POLICY IF EXISTS "Users can update their own applications" ON public.business_applications;
DROP POLICY IF EXISTS "Authenticated users can submit applications" ON public.business_applications;

-- Create new restrictive policies for business applications
CREATE POLICY "Users can submit applications (no status control)" 
ON public.business_applications 
FOR INSERT 
WITH CHECK (
  auth.email() IS NOT NULL 
  AND email = auth.email() 
  AND status = 'pending'  -- Force status to pending
  AND approved_at IS NULL  -- Prevent setting approved_at
);

CREATE POLICY "Users can update their own applications (limited fields)" 
ON public.business_applications 
FOR UPDATE 
USING (email = auth.email() AND status = 'pending')  -- Only pending applications
WITH CHECK (
  email = auth.email() 
  AND status = 'pending'  -- Cannot change status
  AND approved_at IS NULL  -- Cannot set approved_at
);

-- Admin-only policies for approval operations
CREATE POLICY "Admins can manage all business applications" 
ON public.business_applications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 2: Secure driver applications similarly
DROP POLICY IF EXISTS "Authenticated users can submit their own driver applications" ON public.driver_applications;

CREATE POLICY "Users can submit driver applications (no status control)" 
ON public.driver_applications 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.email() IS NOT NULL 
  AND email = auth.email()
  AND status = 'pending'  -- Force status to pending
  AND approved_at IS NULL  -- Prevent setting approved_at
);

CREATE POLICY "Admins can manage all driver applications" 
ON public.driver_applications 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Security Fix 3: Add database constraints to prevent status manipulation
ALTER TABLE public.business_applications 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

ALTER TABLE public.driver_applications 
ADD CONSTRAINT check_valid_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- Security Fix 4: Protect sensitive banking information with additional constraints
ALTER TABLE public.business_applications 
ADD CONSTRAINT check_payout_enabled_requires_approval 
CHECK (NOT payout_enabled OR (payout_enabled AND status = 'approved'));

ALTER TABLE public.driver_applications 
ADD CONSTRAINT check_payout_enabled_requires_approval 
CHECK (NOT payout_enabled OR (payout_enabled AND status = 'approved'));

-- Security Fix 5: Update product images to require authentication
DROP POLICY IF EXISTS "Anyone can view product images" ON public.product_images;

CREATE POLICY "Authenticated users can view product images" 
ON public.product_images 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Security Fix 6: Add audit logging trigger for business approvals
CREATE OR REPLACE FUNCTION public.audit_business_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when business status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      user_id,
      old_values,
      new_values
    ) VALUES (
      'business_applications',
      'APPROVE',
      NEW.id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_business_approval_trigger
  AFTER UPDATE ON public.business_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_business_approval();

-- Security Fix 7: Add similar audit trigger for driver approvals
CREATE OR REPLACE FUNCTION public.audit_driver_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when driver status changes to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    INSERT INTO public.audit_logs (
      table_name,
      action,
      record_id,
      user_id,
      old_values,
      new_values
    ) VALUES (
      'driver_applications',
      'APPROVE',
      NEW.id,
      auth.uid(),
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER audit_driver_approval_trigger
  AFTER UPDATE ON public.driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_driver_approval();