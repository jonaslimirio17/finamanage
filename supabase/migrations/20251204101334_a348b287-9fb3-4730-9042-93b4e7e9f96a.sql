-- Drop the overly permissive UPDATE policy
DROP POLICY IF EXISTS "Authenticated users can increment view count" ON public.educational_content;

-- Create a SECURITY DEFINER function for safe view count increment
CREATE OR REPLACE FUNCTION public.increment_content_view(content_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.educational_content 
  SET view_count = view_count + 1 
  WHERE id = content_id AND is_published = true;
END;
$$;

-- Create admin-only UPDATE policy for content modifications
CREATE POLICY "Admins can update educational content"
ON public.educational_content
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));