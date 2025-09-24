-- Allow approved drivers to see available (unassigned) orders
CREATE POLICY "Approved drivers can view available delivery orders"
ON public.delivery_orders
FOR SELECT
TO authenticated
USING (
  driver_id IS NULL
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.driver_applications da
    WHERE da.email = auth.email()
      AND da.status = 'approved'
  )
);

-- Allow approved drivers to claim (assign themselves) available orders
CREATE POLICY "Approved drivers can claim available orders"
ON public.delivery_orders
FOR UPDATE
TO authenticated
USING (
  driver_id IS NULL
  AND status = 'pending'
)
WITH CHECK (
  driver_id IN (
    SELECT da.id FROM public.driver_applications da
    WHERE da.email = auth.email()
      AND da.status = 'approved'
  )
);
