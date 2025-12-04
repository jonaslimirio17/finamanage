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
    console.warn('Unauthorized access attempt to send-whatsapp-notification');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { profileId, type, data } = await req.json();
    console.log('Sending WhatsApp notification:', type, 'to profile:', profileId);

    // Get user's phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone, nome')
      .eq('id', profileId)
      .single();

    if (!profile?.phone) {
      console.error('User does not have a phone number registered');
      return new Response(JSON.stringify({ error: 'No phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let messageText = '';
    let emoji = '📢';

    // Build message based on notification type
    switch (type) {
      case 'budget_alert':
        emoji = '⚠️';
        messageText = `${emoji} *Alerta de Orçamento*\n\n` +
                     `Olá ${profile.nome}! Você já gastou ${data.percentage}% do seu orçamento em *${data.category}*.\n\n` +
                     `Valor gasto: R$ ${data.spent}\n` +
                     `Limite: R$ ${data.limit}`;
        break;

      case 'goal_at_risk':
        emoji = '🎯';
        messageText = `${emoji} *Meta em Risco*\n\n` +
                     `A meta "${data.goalTitle}" pode não ser atingida!\n\n` +
                     `Progresso atual: ${data.progress}%\n` +
                     `Valor faltante: R$ ${data.remaining}\n` +
                     `Prazo: ${data.daysLeft} dias`;
        break;

      case 'debt_reminder':
        emoji = '💳';
        messageText = `${emoji} *Lembrete de Dívida*\n\n` +
                     `A dívida com *${data.creditor}* vence em ${data.daysUntilDue} dias!\n\n` +
                     `Valor: R$ ${data.amount}\n` +
                     `Vencimento: ${data.dueDate}`;
        break;

      case 'weekly_summary':
        emoji = '📊';
        messageText = `${emoji} *Resumo Semanal*\n\n` +
                     `Olá ${profile.nome}! Aqui está seu resumo:\n\n` +
                     `💰 Receitas: R$ ${data.income}\n` +
                     `💸 Despesas: R$ ${data.expenses}\n` +
                     `📈 Saldo: R$ ${data.balance}\n\n` +
                     `Principais gastos:\n${data.topCategories.map((cat: any) => 
                       `• ${cat.name}: R$ ${cat.amount}`
                     ).join('\n')}`;
        break;

      case 'transaction_confirmed':
        emoji = '✅';
        messageText = `${emoji} *Transação Registrada*\n\n` +
                     `${data.type === 'expense' ? '💸 Despesa' : '💰 Receita'} de R$ ${data.amount} confirmada!\n\n` +
                     `📍 Local: ${data.merchant}\n` +
                     `📊 Categoria: ${data.category}\n` +
                     `📅 Data: ${data.date}`;
        break;

      case 'monthly_summary':
        emoji = '📅';
        messageText = `${emoji} *Relatório Mensal - ${data.month}*\n\n` +
                     `Olá ${profile.nome}! Aqui está seu resumo do mês:\n\n` +
                     `💰 Receitas: R$ ${data.income}\n` +
                     `💸 Despesas: R$ ${data.expenses}\n` +
                     `📈 Saldo: R$ ${data.balance}\n` +
                     `💾 Taxa de economia: ${data.savingsRate}%\n\n` +
                     `🏆 Principais gastos:\n${data.topCategories?.map((cat: any) => 
                       `• ${cat.name}: R$ ${cat.amount}`
                     ).join('\n') || 'Nenhum gasto registrado'}`;
        break;

      case 'high_value_transaction':
        emoji = '💰';
        messageText = `${emoji} *Transação de Alto Valor*\n\n` +
                     `${data.type === 'expense' ? '💸 Despesa' : '💰 Receita'} de R$ ${data.amount} detectada!\n\n` +
                     `📍 Local: ${data.merchant || 'N/D'}\n` +
                     `📊 Categoria: ${data.category || 'N/D'}\n` +
                     `📅 Data: ${data.date}`;
        break;

      default:
        messageText = data.message || 'Você tem uma nova notificação!';
    }

    // Send WhatsApp message
    const whatsappMessage = {
      messaging_product: 'whatsapp',
      to: profile.phone,
      type: 'text',
      text: {
        body: messageText
      }
    };

    const response = await fetch(
      `https://graph.facebook.com/v17.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappMessage)
      }
    );

    const result = await response.json();
    console.log('WhatsApp API response:', result);

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${JSON.stringify(result)}`);
    }

    return new Response(JSON.stringify({ success: true, messageId: result.messages?.[0]?.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in send-whatsapp-notification:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
