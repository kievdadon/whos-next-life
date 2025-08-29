-- Add user_id column to products table to allow individual users to post items
ALTER TABLE public.products ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Make business_id nullable since individual users won't have a business
ALTER TABLE public.products ALTER COLUMN business_id DROP NOT NULL;

-- Update RLS policies to allow any authenticated user to post items
DROP POLICY IF EXISTS "Business owners can manage their products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- New policy for viewing products (unchanged)
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

-- New policy allowing any authenticated user to manage their own products
CREATE POLICY "Users can manage their own products" 
ON public.products 
FOR ALL 
USING (
  auth.uid() = user_id OR 
  business_id IN (
    SELECT id FROM business_applications 
    WHERE email = auth.email() AND status = 'approved'
  )
);

-- Allow any authenticated user to create products
CREATE POLICY "Authenticated users can create products" 
ON public.products 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id OR 
  business_id IN (
    SELECT id FROM business_applications 
    WHERE email = auth.email() AND status = 'approved'
  )
);