-- Add explicit deny policies for anonymous users on sensitive tables
-- This is a defense-in-depth measure to prevent any RLS bypass attacks

-- Profiles - contains PII
CREATE POLICY "deny_anon_access_profiles" ON public.profiles FOR ALL TO anon USING (false);

-- Support agents - contains emails
CREATE POLICY "deny_anon_access_support_agents" ON public.support_agents FOR ALL TO anon USING (false);

-- Password resets - contains token hashes
CREATE POLICY "deny_anon_access_password_resets" ON public.password_resets FOR ALL TO anon USING (false);

-- Accounts - contains financial data
CREATE POLICY "deny_anon_access_accounts" ON public.accounts FOR ALL TO anon USING (false);

-- Transactions - contains financial history
CREATE POLICY "deny_anon_access_transactions" ON public.transactions FOR ALL TO anon USING (false);

-- Credit profiles - contains credit scores
CREATE POLICY "deny_anon_access_credit_profiles" ON public.credit_profiles FOR ALL TO anon USING (false);

-- Asaas payments - contains payment info
CREATE POLICY "deny_anon_access_asaas_payments" ON public.asaas_payments FOR ALL TO anon USING (false);

-- Asaas subscriptions - contains subscription info
CREATE POLICY "deny_anon_access_asaas_subscriptions" ON public.asaas_subscriptions FOR ALL TO anon USING (false);

-- Support tickets - contains customer issues
CREATE POLICY "deny_anon_access_support_tickets" ON public.support_tickets FOR ALL TO anon USING (false);

-- Debts - contains financial obligations
CREATE POLICY "deny_anon_access_debts" ON public.debts FOR ALL TO anon USING (false);

-- Goals - contains financial goals
CREATE POLICY "deny_anon_access_goals" ON public.goals FOR ALL TO anon USING (false);

-- Consents - contains user consents
CREATE POLICY "deny_anon_access_consents" ON public.consents FOR ALL TO anon USING (false);

-- WhatsApp sessions - contains session data
CREATE POLICY "deny_anon_access_whatsapp_sessions" ON public.whatsapp_sessions FOR ALL TO anon USING (false);

-- Receipt uploads - contains receipt data
CREATE POLICY "deny_anon_access_receipt_uploads" ON public.receipt_uploads FOR ALL TO anon USING (false);

-- Notifications - contains user notifications
CREATE POLICY "deny_anon_access_notifications" ON public.notifications FOR ALL TO anon USING (false);

-- User roles - contains role assignments
CREATE POLICY "deny_anon_access_user_roles" ON public.user_roles FOR ALL TO anon USING (false);

-- Transaction rules - contains categorization rules
CREATE POLICY "deny_anon_access_transaction_rules" ON public.transaction_rules FOR ALL TO anon USING (false);

-- Events logs - contains user activity
CREATE POLICY "deny_anon_access_events_logs" ON public.events_logs FOR ALL TO anon USING (false);

-- Account deletion logs - contains deletion records
CREATE POLICY "deny_anon_access_account_deletion_logs" ON public.account_deletion_logs FOR ALL TO anon USING (false);

-- Ticket comments - contains support conversation
CREATE POLICY "deny_anon_access_ticket_comments" ON public.ticket_comments FOR ALL TO anon USING (false);