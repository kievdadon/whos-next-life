-- Add product_status column to products table to track sold/removed items
ALTER TABLE public.products 
ADD COLUMN product_status text DEFAULT 'available' CHECK (product_status IN ('available', 'sold', 'removed'));

-- Add an index for better performance when filtering by status
CREATE INDEX idx_products_status ON public.products(product_status);

-- Add updated_at trigger for products table if it doesn't exist
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();