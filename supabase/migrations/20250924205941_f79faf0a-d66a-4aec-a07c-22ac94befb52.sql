-- Add banking/routing information fields to business_applications table
ALTER TABLE business_applications ADD COLUMN routing_number TEXT;
ALTER TABLE business_applications ADD COLUMN account_number TEXT;
ALTER TABLE business_applications ADD COLUMN account_holder_name TEXT;
ALTER TABLE business_applications ADD COLUMN stripe_connect_account_id TEXT;
ALTER TABLE business_applications ADD COLUMN payout_enabled BOOLEAN DEFAULT false;

-- Add banking/routing information fields to driver_applications table  
ALTER TABLE driver_applications ADD COLUMN routing_number TEXT;
ALTER TABLE driver_applications ADD COLUMN account_number TEXT;
ALTER TABLE driver_applications ADD COLUMN account_holder_name TEXT;
ALTER TABLE driver_applications ADD COLUMN stripe_connect_account_id TEXT;
ALTER TABLE driver_applications ADD COLUMN payout_enabled BOOLEAN DEFAULT false;

-- Add commission tracking to orders and delivery_orders tables
ALTER TABLE orders ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.1500; -- 15% default commission
ALTER TABLE orders ADD COLUMN commission_amount DECIMAL(10,2);
ALTER TABLE orders ADD COLUMN payout_amount DECIMAL(10,2);

ALTER TABLE delivery_orders ADD COLUMN commission_rate DECIMAL(5,4) DEFAULT 0.1500; -- 15% default commission  
ALTER TABLE delivery_orders ADD COLUMN commission_amount DECIMAL(10,2);
ALTER TABLE delivery_orders ADD COLUMN payout_amount DECIMAL(10,2);