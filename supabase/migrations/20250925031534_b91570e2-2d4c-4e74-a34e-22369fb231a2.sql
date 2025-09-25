-- Allow approved businesses to update their own records (e.g., store hours)
DROP POLICY IF EXISTS "Users can update their own applications (limited fields)" ON business_applications;

CREATE POLICY "Users can update pending applications"
ON business_applications
FOR UPDATE
USING (email = auth.email() AND status = 'pending')
WITH CHECK (email = auth.email() AND status = 'pending' AND approved_at IS NULL);

CREATE POLICY "Approved businesses can update their record"
ON business_applications
FOR UPDATE
USING (email = auth.email() AND status = 'approved')
WITH CHECK (email = auth.email() AND status = 'approved');