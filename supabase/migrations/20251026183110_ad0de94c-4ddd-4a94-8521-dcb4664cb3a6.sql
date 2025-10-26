-- Create table for family shared orders
CREATE TABLE IF NOT EXISTS public.family_shared_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.family_groups(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  order_details JSONB,
  UNIQUE(group_id, order_id)
);

-- Enable RLS
ALTER TABLE public.family_shared_orders ENABLE ROW LEVEL SECURITY;

-- Family members can view shared orders in their groups
CREATE POLICY "Family members can view shared orders"
  ON public.family_shared_orders
  FOR SELECT
  USING (is_group_member(auth.uid(), group_id));

-- Users can share their own orders with their groups
CREATE POLICY "Users can share their orders"
  ON public.family_shared_orders
  FOR INSERT
  WITH CHECK (
    auth.uid() = shared_by 
    AND is_group_member(auth.uid(), group_id)
    AND order_id IN (SELECT id FROM public.orders WHERE customer_id = auth.uid())
  );

-- Users can remove their shared orders
CREATE POLICY "Users can remove their shared orders"
  ON public.family_shared_orders
  FOR DELETE
  USING (auth.uid() = shared_by);

-- Create index for better query performance
CREATE INDEX idx_family_shared_orders_group ON public.family_shared_orders(group_id);
CREATE INDEX idx_family_shared_orders_order ON public.family_shared_orders(order_id);