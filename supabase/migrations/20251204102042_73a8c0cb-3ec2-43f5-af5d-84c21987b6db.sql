-- 1. FIX: Support agents exposed to all authenticated users
-- Drop the overly permissive policy and restrict to admin only
DROP POLICY IF EXISTS "Authenticated users can view active agents" ON public.support_agents;

CREATE POLICY "Admins can view support agents"
ON public.support_agents
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. FIX: Support articles view count manipulation
-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can increment article views" ON public.support_articles;

-- Create a SECURITY DEFINER function for safe view count increment
CREATE OR REPLACE FUNCTION public.increment_article_view(article_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.support_articles 
  SET views = views + 1 
  WHERE id = article_id;
END;
$$;

-- 3. FIX: Event logs INSERT policy - restrict to own profile_id only
DROP POLICY IF EXISTS "Authenticated users can insert event logs" ON public.events_logs;

CREATE POLICY "Users can insert their own event logs"
ON public.events_logs
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- 4. FIX: Fair leads weak email-based SELECT policy
DROP POLICY IF EXISTS "Users can check their own email" ON public.fair_leads;

-- Replace with a more secure policy - only authenticated users can view their own leads by email match
CREATE POLICY "Authenticated users can view their own leads"
ON public.fair_leads
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND email = (SELECT email FROM public.profiles WHERE id = auth.uid())
);

-- 5. FIX: Support tickets public INSERT - add profile_id requirement for authenticated users
-- Keep the policy but ensure profile_id is set correctly for authenticated users
DROP POLICY IF EXISTS "Anyone can create tickets" ON public.support_tickets;

CREATE POLICY "Authenticated users create tickets with their profile"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  -- If authenticated, profile_id must match auth.uid() or be null
  (auth.uid() IS NOT NULL AND (profile_id = auth.uid() OR profile_id IS NULL))
  OR
  -- If not authenticated, profile_id must be null
  (auth.uid() IS NULL AND profile_id IS NULL)
);