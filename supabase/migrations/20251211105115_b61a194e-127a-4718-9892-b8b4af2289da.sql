-- Create table to store merchant category mappings learned from user categorizations
CREATE TABLE public.merchant_category_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  merchant_name TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, merchant_name)
);

-- Enable RLS
ALTER TABLE public.merchant_category_mappings ENABLE ROW LEVEL SECURITY;

-- Users can only manage their own mappings
CREATE POLICY "Users can view their own mappings"
ON public.merchant_category_mappings
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own mappings"
ON public.merchant_category_mappings
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own mappings"
ON public.merchant_category_mappings
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own mappings"
ON public.merchant_category_mappings
FOR DELETE
USING (auth.uid() = profile_id);

-- Deny anonymous access
CREATE POLICY "deny_anon_access_merchant_category_mappings"
ON public.merchant_category_mappings
FOR ALL
USING (false);

-- Add index for faster lookups
CREATE INDEX idx_merchant_category_mappings_lookup 
ON public.merchant_category_mappings(profile_id, merchant_name);

-- Trigger for updated_at
CREATE TRIGGER update_merchant_category_mappings_updated_at
BEFORE UPDATE ON public.merchant_category_mappings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();