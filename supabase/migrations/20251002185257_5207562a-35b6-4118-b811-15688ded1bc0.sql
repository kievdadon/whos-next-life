-- Improve audit trigger functions to exclude sensitive fields from logging

-- Drop existing audit triggers
DROP TRIGGER IF EXISTS audit_business_approval_trigger ON business_applications;
DROP TRIGGER IF EXISTS audit_driver_approval_trigger ON driver_applications;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.audit_business_approval();
DROP FUNCTION IF EXISTS public.audit_driver_approval();

-- Recreate audit_business_approval with filtered fields
CREATE OR REPLACE FUNCTION public.audit_business_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- Only log specific, non-sensitive fields (exclude banking info)
      jsonb_build_object(
        'status', OLD.status,
        'approved_at', OLD.approved_at,
        'business_name', OLD.business_name,
        'business_type', OLD.business_type,
        'email', OLD.email
      ),
      jsonb_build_object(
        'status', NEW.status,
        'approved_at', NEW.approved_at,
        'business_name', NEW.business_name,
        'business_type', NEW.business_type,
        'email', NEW.email
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate audit_driver_approval with filtered fields
CREATE OR REPLACE FUNCTION public.audit_driver_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
      -- Only log specific, non-sensitive fields (exclude banking info, SSN, etc.)
      jsonb_build_object(
        'status', OLD.status,
        'approved_at', OLD.approved_at,
        'full_name', OLD.full_name,
        'email', OLD.email,
        'vehicle_type', OLD.vehicle_type
      ),
      jsonb_build_object(
        'status', NEW.status,
        'approved_at', NEW.approved_at,
        'full_name', NEW.full_name,
        'email', NEW.email,
        'vehicle_type', NEW.vehicle_type
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate triggers
CREATE TRIGGER audit_business_approval_trigger
  AFTER UPDATE ON business_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_business_approval();

CREATE TRIGGER audit_driver_approval_trigger
  AFTER UPDATE ON driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_driver_approval();

-- Add validation to group creator function to prevent privilege escalation
-- Drop trigger first, then function
DROP TRIGGER IF EXISTS add_creator_as_member ON family_groups;
DROP FUNCTION IF EXISTS public.add_group_creator_as_member() CASCADE;

CREATE OR REPLACE FUNCTION public.add_group_creator_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the creator ID matches the authenticated user (prevent privilege escalation)
  IF NEW.created_by != auth.uid() THEN
    RAISE EXCEPTION 'Group creator must match authenticated user';
  END IF;
  
  -- Add the creator as an admin member of the group
  INSERT INTO public.family_group_members (
    group_id,
    user_id,
    display_name,
    is_admin,
    status
  ) VALUES (
    NEW.id,
    NEW.created_by,
    'Group Creator',
    true,
    'active'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER add_creator_as_member
  AFTER INSERT ON family_groups
  FOR EACH ROW
  EXECUTE FUNCTION public.add_group_creator_as_member();

-- Add JSONB size constraints to audit_logs to prevent DoS
ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_values_size_check;

ALTER TABLE audit_logs 
ADD CONSTRAINT audit_logs_values_size_check 
CHECK (
  pg_column_size(old_values) < 10000 AND 
  pg_column_size(new_values) < 10000
);