import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to get or create an account for the user
async function getOrCreateAccount(supabase: any, profileId: string): Promise<string | null> {
  // First, try to find an existing account
  const { data: existingAccount } = await supabase
    .from('accounts')
    .select('id')
    .eq('profile_id', profileId)
    .limit(1)
    .maybeSingle();

  if (existingAccount) {
    return existingAccount.id;
  }

  // Create a new "WhatsApp" account for the user
  const { data: newAccount, error } = await supabase
    .from('accounts')
    .insert({
      profile_id: profileId,
      provider: 'whatsapp',
      provider_account_id: `whatsapp_${profileId}`,
      account_type: 'checking',
      balance: 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating account:', error);
    return null;
  }

  return newAccount?.id || null;
}

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
        
        // Get or create account for this user
        const accountId = await getOrCreateAccount(supabase, profileId);

        if (!accountId) {
          responseText = '❌ Erro ao criar conta. Por favor, tente novamente.';
        } else {
          // Create transaction
          const { error: txError } = await supabase
            .from('transactions')
            .insert({
              profile_id: profileId,
              account_id: accountId,
              amount: Math.abs(extracted.amount || 0),
              date: extracted.date || new Date().toISOString().split('T')[0],
              merchant: extracted.merchant || 'Comprovante WhatsApp',
              category: extracted.category || 'Sem categoria',
              type: extracted.type || 'expense',
              imported_from: 'whatsapp',
              raw_description: `Comprovante enviado via WhatsApp`
            });

          if (txError) {
            console.error('Error creating transaction:', txError);
            responseText = '❌ Erro ao registrar transação. Por favor, tente novamente.';
          } else {
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

            const typeText = extracted.type === 'income' ? 'Receita' : 'Despesa';
            responseText = `✅ *${typeText} Registrada!*\n\n` +
                          `💰 Valor: R$ ${Math.abs(extracted.amount || 0).toFixed(2)}\n` +
                          `📊 Categoria: ${extracted.category || 'Sem categoria'}\n\n` +
                          'Seus dados financeiros foram atualizados. 🎉';
          }
        }
      } else {
        responseText = '❌ Comprovante não encontrado. Por favor, envie novamente.';
      }
    } else if (command === 'cancel_receipt') {
      // Update receipt status to cancelled
      if (context?.receiptId) {
        await supabase
          .from('receipt_uploads')
          .update({ status: 'cancelled' })
          .eq('id', context.receiptId);
      }

      await supabase
        .from('whatsapp_sessions')
        .update({ state: 'idle', context: {} })
        .eq('id', sessionId);

      responseText = '❌ Registro cancelado. Envie outro comprovante quando quiser.';
    } else if (command === 'edit_receipt') {
      responseText = '✏️ Para editar os dados, responda com o formato:\n\n' +
                    '*EDITAR*\n' +
                    'Valor: 150.00\n' +
                    'Data: 15/01/2025\n' +
                    'Local: Supermercado\n' +
                    'Categoria: Alimentação\n' +
                    'Tipo: Despesa\n\n' +
                    'Ou envie um novo comprovante.';
    } else if (command.toUpperCase().startsWith('EDITAR') && context?.receiptId) {
      // Parse edit command
      const lines = command.split('\n');
      const updates: any = {};
      
      for (const line of lines) {
        const [key, ...valueParts] = line.split(':');
        const value = valueParts.join(':').trim();
        
        if (key && value) {
          const keyLower = key.toLowerCase().trim();
          if (keyLower.includes('valor')) {
            updates.amount = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
          } else if (keyLower.includes('data')) {
            // Parse DD/MM/YYYY to YYYY-MM-DD
            const [day, month, year] = value.split('/');
            if (day && month && year) {
              updates.date = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
          } else if (keyLower.includes('local')) {
            updates.merchant = value;
          } else if (keyLower.includes('categoria')) {
            updates.category = value;
          } else if (keyLower.includes('tipo')) {
            updates.type = value.toLowerCase().includes('receita') ? 'income' : 'expense';
          }
        }
      }

      if (Object.keys(updates).length > 0) {
        // Get current extracted data and merge updates
        const { data: receipt } = await supabase
          .from('receipt_uploads')
          .select('extracted_data')
          .eq('id', context.receiptId)
          .single();

        const newExtractedData = {
          ...(receipt?.extracted_data as any || {}),
          ...updates
        };

        await supabase
          .from('receipt_uploads')
          .update({ extracted_data: newExtractedData })
          .eq('id', context.receiptId);

        // Update session context
        await supabase
          .from('whatsapp_sessions')
          .update({ 
            context: { ...context, extractedData: newExtractedData }
          })
          .eq('id', sessionId);

        responseText = `✅ Dados atualizados!\n\n` +
                      `💰 Valor: R$ ${newExtractedData.amount?.toFixed(2) || 'N/D'}\n` +
                      `📅 Data: ${newExtractedData.date || 'N/D'}\n` +
                      `🏪 Local: ${newExtractedData.merchant || 'N/D'}\n` +
                      `📊 Categoria: ${newExtractedData.category || 'N/D'}\n` +
                      `📍 Tipo: ${newExtractedData.type === 'income' ? 'Receita' : 'Despesa'}\n\n` +
                      `Confirma os dados? Responda *SIM* ou *NÃO*`;
      } else {
        responseText = '❓ Não consegui entender as alterações. Por favor, use o formato:\n\n' +
                      '*EDITAR*\nValor: 150.00\nData: 15/01/2025';
      }
    } else if ((command.toUpperCase() === 'SIM' || command.toLowerCase() === 'confirmar') && context?.receiptId) {
      // Confirm edited receipt
      const { data: receipt } = await supabase
        .from('receipt_uploads')
        .select('extracted_data')
        .eq('id', context.receiptId)
        .single();

      if (receipt) {
        const extracted = receipt.extracted_data as any;
        const accountId = await getOrCreateAccount(supabase, profileId);

        if (accountId) {
          await supabase
            .from('transactions')
            .insert({
              profile_id: profileId,
              account_id: accountId,
              amount: Math.abs(extracted.amount || 0),
              date: extracted.date || new Date().toISOString().split('T')[0],
              merchant: extracted.merchant || 'Comprovante WhatsApp',
              category: extracted.category || 'Sem categoria',
              type: extracted.type || 'expense',
              imported_from: 'whatsapp'
            });

          await supabase
            .from('receipt_uploads')
            .update({ status: 'confirmed' })
            .eq('id', context.receiptId);

          await supabase
            .from('whatsapp_sessions')
            .update({ state: 'idle', context: {} })
            .eq('id', sessionId);

          responseText = '✅ *Transação Registrada!*\n\n' +
                        'Seus dados financeiros foram atualizados. 🎉';
        }
      }
    } else if (command.toUpperCase() === 'NÃO' && context?.receiptId) {
      responseText = '✏️ Para editar, envie as correções:\n\n' +
                    '*EDITAR*\nValor: 150.00\nData: 15/01/2025\n\n' +
                    'Ou digite *CANCELAR* para descartar.';
    } else if (command.toUpperCase() === 'CANCELAR' && context?.receiptId) {
      await supabase
        .from('receipt_uploads')
        .update({ status: 'cancelled' })
        .eq('id', context.receiptId);

      await supabase
        .from('whatsapp_sessions')
        .update({ state: 'idle', context: {} })
        .eq('id', sessionId);

      responseText = '❌ Registro cancelado.';
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
                    (topCategories ? `Top categorias:\n${topCategories}` : 'Nenhum gasto registrado ainda.');
    } else if (command.startsWith('/metas') || command.toLowerCase().includes('metas')) {
      // Get user's goals
      const { data: goals } = await supabase
        .from('goals')
        .select('title, target_amount, current_amount')
        .eq('profile_id', profileId)
        .eq('status', 'active');

      if (!goals || goals.length === 0) {
        responseText = '🎯 Você ainda não tem metas cadastradas.\n\n' +
                      'Acesse o app para criar suas metas financeiras!';
      } else {
        const goalsList = goals.map(g => {
          const progress = (Number(g.current_amount) / Number(g.target_amount) * 100).toFixed(0);
          const bar = getProgressBar(Number(progress));
          return `• ${g.title}\n  ${bar} ${progress}%\n  R$ ${g.current_amount} / R$ ${g.target_amount}`;
        }).join('\n\n');

        responseText = '🎯 *Suas Metas*\n\n' + goalsList;
      }
    } else if (command.startsWith('/ajuda') || command.toLowerCase().includes('ajuda') || command.toLowerCase() === 'menu') {
      responseText = '📋 *Comandos Disponíveis*\n\n' +
                    '💰 */saldo* - Ver saldo total\n' +
                    '💸 */gastos* - Gastos do mês\n' +
                    '🎯 */metas* - Progresso das metas\n' +
                    '📷 *Envie foto/PDF* - Registrar comprovante\n' +
                    '❓ */ajuda* - Esta lista de comandos\n\n' +
                    '💡 Dica: Você também pode digitar normalmente, como "ver meu saldo"';
    } else if (command === 'onboarding') {
      responseText = '👋 *Bem-vindo ao FinaManage!*\n\n' +
                    'Parece que você ainda não está cadastrado ou seu número não está vinculado.\n\n' +
                    'Para usar este serviço:\n' +
                    '1️⃣ Crie uma conta no app\n' +
                    '2️⃣ Acesse *Configurações > WhatsApp*\n' +
                    '3️⃣ Cadastre este número de telefone\n\n' +
                    '🔗 Acesse: https://finamanage.com/auth\n\n' +
                    'Após vincular, envie */ajuda* para ver os comandos!';
    } else if (command.toLowerCase().includes('olá') || command.toLowerCase().includes('oi') || command.toLowerCase() === 'hi' || command.toLowerCase() === 'hello') {
      // Greeting
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', profileId)
        .single();

      const name = profile?.nome?.split(' ')[0] || 'usuário';
      
      responseText = `👋 Olá, ${name}!\n\n` +
                    'Como posso ajudar você hoje?\n\n' +
                    '📷 Envie um *comprovante* para registrar\n' +
                    '💰 Digite */saldo* para ver seu saldo\n' +
                    '💸 Digite */gastos* para ver gastos do mês\n' +
                    '❓ Digite */ajuda* para mais comandos';
    } else {
      // Unknown command - try to understand intent
      const lowerCommand = command.toLowerCase();
      
      if (lowerCommand.includes('quanto') && (lowerCommand.includes('gast') || lowerCommand.includes('despesa'))) {
        // Redirect to gastos
        responseText = 'Entendi que você quer ver seus gastos. Processando...\n\n';
        // Process as /gastos command
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount, category')
          .eq('profile_id', profileId)
          .eq('type', 'expense')
          .gte('date', firstDay);

        const total = transactions?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        
        responseText += `💸 *Total de gastos este mês:*\nR$ ${total.toFixed(2)}`;
      } else {
        responseText = '❓ Não entendi sua mensagem.\n\n' +
                      'Você pode:\n' +
                      '• Enviar uma *foto de comprovante*\n' +
                      '• Digitar */ajuda* para ver comandos\n' +
                      '• Perguntar sobre *saldo*, *gastos* ou *metas*';
      }
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

// Helper function to create a text progress bar
function getProgressBar(percent: number): string {
  const filled = Math.round(percent / 10);
  const empty = 10 - filled;
  return '█'.repeat(Math.max(0, Math.min(10, filled))) + '░'.repeat(Math.max(0, empty));
}
