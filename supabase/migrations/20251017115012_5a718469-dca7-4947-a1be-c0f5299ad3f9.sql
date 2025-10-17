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