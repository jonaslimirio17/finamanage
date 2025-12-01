-- Create function for updated_at first
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create table for user-defined transaction categorization rules
CREATE TABLE public.transaction_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  keywords TEXT[] NOT NULL DEFAULT '{}',
  category TEXT NOT NULL,
  subcategory TEXT,
  tags TEXT[] DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transaction_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rules"
ON public.transaction_rules
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own rules"
ON public.transaction_rules
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own rules"
ON public.transaction_rules
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own rules"
ON public.transaction_rules
FOR DELETE
USING (auth.uid() = profile_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transaction_rules_updated_at
BEFORE UPDATE ON public.transaction_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_transaction_rules_profile_id ON public.transaction_rules(profile_id);
CREATE INDEX idx_transaction_rules_priority ON public.transaction_rules(priority DESC) WHERE is_active = true;