-- Fix critical security vulnerability: Require authentication for delivery order creation
-- This prevents anonymous users from creating fake orders with sensitive customer data

-- Drop the insecure policy that allows anyone to create delivery orders
DROP POLICY IF EXISTS "Anyone can create delivery orders" ON public.delivery_orders;

-- Create a secure policy that requires authentication and user ownership
CREATE POLICY "Authenticated users can create their own delivery orders" 
ON public.delivery_orders 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (
    customer_id = auth.uid() 
    OR (customer_id IS NULL AND customer_email = auth.email())
  )
);

-- Also add a policy for authenticated users to view their own orders
CREATE POLICY "Customers can view their own delivery orders" 
ON public.delivery_orders 
FOR SELECT 
TO authenticated
USING (
  customer_id = auth.uid() 
  OR customer_email = auth.email()
);