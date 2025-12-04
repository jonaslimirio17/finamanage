-- Badges definitions table
CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('financial', 'consistency', 'education')),
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  points INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- User earned badges
CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, badge_id)
);

-- User streaks tracking
CREATE TABLE public.user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL CHECK (streak_type IN ('login', 'transaction', 'savings')),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, streak_type)
);

-- Enable RLS
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- Badges are public read
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);

-- User badges - users can view their own (premium feature checked in app)
CREATE POLICY "Users can view their own badges" ON public.user_badges FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "System can insert badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = profile_id);

-- User streaks - all users can manage their own
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = profile_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = profile_id);

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value, points) VALUES
-- Financial badges
('Primeira Meta', 'Complete sua primeira meta financeira', 'Target', 'financial', 'goals_completed', 1, 10),
('Caçador de Metas', 'Complete 5 metas financeiras', 'Trophy', 'financial', 'goals_completed', 5, 25),
('Mestre das Metas', 'Complete 10 metas financeiras', 'Crown', 'financial', 'goals_completed', 10, 50),
('Centenário', 'Registre 100 transações', 'Hash', 'financial', 'transactions_count', 100, 20),
('Milésimo', 'Registre 1000 transações', 'Gem', 'financial', 'transactions_count', 1000, 100),
('Saldo Positivo', 'Mantenha saldo positivo por 30 dias', 'TrendingUp', 'financial', 'positive_balance_days', 30, 30),
('Economia Bronze', 'Economize R$100 em metas', 'Coins', 'financial', 'savings_amount', 100, 15),
('Economia Prata', 'Economize R$500 em metas', 'Wallet', 'financial', 'savings_amount', 500, 35),
('Economia Ouro', 'Economize R$1000 em metas', 'Banknote', 'financial', 'savings_amount', 1000, 75),
-- Consistency badges
('Primeiro Acesso', 'Faça login pela primeira vez', 'LogIn', 'consistency', 'first_login', 1, 5),
('Semana Perfeita', 'Use o app 7 dias seguidos', 'Calendar', 'consistency', 'login_streak', 7, 15),
('Mês de Ouro', 'Use o app 30 dias seguidos', 'CalendarCheck', 'consistency', 'login_streak', 30, 50),
('Registrador Fiel', 'Registre transações 7 dias seguidos', 'ClipboardCheck', 'consistency', 'transaction_streak', 7, 20),
('Disciplina Total', 'Registre transações 30 dias seguidos', 'Award', 'consistency', 'transaction_streak', 30, 60),
-- Education badges
('Curioso', 'Acesse seu primeiro conteúdo educativo', 'BookOpen', 'education', 'content_viewed', 1, 5),
('Estudante', 'Complete 5 conteúdos educativos', 'GraduationCap', 'education', 'content_viewed', 5, 20),
('Especialista', 'Complete 10 conteúdos educativos', 'Brain', 'education', 'content_viewed', 10, 40);

-- Function to update login streak
CREATE OR REPLACE FUNCTION public.update_login_streak(p_profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_date DATE;
  v_current_streak INTEGER;
  v_longest_streak INTEGER;
BEGIN
  SELECT last_activity_date, current_streak, longest_streak
  INTO v_last_date, v_current_streak, v_longest_streak
  FROM user_streaks
  WHERE profile_id = p_profile_id AND streak_type = 'login';

  IF NOT FOUND THEN
    INSERT INTO user_streaks (profile_id, streak_type, current_streak, longest_streak, last_activity_date)
    VALUES (p_profile_id, 'login', 1, 1, CURRENT_DATE);
  ELSIF v_last_date = CURRENT_DATE THEN
    -- Already logged in today, do nothing
    NULL;
  ELSIF v_last_date = CURRENT_DATE - 1 THEN
    -- Consecutive day
    UPDATE user_streaks
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = CURRENT_DATE,
        updated_at = now()
    WHERE profile_id = p_profile_id AND streak_type = 'login';
  ELSE
    -- Streak broken
    UPDATE user_streaks
    SET current_streak = 1,
        last_activity_date = CURRENT_DATE,
        updated_at = now()
    WHERE profile_id = p_profile_id AND streak_type = 'login';
  END IF;
END;
$$;