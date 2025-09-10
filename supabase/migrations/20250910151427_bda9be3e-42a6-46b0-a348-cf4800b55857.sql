-- Add missing cart_items column to delivery_orders table
ALTER TABLE public.delivery_orders 
ADD COLUMN cart_items JSONB,
ADD COLUMN customer_id UUID,
ADD COLUMN customer_email TEXT,
ADD COLUMN customer_name TEXT,
ADD COLUMN customer_phone TEXT,
ADD COLUMN store_name TEXT,
ADD COLUMN delivery_address TEXT,
ADD COLUMN subtotal NUMERIC,
ADD COLUMN tax NUMERIC,
ADD COLUMN total_amount NUMERIC,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN order_status TEXT DEFAULT 'pending', 
ADD COLUMN stripe_session_id TEXT,
ADD COLUMN estimated_delivery_time TIMESTAMPTZ;