import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate internal service token
  const INTERNAL_SERVICE_TOKEN = Deno.env.get('INTERNAL_SERVICE_TOKEN');
  const authHeader = req.headers.get('x-internal-token');

  if (!INTERNAL_SERVICE_TOKEN || !authHeader || authHeader !== INTERNAL_SERVICE_TOKEN) {
    console.warn('Unauthorized access attempt to scheduled-notifications');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Helper function to invoke send-whatsapp-notification with internal token
  const sendWhatsAppNotification = async (body: any) => {
    return await supabase.functions.invoke('send-whatsapp-notification', {
      headers: {
        'x-internal-token': INTERNAL_SERVICE_TOKEN!
      },
      body
    });
  };

  try {
    const { type } = await req.json();
    console.log('Running scheduled notification:', type);

    const results: { type: string; sent: number; errors: number }[] = [];

    // =================== DEBT REMINDERS ===================
    if (type === 'debt_reminder' || type === 'all') {
      const { data: debts } = await supabase
        .from('debts')
        .select('*, profiles!inner(id, phone, nome)')
        .eq('status', 'active')
        .gte('due_date', new Date().toISOString().split('T')[0])
        .lte('due_date', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      let sent = 0, errors = 0;
      for (const debt of debts || []) {
        try {
          const daysUntilDue = Math.ceil(
            (new Date(debt.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );

          // Send WhatsApp notification with internal token
          await sendWhatsAppNotification({
            profileId: debt.profile_id,
            type: 'debt_reminder',
            data: {
              creditor: debt.creditor,
              amount: debt.principal.toFixed(2),
              dueDate: new Date(debt.due_date).toLocaleDateString('pt-BR'),
              daysUntilDue
            }
          });

          // Save to notifications table
          await supabase.from('notifications').insert({
            profile_id: debt.profile_id,
            type: 'debt_reminder',
            title: 'Lembrete de Dívida',
            summary: `A dívida com ${debt.creditor} vence em ${daysUntilDue} dias`,
            cta: '/dashboard'
          });

          sent++;
        } catch (e) {
          console.error('Error sending debt reminder:', e);
          errors++;
        }
      }
      results.push({ type: 'debt_reminder', sent, errors });
    }

    // =================== GOALS AT RISK ===================
    if (type === 'goal_at_risk' || type === 'all') {
      const { data: goals } = await supabase
        .from('goals')
        .select('*, profiles!inner(id, phone, nome)')
        .eq('status', 'active')
        .not('target_date', 'is', null);

      let sent = 0, errors = 0;
      for (const goal of goals || []) {
        try {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          const daysLeft = Math.ceil(
            (new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          );
          const expectedProgress = Math.max(0, 100 - (daysLeft / 30) * 100);

          // Only alert if goal is at risk (progress < 70% of expected AND <= 30 days left)
          if (progress < expectedProgress * 0.7 && daysLeft <= 30 && daysLeft > 0) {
            const remaining = goal.target_amount - goal.current_amount;

            await sendWhatsAppNotification({
              profileId: goal.profile_id,
              type: 'goal_at_risk',
              data: {
                goalTitle: goal.title,
                progress: progress.toFixed(0),
                remaining: remaining.toFixed(2),
                daysLeft
              }
            });

            await supabase.from('notifications').insert({
              profile_id: goal.profile_id,
              type: 'goal_at_risk',
              title: 'Meta em Risco',
              summary: `A meta "${goal.title}" está com ${progress.toFixed(0)}% de progresso e faltam ${daysLeft} dias`,
              cta: '/goals'
            });

            sent++;
          }
        } catch (e) {
          console.error('Error sending goal alert:', e);
          errors++;
        }
      }
      results.push({ type: 'goal_at_risk', sent, errors });
    }

    // =================== WEEKLY SUMMARY ===================
    if (type === 'weekly_summary' || type === 'all') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, phone, nome')
        .not('phone', 'is', null);

      let sent = 0, errors = 0;
      for (const profile of profiles || []) {
        try {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type, category')
            .eq('profile_id', profile.id)
            .gte('date', weekAgo);

          if (!transactions || transactions.length === 0) continue;

          const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          // Group expenses by category
          const byCategory: Record<string, number> = {};
          transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
              const cat = t.category || 'Outros';
              byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
            });

          const topCategories = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([name, amount]) => ({ name, amount: amount.toFixed(2) }));

          await sendWhatsAppNotification({
            profileId: profile.id,
            type: 'weekly_summary',
            data: {
              income: income.toFixed(2),
              expenses: expenses.toFixed(2),
              balance: (income - expenses).toFixed(2),
              topCategories
            }
          });

          await supabase.from('notifications').insert({
            profile_id: profile.id,
            type: 'weekly_summary',
            title: 'Resumo Semanal',
            summary: `Receitas: R$ ${income.toFixed(2)} | Despesas: R$ ${expenses.toFixed(2)}`,
            cta: '/dashboard'
          });

          sent++;
        } catch (e) {
          console.error('Error sending weekly summary:', e);
          errors++;
        }
      }
      results.push({ type: 'weekly_summary', sent, errors });
    }

    // =================== MONTHLY SUMMARY ===================
    if (type === 'monthly_summary') {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      const firstDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1).toISOString().split('T')[0];
      const lastDayLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).toISOString().split('T')[0];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, phone, nome')
        .not('phone', 'is', null);

      let sent = 0, errors = 0;
      for (const profile of profiles || []) {
        try {
          const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type, category')
            .eq('profile_id', profile.id)
            .gte('date', firstDayLastMonth)
            .lte('date', lastDayLastMonth);

          if (!transactions || transactions.length === 0) continue;

          const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + Number(t.amount), 0);
          
          const expenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0);

          const balance = income - expenses;
          const savingsRate = income > 0 ? ((income - expenses) / income * 100).toFixed(0) : '0';

          // Group expenses by category
          const byCategory: Record<string, number> = {};
          transactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
              const cat = t.category || 'Outros';
              byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
            });

          const topCategories = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount: amount.toFixed(2) }));

          await sendWhatsAppNotification({
            profileId: profile.id,
            type: 'monthly_summary',
            data: {
              month: lastMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
              income: income.toFixed(2),
              expenses: expenses.toFixed(2),
              balance: balance.toFixed(2),
              savingsRate,
              topCategories
            }
          });

          await supabase.from('notifications').insert({
            profile_id: profile.id,
            type: 'monthly_summary',
            title: 'Relatório Mensal',
            summary: `${lastMonth.toLocaleDateString('pt-BR', { month: 'long' })}: Receitas R$ ${income.toFixed(2)} | Despesas R$ ${expenses.toFixed(2)}`,
            cta: '/dashboard'
          });

          sent++;
        } catch (e) {
          console.error('Error sending monthly summary:', e);
          errors++;
        }
      }
      results.push({ type: 'monthly_summary', sent, errors });
    }

    console.log('Scheduled notifications completed:', results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scheduled-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
