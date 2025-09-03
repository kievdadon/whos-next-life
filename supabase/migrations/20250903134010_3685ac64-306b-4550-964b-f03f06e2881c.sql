-- Strengthen RLS policies for business_applications table
-- Current policies already restrict SELECT to users viewing their own applications
-- But we should add policies for UPDATE and DELETE operations for completeness

-- Add policy to allow users to update their own applications (in case they need to edit)
CREATE POLICY "Users can update their own applications" 
ON public.business_applications 
FOR UPDATE 
USING (email = auth.email())
WITH CHECK (email = auth.email());

-- Add policy to allow users to delete their own applications if needed
CREATE POLICY "Users can delete their own applications" 
ON public.business_applications 
FOR DELETE 
USING (email = auth.email());

-- Ensure the INSERT policy is properly scoped to authenticated users only
DROP POLICY IF EXISTS "Anyone can submit applications" ON public.business_applications;

CREATE POLICY "Authenticated users can submit applications" 
ON public.business_applications 
FOR INSERT 
WITH CHECK (auth.email() IS NOT NULL AND email = auth.email());