-- Dar acesso premium temporário para Jonas.goncalves@aluno.lsb.com.br
UPDATE public.profiles
SET 
  subscription_plan = 'premium',
  subscription_started_at = now(),
  subscription_expires_at = now() + interval '30 days'
WHERE email = 'Jonas.goncalves@aluno.lsb.com.br';