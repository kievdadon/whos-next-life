-- Fix RLS policies to restrict public data exposure

-- 1. Restrict worker_profiles to authenticated users only
DROP POLICY IF EXISTS "Anyone can view worker profiles" ON public.worker_profiles;
CREATE POLICY "Authenticated users can view worker profiles"
ON public.worker_profiles
FOR SELECT
TO authenticated
USING (true);

-- 2. Restrict gigs to authenticated users only
DROP POLICY IF EXISTS "Anyone can view open gigs" ON public.gigs;
CREATE POLICY "Authenticated users can view open gigs"
ON public.gigs
FOR SELECT
TO authenticated
USING (true);

-- 3. Restrict products to authenticated users only
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
CREATE POLICY "Authenticated users can view active products"
ON public.products
FOR SELECT
TO authenticated
USING (is_active = true);