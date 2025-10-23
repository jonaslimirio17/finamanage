-- Add DELETE policy for profiles table to allow users to delete their own profile
-- This is required for LGPD compliance (Article 18 - right to deletion)
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Add a table to log account deletion requests for audit trail
CREATE TABLE IF NOT EXISTS public.account_deletion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL,
  email TEXT NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Enable RLS on account_deletion_logs
ALTER TABLE public.account_deletion_logs ENABLE ROW LEVEL SECURITY;

-- Policy for account_deletion_logs (only service role can insert/read)
CREATE POLICY "Service role can manage deletion logs"
ON public.account_deletion_logs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);