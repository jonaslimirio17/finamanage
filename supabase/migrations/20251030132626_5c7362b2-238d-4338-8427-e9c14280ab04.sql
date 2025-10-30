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