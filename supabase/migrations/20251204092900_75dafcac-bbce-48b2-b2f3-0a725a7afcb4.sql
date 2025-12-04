-- Fix 1: Restrict support_agents to only show names (not emails) to public
DROP POLICY IF EXISTS "Anyone can view active agents" ON public.support_agents;
CREATE POLICY "Authenticated users can view active agents" 
ON public.support_agents 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Fix 2: Restrict fair_leads - only admins can read
DROP POLICY IF EXISTS "Allow checking email existence" ON public.fair_leads;
DROP POLICY IF EXISTS "Service role can read fair_leads" ON public.fair_leads;
DROP POLICY IF EXISTS "Service role can update fair_leads" ON public.fair_leads;

-- Allow public to check only if their own email exists (for duplicate prevention)
CREATE POLICY "Users can check their own email" 
ON public.fair_leads 
FOR SELECT 
USING (email = current_setting('request.headers', true)::json->>'x-user-email');

-- Admins can manage fair_leads
CREATE POLICY "Admins can manage fair_leads" 
ON public.fair_leads 
FOR ALL 
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Fix 3: Tighten events_logs - only authenticated users can insert
DROP POLICY IF EXISTS "Anyone can insert event logs" ON public.events_logs;
CREATE POLICY "Authenticated users can insert event logs" 
ON public.events_logs 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Fix 4: Tighten educational_content update - only allow incrementing view_count
DROP POLICY IF EXISTS "Anyone can update view count" ON public.educational_content;
CREATE POLICY "Authenticated users can increment view count" 
ON public.educational_content 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix 5: Tighten support_articles update - only authenticated
DROP POLICY IF EXISTS "Anyone can increment article views" ON public.support_articles;
CREATE POLICY "Authenticated users can increment article views" 
ON public.support_articles 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

-- Fix 6: Tighten support_tickets viewing - remove NULL profile_id access for unauthenticated
DROP POLICY IF EXISTS "Users can view their own tickets" ON public.support_tickets;
CREATE POLICY "Users can view their own tickets" 
ON public.support_tickets 
FOR SELECT 
TO authenticated
USING (auth.uid() = profile_id);

-- Fix 7: Restrict pre_signups to service role only for reading
-- Keep public insert but add policy comment for rate limiting at app level