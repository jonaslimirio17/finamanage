-- Create table for fair leads
CREATE TABLE public.fair_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  prize_won TEXT NOT NULL,
  coupon_code TEXT NOT NULL UNIQUE,
  utm_source TEXT,
  utm_campaign TEXT,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.fair_leads ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts" ON public.fair_leads
  FOR INSERT WITH CHECK (true);

-- Create unique index on email to prevent duplicates
CREATE UNIQUE INDEX fair_leads_email_unique ON public.fair_leads(email);