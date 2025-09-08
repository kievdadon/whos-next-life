-- Fix security vulnerability: Prevent anonymous order creation
-- Update RLS policy to require authentication and validate customer_id

-- Drop the insecure policy that allows anyone to create orders
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- Create secure policy that requires authentication and validates customer_id
CREATE POLICY "Authenticated users can create their own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND customer_id = auth.uid()
);

-- Also ensure customer_id cannot be null for new orders by updating the table
-- This prevents orders without proper customer association
ALTER TABLE public.orders 
ALTER COLUMN customer_id SET NOT NULL;