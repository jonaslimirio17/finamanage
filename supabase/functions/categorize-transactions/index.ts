import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rule-based categorization
function categorizeTransaction(description: string, merchant: string | null, amount: number): {
  category: string;
  subcategory: string | null;
} {
  const text = (description + ' ' + (merchant || '')).toLowerCase();
  
  // Food & Dining
  if (text.match(/restaurante|lanche|padaria|cafe|pizzaria|ifood|rappi|uber eats|food/)) {
    return { category: 'Alimentação', subcategory: 'Restaurantes' };
  }
  if (text.match(/supermercado|mercado|hortifruti|açougue|grocery/)) {
    return { category: 'Alimentação', subcategory: 'Supermercado' };
  }
  
  // Transportation
  if (text.match(/uber|99|taxi|combustivel|gasolina|posto|ipva|estacionamento|parking/)) {
    return { category: 'Transporte', subcategory: 'Combustível e Transportes' };
  }
  
  // Bills & Utilities
  if (text.match(/luz|energia|eletric|agua|saneamento|gas|internet|telefone|celular|tim|claro|vivo|oi/)) {
    return { category: 'Contas', subcategory: 'Utilidades' };
  }
  if (text.match(/aluguel|condominio|rent/)) {
    return { category: 'Contas', subcategory: 'Moradia' };
  }
  
  // Entertainment
  if (text.match(/netflix|spotify|amazon prime|disney|hbo|cinema|teatro|show|entretenimento/)) {
    return { category: 'Entretenimento', subcategory: 'Streaming e Lazer' };
  }
  
  // Shopping
  if (text.match(/magazine|loja|shop|mercado livre|shopee|amazon|americanas/)) {
    return { category: 'Compras', subcategory: 'Varejo' };
  }
  
  // Health
  if (text.match(/farmacia|drogaria|hospital|clinica|medico|saude|plano de saude|health/)) {
    return { category: 'Saúde', subcategory: 'Medicamentos e Consultas' };
  }
  
  // Education
  if (text.match(/escola|universidade|curso|faculdade|livro|education/)) {
    return { category: 'Educação', subcategory: null };
  }
  
  // Salary/Income
  if (amount > 0 && text.match(/salario|salary|pagamento|transferencia|pix recebido|income/)) {
    return { category: 'Renda', subcategory: 'Salário' };
  }
  
  // Default
  if (amount < 0) {
    return { category: 'Outros', subcategory: 'Despesas Diversas' };
  } else {
    return { category: 'Outros', subcategory: 'Receitas Diversas' };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { profile_id, transaction_ids } = await req.json();

    if (!profile_id || !transaction_ids || !Array.isArray(transaction_ids)) {
      throw new Error('Missing or invalid parameters');
    }

    if (profile_id !== user.id) {
      throw new Error('Unauthorized: profile_id mismatch');
    }

    console.log(`Categorizing ${transaction_ids.length} transactions for profile ${profile_id}`);

    let categorized = 0;
    let skipped = 0;

    // Fetch and categorize each transaction
    for (const txnId of transaction_ids) {
      try {
        // Get transaction
        const { data: txn, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .eq('id', txnId)
          .eq('profile_id', profile_id)
          .single();

        if (fetchError || !txn) {
          console.error('Transaction not found or unauthorized:', txnId);
          skipped++;
          continue;
        }

        // Skip if already categorized
        if (txn.category && txn.category !== 'Outros') {
          skipped++;
          continue;
        }

        // Categorize
        const { category, subcategory } = categorizeTransaction(
          txn.raw_description || txn.merchant || '',
          txn.merchant,
          txn.amount
        );

        // Update transaction
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            category,
            subcategory,
          })
          .eq('id', txnId);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
          skipped++;
        } else {
          categorized++;
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        skipped++;
      }
    }

    // Log event
    await supabase
      .from('events_logs')
      .insert({
        profile_id,
        event_type: 'transactions_categorized',
        payload: {
          categorized,
          skipped,
          total: transaction_ids.length,
        },
      });

    const result = {
      status: 'success',
      categorized,
      skipped,
      total: transaction_ids.length,
    };

    console.log('Categorization completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-transactions function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
