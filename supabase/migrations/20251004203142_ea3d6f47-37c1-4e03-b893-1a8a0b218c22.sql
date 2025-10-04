-- Create secure function to toggle temporary closure for a business
CREATE OR REPLACE FUNCTION public.set_business_temporary_closure(
  p_business_id uuid,
  p_temporary_closure boolean,
  p_closure_message text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow the authenticated business owner (by email) to update their own record
  UPDATE public.business_applications
  SET 
    temporary_closure = p_temporary_closure,
    closure_message = COALESCE(p_closure_message, closure_message),
    updated_at = now()
  WHERE id = p_business_id
    AND email = auth.email();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not authorized to update this business or business not found';
  END IF;
END;
$$;

-- Ensure authenticated users can execute the function
GRANT EXECUTE ON FUNCTION public.set_business_temporary_closure(uuid, boolean, text) TO authenticated;
