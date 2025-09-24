-- Add photo URL columns for pickup and delivery confirmations
ALTER TABLE delivery_orders 
ADD COLUMN IF NOT EXISTS picked_up_photo_url TEXT,
ADD COLUMN IF NOT EXISTS delivered_photo_url TEXT;