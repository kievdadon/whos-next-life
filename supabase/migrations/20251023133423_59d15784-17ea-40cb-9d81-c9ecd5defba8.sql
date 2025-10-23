-- ============================================
-- PHASE 1: AI-Wellness-Commerce Integration
-- ============================================

-- Add wellness tags to products for mood-based recommendations
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS wellness_tags TEXT[] DEFAULT '{}';

COMMENT ON COLUMN public.products.wellness_tags IS 'Tags for wellness-based recommendations: stress-relief, mood-boosting, focus-enhancing, sleep-supporting, energy-boosting, calming, comfort-food, etc.';

-- ============================================
-- PHASE 2: Community Co-Delivery Network
-- ============================================

-- Add driver tier to distinguish casual vs full-time drivers
ALTER TABLE public.driver_applications 
ADD COLUMN IF NOT EXISTS driver_tier TEXT DEFAULT 'full_time' CHECK (driver_tier IN ('full_time', 'casual'));

COMMENT ON COLUMN public.driver_applications.driver_tier IS 'Driver type: full_time (traditional delivery driver) or casual (community member delivering along their route)';

-- Create table for casual delivery routes
CREATE TABLE IF NOT EXISTS public.casual_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  route_name TEXT NOT NULL,
  start_address TEXT NOT NULL,
  end_address TEXT NOT NULL,
  start_lat NUMERIC,
  start_lon NUMERIC,
  end_lat NUMERIC,
  end_lon NUMERIC,
  is_active BOOLEAN DEFAULT true,
  schedule_days TEXT[] DEFAULT '{}', -- ['monday', 'tuesday', etc]
  typical_time TIME,
  max_detour_miles INTEGER DEFAULT 2,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.casual_routes IS 'Regular routes that users travel, enabling them to earn by delivering items along their way';

-- Add casual delivery flag to delivery orders
ALTER TABLE public.delivery_orders 
ADD COLUMN IF NOT EXISTS is_casual_delivery BOOLEAN DEFAULT false;

-- ============================================
-- PHASE 3: Real-Time Group Orders
-- ============================================

-- Create group orders table
CREATE TABLE IF NOT EXISTS public.group_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL,
  group_name TEXT NOT NULL,
  invite_code TEXT UNIQUE DEFAULT SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8),
  delivery_address TEXT,
  delivery_instructions TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'locked', 'submitted', 'completed', 'cancelled')),
  total_amount NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.group_orders IS 'Group orders where multiple people can add items from different stores and split payment';

-- Create group order participants table
CREATE TABLE IF NOT EXISTS public.group_order_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_order_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
  user_id UUID,
  display_name TEXT NOT NULL,
  email TEXT,
  contribution_amount NUMERIC DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_payment_intent_id TEXT,
  joined_at TIMESTAMPTZ DEFAULT now(),
  is_admin BOOLEAN DEFAULT false
);

COMMENT ON TABLE public.group_order_participants IS 'Participants in a group order with their payment status';

-- Create group order items table (stores items from multiple businesses)
CREATE TABLE IF NOT EXISTS public.group_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_order_id UUID NOT NULL REFERENCES public.group_orders(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.group_order_participants(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.business_applications(id),
  product_id UUID REFERENCES public.products(id),
  product_name TEXT NOT NULL,
  product_price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  special_instructions TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.group_order_items IS 'Items added to group orders by different participants from various businesses';

-- Add group order reference to main orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS group_order_id UUID REFERENCES public.group_orders(id);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_wellness_tags ON public.products USING GIN (wellness_tags);
CREATE INDEX IF NOT EXISTS idx_casual_routes_user_active ON public.casual_routes(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_casual_routes_location ON public.casual_routes(start_lat, start_lon, end_lat, end_lon);
CREATE INDEX IF NOT EXISTS idx_group_orders_status ON public.group_orders(status);
CREATE INDEX IF NOT EXISTS idx_group_orders_invite ON public.group_orders(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_order_items_group ON public.group_order_items(group_order_id);
CREATE INDEX IF NOT EXISTS idx_group_order_participants_group ON public.group_order_participants(group_order_id);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Casual Routes RLS
ALTER TABLE public.casual_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own routes"
  ON public.casual_routes
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view active routes"
  ON public.casual_routes
  FOR SELECT
  USING (is_active = true);

-- Group Orders RLS
ALTER TABLE public.group_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create group orders"
  ON public.group_orders
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Participants can view their group orders"
  ON public.group_orders
  FOR SELECT
  USING (
    id IN (
      SELECT group_order_id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

CREATE POLICY "Admins can update group orders"
  ON public.group_orders
  FOR UPDATE
  USING (
    id IN (
      SELECT group_order_id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid() AND is_admin = true
    )
  );

-- Group Order Participants RLS
ALTER TABLE public.group_order_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join a group order"
  ON public.group_order_participants
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Participants can view group members"
  ON public.group_order_participants
  FOR SELECT
  USING (
    group_order_id IN (
      SELECT group_order_id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

CREATE POLICY "Users can update their own participation"
  ON public.group_order_participants
  FOR UPDATE
  USING (user_id = auth.uid() OR email = auth.email());

-- Group Order Items RLS
ALTER TABLE public.group_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can add items to their order"
  ON public.group_order_items
  FOR INSERT
  WITH CHECK (
    group_order_id IN (
      SELECT group_order_id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Participants can view group order items"
  ON public.group_order_items
  FOR SELECT
  USING (
    group_order_id IN (
      SELECT group_order_id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid() OR email = auth.email()
    )
  );

CREATE POLICY "Users can update their own items"
  ON public.group_order_items
  FOR UPDATE
  USING (
    participant_id IN (
      SELECT id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own items"
  ON public.group_order_items
  FOR DELETE
  USING (
    participant_id IN (
      SELECT id 
      FROM public.group_order_participants 
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- Triggers for Updated At
-- ============================================

CREATE TRIGGER update_casual_routes_updated_at
  BEFORE UPDATE ON public.casual_routes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_group_orders_updated_at
  BEFORE UPDATE ON public.group_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();