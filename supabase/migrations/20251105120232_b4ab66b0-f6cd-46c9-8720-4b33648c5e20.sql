-- Force types regeneration by adding a comment to the profiles table
COMMENT ON TABLE public.profiles IS 'User profiles with subscription information';

-- Ensure all tables have proper comments for better documentation
COMMENT ON TABLE public.accounts IS 'Connected financial accounts';
COMMENT ON TABLE public.transactions IS 'Financial transactions from connected accounts';
COMMENT ON TABLE public.goals IS 'User financial goals';
COMMENT ON TABLE public.notifications IS 'User notifications';
COMMENT ON TABLE public.educational_content IS 'Educational content for premium users';
