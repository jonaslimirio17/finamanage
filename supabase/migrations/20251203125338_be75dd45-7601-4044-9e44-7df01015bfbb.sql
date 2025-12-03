-- Allow checking if email already exists in fair_leads
-- This is needed for the duplicate email check in the fair landing page
CREATE POLICY "Allow checking email existence"
ON public.fair_leads
FOR SELECT
USING (true);

-- Allow updating redeemed_at for service role (marking coupons as used)
-- The service role already has full access, but let's be explicit
CREATE POLICY "Service role can update fair_leads"
ON public.fair_leads
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);