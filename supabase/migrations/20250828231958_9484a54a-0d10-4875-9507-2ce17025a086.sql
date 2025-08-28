-- Create driver_applications table for driver applications
CREATE TABLE public.driver_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  license_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_year TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  insurance_policy TEXT,
  availability TEXT,
  experience TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create driver_shifts table for clock in/out tracking
CREATE TABLE public.driver_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL,
  clock_in_time TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out_time TIMESTAMPTZ,
  total_hours DECIMAL(4,2),
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- active, completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create delivery_orders table for order assignments
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id),
  driver_id UUID,
  customer_address TEXT NOT NULL,
  restaurant_address TEXT NOT NULL,
  pickup_time TIMESTAMPTZ,
  delivery_time TIMESTAMPTZ,
  distance_miles DECIMAL(5,2),
  delivery_fee DECIMAL(6,2) NOT NULL,
  driver_earning DECIMAL(6,2) NOT NULL,
  company_commission DECIMAL(6,2) NOT NULL,
  tips DECIMAL(6,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, accepted, picked_up, delivered, cancelled
  assigned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for driver_applications
CREATE POLICY "Anyone can submit driver applications" 
ON public.driver_applications 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own driver applications" 
ON public.driver_applications 
FOR SELECT 
USING (email = auth.email());

-- RLS Policies for driver_shifts
CREATE POLICY "Drivers can manage their own shifts" 
ON public.driver_shifts 
FOR ALL 
USING (driver_id IN (
  SELECT id FROM public.driver_applications 
  WHERE email = auth.email() AND status = 'approved'
));

-- RLS Policies for delivery_orders
CREATE POLICY "Drivers can view their assigned orders" 
ON public.delivery_orders 
FOR SELECT 
USING (driver_id IN (
  SELECT id FROM public.driver_applications 
  WHERE email = auth.email() AND status = 'approved'
));

CREATE POLICY "Drivers can update their assigned orders" 
ON public.delivery_orders 
FOR UPDATE 
USING (driver_id IN (
  SELECT id FROM public.driver_applications 
  WHERE email = auth.email() AND status = 'approved'
));

CREATE POLICY "Anyone can create delivery orders" 
ON public.delivery_orders 
FOR INSERT 
WITH CHECK (true);

-- Create updated_at triggers
CREATE TRIGGER update_driver_applications_updated_at
  BEFORE UPDATE ON public.driver_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_shifts_updated_at
  BEFORE UPDATE ON public.driver_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();