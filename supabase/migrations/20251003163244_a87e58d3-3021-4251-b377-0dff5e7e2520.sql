-- Create service bundles table
CREATE TABLE public.service_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  total_discount NUMERIC DEFAULT 0,
  CONSTRAINT service_bundles_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create bundle items table to track individual services in a bundle
CREATE TABLE public.bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('delivery', 'gig', 'marketplace', 'wellness')),
  service_id UUID,
  price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT bundle_items_bundle_id_fkey FOREIGN KEY (bundle_id) 
    REFERENCES service_bundles(id) ON DELETE CASCADE
);

-- Create family shared carts table
CREATE TABLE public.family_shared_carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL,
  created_by UUID NOT NULL,
  cart_items JSONB DEFAULT '[]'::jsonb,
  delivery_address TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ordered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT family_shared_carts_group_id_fkey FOREIGN KEY (group_id) 
    REFERENCES family_groups(id) ON DELETE CASCADE
);

-- Create wellness recommendations table
CREATE TABLE public.wellness_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN ('delivery', 'gig', 'marketplace')),
  mood_score NUMERIC,
  recommendation_data JSONB NOT NULL,
  shown_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  clicked BOOLEAN DEFAULT false,
  CONSTRAINT wellness_recommendations_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.service_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_shared_carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellness_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for service_bundles
CREATE POLICY "Users can view their own bundles"
  ON public.service_bundles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bundles"
  ON public.service_bundles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bundles"
  ON public.service_bundles FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for bundle_items
CREATE POLICY "Users can view items in their bundles"
  ON public.bundle_items FOR SELECT
  USING (bundle_id IN (SELECT id FROM service_bundles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add items to their bundles"
  ON public.bundle_items FOR INSERT
  WITH CHECK (bundle_id IN (SELECT id FROM service_bundles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update items in their bundles"
  ON public.bundle_items FOR UPDATE
  USING (bundle_id IN (SELECT id FROM service_bundles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete items from their bundles"
  ON public.bundle_items FOR DELETE
  USING (bundle_id IN (SELECT id FROM service_bundles WHERE user_id = auth.uid()));

-- RLS Policies for family_shared_carts
CREATE POLICY "Family members can view shared carts"
  ON public.family_shared_carts FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Family members can create shared carts"
  ON public.family_shared_carts FOR INSERT
  WITH CHECK (auth.uid() = created_by AND is_group_member(auth.uid(), group_id));

CREATE POLICY "Family members can update shared carts"
  ON public.family_shared_carts FOR UPDATE
  USING (is_group_member(auth.uid(), group_id));

-- RLS Policies for wellness_recommendations
CREATE POLICY "Users can view their own recommendations"
  ON public.wellness_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can create recommendations"
  ON public.wellness_recommendations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update recommendation status"
  ON public.wellness_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_service_bundles_updated_at
  BEFORE UPDATE ON public.service_bundles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_family_shared_carts_updated_at
  BEFORE UPDATE ON public.family_shared_carts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();