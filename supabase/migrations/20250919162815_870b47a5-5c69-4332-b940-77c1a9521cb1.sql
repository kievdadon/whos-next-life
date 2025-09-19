-- Fix security vulnerability: Require authentication for driver applications
-- This prevents anonymous users from submitting fake applications to harvest personal data

-- Drop the insecure policy that allows anyone to submit applications
DROP POLICY IF EXISTS "Anyone can submit driver applications" ON public.driver_applications;

-- Create a secure policy that requires authentication and email verification
CREATE POLICY "Authenticated users can submit their own driver applications" 
ON public.driver_applications 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.email() IS NOT NULL 
  AND email = auth.email()
);