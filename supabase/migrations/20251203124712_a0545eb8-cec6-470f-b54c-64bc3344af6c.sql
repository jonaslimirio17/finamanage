-- Add discount_type column to fair_leads for easier discount calculations
ALTER TABLE public.fair_leads ADD COLUMN IF NOT EXISTS discount_type TEXT;

-- Values: 'free_months_1', 'free_months_2', 'free_months_3', 'percent_30_6m', 'percent_50_6m'
COMMENT ON COLUMN public.fair_leads.discount_type IS 'Type of discount: free_months_1, free_months_2, free_months_3, percent_30_6m, percent_50_6m';

-- Add SELECT policy for validate-coupon to check coupons (service role only)
CREATE POLICY "Service role can read fair_leads"
ON public.fair_leads
FOR SELECT
TO service_role
USING (true);