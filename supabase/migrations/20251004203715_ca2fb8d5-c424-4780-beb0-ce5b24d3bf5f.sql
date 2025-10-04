-- Update RLS policy to allow business owners to update their own temporary_closure status
DROP POLICY IF EXISTS "Users can update pending applications" ON public.business_applications;

-- Create a new policy that allows updating temporary_closure for approved businesses
CREATE POLICY "Business owners can update their closure status" 
ON public.business_applications
FOR UPDATE 
USING (email = auth.email() AND status = 'approved')
WITH CHECK (email = auth.email() AND status = 'approved');

-- Keep the pending applications update policy separate
CREATE POLICY "Users can update pending applications" 
ON public.business_applications
FOR UPDATE 
USING (email = auth.email() AND status = 'pending')
WITH CHECK (email = auth.email() AND status = 'pending' AND approved_at IS NULL);