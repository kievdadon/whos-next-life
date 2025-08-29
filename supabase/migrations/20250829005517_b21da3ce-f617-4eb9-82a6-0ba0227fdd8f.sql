-- Create a table to store multiple product images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view product images (since products are public)
CREATE POLICY "Anyone can view product images" 
ON public.product_images 
FOR SELECT 
USING (true);

-- Create policy for users to manage images for their own products
CREATE POLICY "Users can manage images for their own products" 
ON public.product_images 
FOR ALL 
USING (
  product_id IN (
    SELECT id FROM public.products 
    WHERE user_id = auth.uid() 
    OR business_id IN (
      SELECT id FROM public.business_applications 
      WHERE email = auth.email() AND status = 'approved'
    )
  )
);

-- Create index for better performance
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX idx_product_images_order ON public.product_images(product_id, image_order);