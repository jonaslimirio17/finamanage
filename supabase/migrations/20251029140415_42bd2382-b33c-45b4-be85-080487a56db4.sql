-- Conceder acesso premium temporário para jonas.goncalves@aluno.lsb.com.br
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '30 days'
WHERE email = 'jonas.goncalves@aluno.lsb.com.br';