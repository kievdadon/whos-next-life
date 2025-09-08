-- Check current policies and fix the security issue
-- First, let's see what policies exist and drop all INSERT policies
DO $$
BEGIN
    -- Drop all existing INSERT policies for orders table
    DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
    DROP POLICY IF EXISTS "Authenticated users can create their own orders" ON public.orders;
END
$$;

-- Create the secure policy that requires authentication and validates customer_id
CREATE POLICY "Authenticated users can create their own orders" 
ON public.orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND customer_id = auth.uid()
);

-- Ensure customer_id cannot be null for new orders
-- Note: If there are existing orders with null customer_id, this will fail
-- In that case, we'd need to update them first or make it nullable initially
ALTER TABLE public.orders 
ALTER COLUMN customer_id SET NOT NULL;