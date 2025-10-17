-- Create pre_signups table for landing page leads
CREATE TABLE public.pre_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  source_page TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pre_signups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert (public signup form)
CREATE POLICY "Anyone can sign up"
ON public.pre_signups
FOR INSERT
WITH CHECK (true);

-- Create index for better performance on email lookups
CREATE INDEX idx_pre_signups_email ON public.pre_signups(email);
CREATE INDEX idx_pre_signups_created_at ON public.pre_signups(created_at DESC);