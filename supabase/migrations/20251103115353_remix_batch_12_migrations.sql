
-- Migration: 20251017105551
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

-- Migration: 20251017105734
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Create accounts table
CREATE TABLE public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  mask TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'card')),
  balance DECIMAL(15, 2) NOT NULL DEFAULT 0,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  refresh_token_hash TEXT,
  last_sync TIMESTAMP WITH TIME ZONE,
  UNIQUE(provider, provider_account_id)
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_transaction_id TEXT,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BRL',
  merchant TEXT,
  raw_description TEXT,
  category TEXT,
  subcategory TEXT,
  tags TEXT[],
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  imported_from TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_transaction_id, account_id)
);

-- Create debts table
CREATE TABLE public.debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  creditor TEXT NOT NULL,
  principal DECIMAL(15, 2) NOT NULL,
  interest_rate DECIMAL(5, 2),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create goals table
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount DECIMAL(15, 2) NOT NULL,
  current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  target_date DATE,
  recurrence TEXT CHECK (recurrence IN ('once', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create credit_profiles table
CREATE TABLE public.credit_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  bureau TEXT NOT NULL,
  score INTEGER,
  last_check TIMESTAMP WITH TIME ZONE,
  raw_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create events_logs table
CREATE TABLE public.events_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consents table
CREATE TABLE public.consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for accounts
CREATE POLICY "Users can view their own accounts"
  ON public.accounts FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own accounts"
  ON public.accounts FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own accounts"
  ON public.accounts FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own accounts"
  ON public.accounts FOR DELETE
  USING (auth.uid() = profile_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = profile_id);

-- RLS Policies for debts
CREATE POLICY "Users can manage their own debts"
  ON public.debts FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for goals
CREATE POLICY "Users can manage their own goals"
  ON public.goals FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for credit_profiles
CREATE POLICY "Users can manage their own credit profiles"
  ON public.credit_profiles FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for events_logs
CREATE POLICY "Users can view their own event logs"
  ON public.events_logs FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can insert event logs"
  ON public.events_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for consents
CREATE POLICY "Users can manage their own consents"
  ON public.consents FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- Create indexes for better performance
CREATE INDEX idx_accounts_profile_id ON public.accounts(profile_id);
CREATE INDEX idx_transactions_profile_id ON public.transactions(profile_id);
CREATE INDEX idx_transactions_account_id ON public.transactions(account_id);
CREATE INDEX idx_transactions_date ON public.transactions(date DESC);
CREATE INDEX idx_debts_profile_id ON public.debts(profile_id);
CREATE INDEX idx_goals_profile_id ON public.goals(profile_id);
CREATE INDEX idx_credit_profiles_profile_id ON public.credit_profiles(profile_id);
CREATE INDEX idx_events_logs_profile_id ON public.events_logs(profile_id);
CREATE INDEX idx_consents_profile_id ON public.consents(profile_id);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário'),
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update last_login
CREATE OR REPLACE FUNCTION public.handle_user_login()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login = now()
  WHERE id = new.id;
  RETURN new;
END;
$$;

-- Migration: 20251017113155
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  cta TEXT,
  type TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = profile_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = profile_id);

-- Add email_notifications field to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

-- Add estimated_income field to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS estimated_income NUMERIC DEFAULT 0;

-- Create index for faster queries
CREATE INDEX idx_notifications_profile_id ON public.notifications(profile_id);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Migration: 20251017115009
-- Create support_agents table
CREATE TABLE public.support_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'agent',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create faqs table
CREATE TABLE public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  order_position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_articles table
CREATE TABLE public.support_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  body TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  description TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES public.support_agents(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ticket_comments table
CREATE TABLE public.ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES public.profiles(id),
  comment TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for support_agents (admin only)
CREATE POLICY "Anyone can view active agents"
ON public.support_agents FOR SELECT
USING (is_active = true);

-- RLS Policies for faqs (public read)
CREATE POLICY "Anyone can view FAQs"
ON public.faqs FOR SELECT
USING (true);

-- RLS Policies for support_articles (public read)
CREATE POLICY "Anyone can view articles"
ON public.support_articles FOR SELECT
USING (true);

CREATE POLICY "Anyone can increment article views"
ON public.support_articles FOR UPDATE
USING (true)
WITH CHECK (true);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view their own tickets"
ON public.support_tickets FOR SELECT
USING (auth.uid() = profile_id OR profile_id IS NULL);

CREATE POLICY "Anyone can create tickets"
ON public.support_tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own tickets"
ON public.support_tickets FOR UPDATE
USING (auth.uid() = profile_id);

-- RLS Policies for ticket_comments
CREATE POLICY "Users can view comments on their tickets"
ON public.ticket_comments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_comments.ticket_id
    AND (auth.uid() = profile_id OR profile_id IS NULL)
  )
);

CREATE POLICY "Users can add comments to their tickets"
ON public.ticket_comments FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_tickets
    WHERE id = ticket_comments.ticket_id
    AND (auth.uid() = profile_id OR profile_id IS NULL)
  )
);

-- Create indexes for performance
CREATE INDEX idx_faqs_tags ON public.faqs USING GIN(tags);
CREATE INDEX idx_support_articles_tags ON public.support_articles USING GIN(tags);
CREATE INDEX idx_support_tickets_profile_id ON public.support_tickets(profile_id);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX idx_support_tickets_category ON public.support_tickets(category);
CREATE INDEX idx_ticket_comments_ticket_id ON public.ticket_comments(ticket_id);

-- Insert initial FAQs
INSERT INTO public.faqs (question, answer, tags, order_position) VALUES
('Quais dados vocês acessam quando conecto minha conta?', 'Somente as informações que você autorizar via Open Finance: extratos, saldos e produtos. Não pedimos senhas. Você pode revogar a qualquer momento em Configurações.', ARRAY['open finance', 'privacidade', 'conexão'], 1),
('É seguro conectar minha conta?', 'Sim. Usamos conexões via agregador autorizado (Open Finance), TLS em trânsito e criptografia em repouso. Logs de consentimento são gravados.', ARRAY['segurança', 'open finance'], 2),
('Posso usar sem conectar o banco?', 'Sim. Você pode importar CSV/OFX ou adicionar transações manualmente.', ARRAY['importação', 'csv'], 3),
('Como importar um extrato CSV?', 'Vá em Onboarding → Importar extrato → selecione o arquivo CSV/OFX. O app valida cabeçalhos e cria transações; revise categorias após a importação.', ARRAY['importação', 'csv', 'extrato'], 4),
('Como solicito exportação ou exclusão dos meus dados?', 'Em Configurações → Privacidade, solicite exportação (geramos ZIP) ou exclusão. O pedido gera um chamado que seguimos conforme nossa política.', ARRAY['privacidade', 'lgpd', 'dados'], 5),
('Quanto tempo o suporte demora para responder?', 'Chamados de prioridade Alta: resposta inicial em até 24–48 horas úteis. Prioridade Normal: até 72 horas úteis.', ARRAY['suporte', 'sla'], 6);

-- Migration: 20251023134938
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

-- Migration: 20251029135650
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

-- Migration: 20251029140112
-- Dar acesso premium temporário para Jonas.goncalves@aluno.lsb.com.br
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '30 days'
WHERE email = 'Jonas.goncalves@aluno.lsb.com.br';

-- Migration: 20251029140414
-- Conceder acesso premium temporário para jonas.goncalves@aluno.lsb.com.br
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '30 days'
WHERE email = 'jonas.goncalves@aluno.lsb.com.br';

-- Migration: 20251029144855
-- Adicionar coluna de telefone na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN phone text;

-- Migration: 20251029144950
-- Atualizar função handle_new_user para incluir o telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, nome, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$function$;

-- Migration: 20251030132625
-- Criar tabela para armazenar tokens de recuperação de senha
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  used_at TIMESTAMP WITH TIME ZONE,
  request_ip TEXT,
  used_ip TEXT,
  request_user_agent TEXT,
  used_user_agent TEXT,
  verification_attempts INTEGER NOT NULL DEFAULT 0
);

-- Habilitar RLS
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Criar política para service role (edge functions podem gerenciar)
CREATE POLICY "Service role can manage password resets"
ON public.password_resets
FOR ALL
USING (true)
WITH CHECK (true);

-- Criar índice para melhorar performance de busca por token_hash
CREATE INDEX idx_password_resets_token_hash ON public.password_resets(token_hash);

-- Criar índice para busca por profile_id
CREATE INDEX idx_password_resets_profile_id ON public.password_resets(profile_id);

-- Criar índice para limpeza de tokens expirados
CREATE INDEX idx_password_resets_expires_at ON public.password_resets(expires_at);

-- Função para limpar tokens expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION public.cleanup_expired_password_resets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.password_resets
  WHERE (expires_at < now() - INTERVAL '7 days')
    OR (used = true AND used_at < now() - INTERVAL '7 days');
END;
$$;

-- Migration: 20251030133859
-- Add email column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Make email unique and not null (update existing records first if needed)
UPDATE public.profiles p
SET email = au.email
FROM auth.users au
WHERE p.id = au.id AND p.email IS NULL;

ALTER TABLE public.profiles 
ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_key ON public.profiles(email);

-- Update the handle_new_user function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, phone)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    new.raw_user_meta_data->>'phone'
  );
  RETURN new;
END;
$$;
