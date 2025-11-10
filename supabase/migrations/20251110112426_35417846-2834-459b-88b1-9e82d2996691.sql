-- Create table for receipt uploads
CREATE TABLE public.receipt_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  extracted_data JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_receipt_profile FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create table for WhatsApp sessions
CREATE TABLE public.whatsapp_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  phone_number TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'idle',
  context JSONB,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_session_profile FOREIGN KEY (profile_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.receipt_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for receipt_uploads
CREATE POLICY "Users can view their own receipts"
ON public.receipt_uploads
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own receipts"
ON public.receipt_uploads
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own receipts"
ON public.receipt_uploads
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own receipts"
ON public.receipt_uploads
FOR DELETE
USING (auth.uid() = profile_id);

-- RLS policies for whatsapp_sessions
CREATE POLICY "Users can view their own sessions"
ON public.whatsapp_sessions
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own sessions"
ON public.whatsapp_sessions
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own sessions"
ON public.whatsapp_sessions
FOR UPDATE
USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own sessions"
ON public.whatsapp_sessions
FOR DELETE
USING (auth.uid() = profile_id);

-- Create indexes for better performance
CREATE INDEX idx_receipt_uploads_profile ON public.receipt_uploads(profile_id);
CREATE INDEX idx_receipt_uploads_status ON public.receipt_uploads(status);
CREATE INDEX idx_whatsapp_sessions_phone ON public.whatsapp_sessions(phone_number);
CREATE INDEX idx_whatsapp_sessions_profile ON public.whatsapp_sessions(profile_id);