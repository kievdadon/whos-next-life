-- Approve the driver application for testing
UPDATE driver_applications 
SET status = 'approved', approved_at = now() 
WHERE email = 'jameskiev16@icloud.com' AND status = 'pending';