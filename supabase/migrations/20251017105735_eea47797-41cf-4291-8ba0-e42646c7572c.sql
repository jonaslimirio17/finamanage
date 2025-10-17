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