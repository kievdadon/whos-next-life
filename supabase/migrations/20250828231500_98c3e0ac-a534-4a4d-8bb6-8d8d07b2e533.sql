-- Create products table for businesses to list their items
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  delivery_available BOOLEAN DEFAULT true,
  delivery_radius INTEGER DEFAULT 10, -- radius in miles
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create orders table for customer purchases
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id),
  business_id UUID NOT NULL,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  order_status TEXT DEFAULT 'pending', -- pending, confirmed, preparing, out_for_delivery, delivered, cancelled
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  stripe_session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create business_applications table to track approved businesses
CREATE TABLE public.business_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Business owners can manage their products" 
ON public.products 
FOR ALL 
USING (business_id IN (
  SELECT id FROM public.business_applications 
  WHERE email = auth.email() AND status = 'approved'
));

-- RLS Policies for orders
CREATE POLICY "Customers can view their own orders" 
ON public.orders 
FOR SELECT 
USING (customer_id = auth.uid());

CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Business owners can view orders for their products" 
ON public.orders 
FOR SELECT 
USING (business_id IN (
  SELECT id FROM public.business_applications 
  WHERE email = auth.email() AND status = 'approved'
));

CREATE POLICY "Business owners can update order status" 
ON public.orders 
FOR UPDATE 
USING (business_id IN (
  SELECT id FROM public.business_applications 
  WHERE email = auth.email() AND status = 'approved'
));

-- RLS Policies for business applications
CREATE POLICY "Anyone can submit applications" 
ON public.business_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own applications" 
ON public.business_applications 
FOR SELECT 
USING (email = auth.email());

-- Create updated_at triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_applications_updated_at
  BEFORE UPDATE ON public.business_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();