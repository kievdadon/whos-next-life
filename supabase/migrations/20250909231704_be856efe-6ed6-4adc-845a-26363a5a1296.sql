-- Create delivery_orders table for tracking real orders
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  store_name TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  cart_items JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  stripe_session_id TEXT,
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  driver_id UUID,
  assigned_at TIMESTAMP WITH TIME ZONE,
  picked_up_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  driver_location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- Policies for delivery_orders
CREATE POLICY "Customers can view their own orders" 
ON public.delivery_orders 
FOR SELECT 
USING (customer_id = auth.uid() OR customer_email = auth.email());

CREATE POLICY "Anyone can create orders" 
ON public.delivery_orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Drivers can update assigned orders" 
ON public.delivery_orders 
FOR UPDATE 
USING (driver_id IN (
  SELECT id FROM driver_applications 
  WHERE email = auth.email() AND status = 'approved'
));

CREATE POLICY "System can update orders" 
ON public.delivery_orders 
FOR UPDATE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for delivery_orders
ALTER TABLE public.delivery_orders REPLICA IDENTITY FULL;