import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const WHATSAPP_PHONE_NUMBER_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { to, command, context, sessionId, profileId } = await req.json();
    console.log('Processing command:', command, 'for profile:', profileId);

    let responseText = '';

    // Handle button responses
    if (command === 'confirm_receipt' && context?.receiptId) {
      const { data: receipt } = await supabase
        .from('receipt_uploads')
        .select('extracted_data')
        .eq('id', context.receiptId)
        .single();

      if (receipt) {
        const extracted = receipt.extracted_data as any;
        
        // Find account for this user
        const { data: account } = await supabase
          .from('accounts')
          .select('id')
          .eq('profile_id', profileId)
          .limit(1)
          .single();

        // Create transaction
        await supabase
          .from('transactions')
          .insert({
            profile_id: profileId,
            account_id: account?.id,
            amount: extracted.amount,
            date: extracted.date,
            merchant: extracted.merchant,
            category: extracted.category,
            type: extracted.type,
            imported_from: 'whatsapp'
          });

        // Update receipt status
        await supabase
          .from('receipt_uploads')
          .update({ status: 'confirmed' })
          .eq('id', context.receiptId);

        // Reset session
        await supabase
          .from('whatsapp_sessions')
          .update({ state: 'idle', context: {} })
          .eq('id', sessionId);

        responseText = '✅ *Transação Confirmada!*\n\n' +
                      'Seus dados financeiros foram atualizados. 🎉';
      }
    } else if (command === 'cancel_receipt') {
      await supabase
        .from('whatsapp_sessions')
        .update({ state: 'idle', context: {} })
        .eq('id', sessionId);

      responseText = '❌ Transação cancelada.';
    } else if (command === 'edit_receipt') {
      responseText = '✏️ Para editar, envie os dados no formato:\n\n' +
                    'VALOR: 150.00\n' +
                    'DATA: 2025-01-15\n' +
                    'LOCAL: Supermercado\n' +
                    'CATEGORIA: Alimentação';
    } else if (command.startsWith('/saldo') || command.toLowerCase().includes('saldo')) {
      // Get user's balance
      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('profile_id', profileId);

      const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;

      responseText = '💰 *Seu Saldo Atual*\n\n' +
                    `Total: R$ ${totalBalance.toFixed(2)}`;
    } else if (command.startsWith('/gastos') || command.toLowerCase().includes('gastos')) {
      // Get current month expenses
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, category')
        .eq('profile_id', profileId)
        .eq('type', 'expense')
        .gte('date', firstDay);

      const total = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      // Group by category
      const byCategory: Record<string, number> = {};
      transactions?.forEach(t => {
        const cat = t.category || 'Outros';
        byCategory[cat] = (byCategory[cat] || 0) + Number(t.amount);
      });

      const topCategories = Object.entries(byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([cat, val]) => `• ${cat}: R$ ${val.toFixed(2)}`)
        .join('\n');

      responseText = '💸 *Gastos do Mês*\n\n' +
                    `Total: R$ ${total.toFixed(2)}\n\n` +
                    `Top categorias:\n${topCategories}`;
    } else if (command.startsWith('/metas') || command.toLowerCase().includes('metas')) {
      // Get user's goals
      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_amount, current_amount')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      if (!goals || goals.length === 0) {
        responseText = '🎯 Você ainda não tem metas cadastradas.';
      } else {
        const goalsList = goals.map(g => {
          const progress = (Number(g.current_amount) / Number(g.target_amount) * 100).toFixed(0);
          return `• ${g.title}: ${progress}% (R$ ${g.current_amount} / R$ ${g.target_amount})`;
        }).join('\n');

        responseText = '🎯 *Suas Metas*\n\n' + goalsList;
      }
    } else if (command.startsWith('/ajuda') || command.toLowerCase().includes('ajuda')) {
      responseText = '📋 *Comandos Disponíveis*\n\n' +
                    '💰 /saldo - Ver saldo total\n' +
                    '💸 /gastos - Gastos do mês\n' +
                    '🎯 /metas - Progresso das metas\n' +
                    '📷 Envie foto/PDF - Registrar comprovante\n\n' +
                    'Digite qualquer comando ou envie um comprovante!';
    } else if (command === 'onboarding') {
      responseText = '👋 *Bem-vindo ao FinaManage!*\n\n' +
                    'Parece que você ainda não está cadastrado.\n\n' +
                    'Para usar este serviço, você precisa:\n' +
                    '1. Criar uma conta no app\n' +
                    '2. Cadastrar este número de telefone no seu perfil\n\n' +
                    'Acesse: https://finamanage.com/auth';
    } else {
      // Unknown command
      responseText = '❓ Comando não reconhecido.\n\n' +
                    'Digite /ajuda para ver os comandos disponíveis.';
    }

    // Send response
    const whatsappMessage = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: responseText
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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-commands:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});