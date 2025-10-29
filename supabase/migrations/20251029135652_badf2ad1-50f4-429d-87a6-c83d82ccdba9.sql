-- Create subscription plans enum
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium');

-- Add subscription plan to profiles
ALTER TABLE public.profiles 
ADD COLUMN subscription_plan public.subscription_plan NOT NULL DEFAULT 'free',
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;

-- Create educational content table
CREATE TABLE public.educational_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('ebook', 'article', 'video')),
  file_url TEXT,
  thumbnail_url TEXT,
  content_body TEXT,
  tags TEXT[] DEFAULT '{}',
  duration_minutes INTEGER,
  is_published BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  author TEXT,
  order_position INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on educational content
ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;

-- Premium users can view published content
CREATE POLICY "Premium users can view published content"
ON public.educational_content
FOR SELECT
TO authenticated
USING (
  is_published = true 
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.subscription_plan = 'premium'
    AND (profiles.subscription_expires_at IS NULL OR profiles.subscription_expires_at > now())
  )
);

-- Anyone can increment view count
CREATE POLICY "Anyone can update view count"
ON public.educational_content
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Create storage buckets for educational content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('educational-files', 'educational-files', true, 52428800, ARRAY['application/pdf', 'video/mp4', 'video/webm', 'image/jpeg', 'image/png', 'image/webp']),
  ('educational-thumbnails', 'educational-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- RLS for educational files bucket
CREATE POLICY "Premium users can view educational files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'educational-files'
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.subscription_plan = 'premium'
    AND (profiles.subscription_expires_at IS NULL OR profiles.subscription_expires_at > now())
  )
);

-- RLS for thumbnails (public)
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'educational-thumbnails');

-- Service role can manage all files
CREATE POLICY "Service role can manage educational files"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id IN ('educational-files', 'educational-thumbnails'))
WITH CHECK (bucket_id IN ('educational-files', 'educational-thumbnails'));

-- Create function to check premium status
CREATE OR REPLACE FUNCTION public.is_premium_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND subscription_plan = 'premium'
    AND (subscription_expires_at IS NULL OR subscription_expires_at > now())
  )
$$;

-- Create function to update content updated_at
CREATE OR REPLACE FUNCTION public.update_educational_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger for updated_at
CREATE TRIGGER update_educational_content_updated_at
BEFORE UPDATE ON public.educational_content
FOR EACH ROW
EXECUTE FUNCTION public.update_educational_content_updated_at();