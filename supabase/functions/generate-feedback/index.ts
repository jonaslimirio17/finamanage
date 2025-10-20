import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { profile_id } = await req.json();

    if (!profile_id) {
      throw new Error('Missing profile_id');
    }

    console.log('Generating feedback for user');

    // Get profile data
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, email_notifications, estimated_income')
      .eq('id', profile_id)
      .single();

    if (profileError || !profile) {
      throw new Error('Profile not found');
    }

    const notifications = [];
    const estimatedIncome = Number(profile.estimated_income) || 0;

    // Calculate average monthly income if estimated_income is 0
    let monthlyIncome = estimatedIncome;
    if (monthlyIncome === 0) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: incomeTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('profile_id', profile_id)
        .eq('type', 'income')
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

      if (incomeTransactions && incomeTransactions.length > 0) {
        monthlyIncome = incomeTransactions.reduce((sum, txn) => sum + Number(txn.amount), 0);
      }
    }

    // Rule 1: Check "Lazer" spending (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: leisureExpenses } = await supabase
      .from('transactions')
      .select('amount')
      .eq('profile_id', profile_id)
      .eq('type', 'expense')
      .eq('category', 'Entretenimento')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    if (leisureExpenses && leisureExpenses.length > 0) {
      const totalLeisure = leisureExpenses.reduce((sum, txn) => sum + Math.abs(Number(txn.amount)), 0);
      const leisurePercentage = monthlyIncome > 0 ? totalLeisure / monthlyIncome : 0;

      if (leisurePercentage > 0.30) {
        notifications.push({
          title: 'Gastos com Lazer Elevados',
          summary: `Você gastou ${(leisurePercentage * 100).toFixed(0)}% da sua renda em entretenimento no último mês.`,
          cta: 'Ver orçamento',
          type: 'budget_warning'
        });
      }
    }

    // Rule 2: Check emergency fund (consolidated balance vs monthly costs)
    const { data: accounts } = await supabase
      .from('accounts')
      .select('balance')
      .eq('profile_id', profile_id);

    const consolidatedBalance = accounts
      ? accounts.reduce((sum, acc) => sum + Number(acc.balance), 0)
      : 0;

    // Estimate monthly costs from last 30 days expenses
    const { data: monthlyExpenses } = await supabase
      .from('transactions')
      .select('amount')
      .eq('profile_id', profile_id)
      .eq('type', 'expense')
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0]);

    const estimatedMonthlyCost = monthlyExpenses
      ? monthlyExpenses.reduce((sum, txn) => sum + Math.abs(Number(txn.amount)), 0)
      : 0;

    if (consolidatedBalance < estimatedMonthlyCost) {
      notifications.push({
        title: 'Crie uma Reserva de Emergência',
        summary: 'Seu saldo atual é menor que seus custos mensais. É importante ter uma reserva de emergência.',
        cta: 'Ver metas',
        type: 'emergency_fund'
      });
    }

    // Rule 3: Check high-interest debts
    const { data: debts } = await supabase
      .from('debts')
      .select('*')
      .eq('profile_id', profile_id)
      .eq('status', 'active');

    if (debts && debts.length > 0) {
      const highInterestDebts = debts.filter(debt => Number(debt.interest_rate || 0) > 2.0); // > 2% monthly
      
      if (highInterestDebts.length > 0) {
        const totalInterest = highInterestDebts.reduce((sum, debt) => {
          const principal = Number(debt.principal);
          const rate = Number(debt.interest_rate || 0) / 100;
          return sum + (principal * rate);
        }, 0);

        if (totalInterest > 100) { // Threshold: R$ 100 in monthly interest
          notifications.push({
            title: 'Dívidas com Juros Altos',
            summary: `Você tem ${highInterestDebts.length} dívida(s) com juros altos. Priorize o pagamento para economizar.`,
            cta: 'Ver dívidas',
            type: 'high_interest_debt'
          });
        }
      }
    }

    // Insert notifications into database (limit to 3 most important)
    const notificationsToInsert = notifications.slice(0, 3);
    
    for (const notif of notificationsToInsert) {
      await supabase.from('notifications').insert({
        profile_id,
        ...notif
      });
    }

    // Log event
    await supabase
      .from('events_logs')
      .insert({
        profile_id,
        event_type: 'feedback_generated',
        payload: {
          notifications_count: notificationsToInsert.length,
          timestamp: new Date().toISOString(),
        },
      });

    // TODO: Send email if profile.email_notifications is true
    // This would require a RESEND_API_KEY and email template

    const result = {
      status: 'success',
      profile_id,
      notifications_generated: notificationsToInsert.length,
      notifications: notificationsToInsert,
    };

    console.log('Feedback generation completed');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-feedback function');
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate feedback',
        status: 'error',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
