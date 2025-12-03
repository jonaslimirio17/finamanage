-- Enable realtime for remaining dashboard tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.debts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.goals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;