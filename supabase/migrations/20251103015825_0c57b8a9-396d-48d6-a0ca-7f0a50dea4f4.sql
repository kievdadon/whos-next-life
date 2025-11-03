-- Increase precision for total_hours column to support larger values
-- Change from NUMERIC(4,2) to NUMERIC(10,2) to allow up to 99,999,999.99 hours
ALTER TABLE driver_shifts 
ALTER COLUMN total_hours TYPE NUMERIC(10,2);