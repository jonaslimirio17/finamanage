-- Tabela para armazenar assinaturas Asaas
CREATE TABLE public.asaas_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  asaas_subscription_id text UNIQUE NOT NULL,
  asaas_customer_id text NOT NULL,
  status text NOT NULL,
  payment_method text NOT NULL,
  value numeric NOT NULL DEFAULT 14.90,
  next_due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_asaas_subscriptions_profile_id ON public.asaas_subscriptions(profile_id);
CREATE INDEX idx_asaas_subscriptions_status ON public.asaas_subscriptions(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_asaas_subscriptions_updated_at
  BEFORE UPDATE ON public.asaas_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own subscriptions"
  ON public.asaas_subscriptions FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own subscriptions"
  ON public.asaas_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own subscriptions"
  ON public.asaas_subscriptions FOR UPDATE
  USING (auth.uid() = profile_id);

-- Tabela para armazenar pagamentos Asaas
CREATE TABLE public.asaas_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_id uuid REFERENCES asaas_subscriptions(id) ON DELETE SET NULL,
  asaas_payment_id text UNIQUE NOT NULL,
  value numeric NOT NULL,
  payment_method text NOT NULL,
  status text NOT NULL,
  due_date date NOT NULL,
  payment_date timestamptz,
  invoice_url text,
  bank_slip_url text,
  pix_qrcode text,
  pix_copy_paste text,
  created_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_asaas_payments_profile_id ON public.asaas_payments(profile_id);
CREATE INDEX idx_asaas_payments_subscription_id ON public.asaas_payments(subscription_id);
CREATE INDEX idx_asaas_payments_status ON public.asaas_payments(status);

-- Habilitar RLS
ALTER TABLE public.asaas_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own payments"
  ON public.asaas_payments FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own payments"
  ON public.asaas_payments FOR INSERT
  WITH CHECK (auth.uid() = profile_id);