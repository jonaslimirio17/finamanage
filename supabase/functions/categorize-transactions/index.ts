import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Heuristic-based categorization with keyword matching
function categorizeTransaction(description: string, merchant: string | null, amount: number): {
  category: string;
  subcategory: string | null;
} {
  const text = (description + ' ' + (merchant || '')).toLowerCase();
  
  // Subscriptions (streaming, software, etc.)
  if (text.match(/netflix|spotify|amazon prime|disney|hbo|youtube premium|apple music|deezer/)) {
    return { category: 'Assinaturas', subcategory: 'Streaming' };
  }
  if (text.match(/adobe|microsoft|google workspace|dropbox|notion|canva/)) {
    return { category: 'Assinaturas', subcategory: 'Software' };
  }
  
  // Food & Dining
  if (text.match(/restaurante|lanche|padaria|cafe|pizzaria|ifood|rappi|uber eats|food|bar/)) {
    return { category: 'Alimentação', subcategory: 'Restaurantes' };
  }
  if (text.match(/supermercado|mercado|hortifruti|açougue|grocery|Extra|Carrefour|Pão de Açúcar/i)) {
    return { category: 'Alimentação', subcategory: 'Supermercado' };
  }
  
  // Transportation
  if (text.match(/uber|99|taxi|combustivel|gasolina|posto|shell|ipiranga/)) {
    return { category: 'Transporte', subcategory: 'Combustível e Transportes' };
  }
  if (text.match(/estacionamento|parking|zona azul/)) {
    return { category: 'Transporte', subcategory: 'Estacionamento' };
  }
  
  // Bills & Utilities
  if (text.match(/luz|energia|eletric|cemig|cpfl|enel/)) {
    return { category: 'Contas', subcategory: 'Energia' };
  }
  if (text.match(/agua|saneamento|sabesp|cedae/)) {
    return { category: 'Contas', subcategory: 'Água' };
  }
  if (text.match(/internet|telefone|celular|tim|claro|vivo|oi|net|sky/)) {
    return { category: 'Contas', subcategory: 'Telecomunicações' };
  }
  if (text.match(/aluguel|condominio|rent|condomínio/)) {
    return { category: 'Contas', subcategory: 'Moradia' };
  }
  
  // Entertainment
  if (text.match(/cinema|teatro|show|entretenimento|ingresso|ticket/)) {
    return { category: 'Entretenimento', subcategory: 'Lazer' };
  }
  
  // Shopping
  if (text.match(/magazine|loja|shop|mercado livre|shopee|amazon|americanas|casas bahia/)) {
    return { category: 'Compras', subcategory: 'Varejo' };
  }
  
  // Health
  if (text.match(/farmacia|drogaria|hospital|clinica|medico|saude|plano de saude|unimed|amil|sulamerica/)) {
    return { category: 'Saúde', subcategory: 'Medicamentos e Consultas' };
  }
  
  // Education
  if (text.match(/escola|universidade|curso|faculdade|livro|education|livraria/)) {
    return { category: 'Educação', subcategory: null };
  }
  
  // Salary/Income
  if (amount > 0 && text.match(/salario|salary|pagamento|transferencia recebida|pix recebido|income/)) {
    return { category: 'Renda', subcategory: 'Salário' };
  }
  
  // Unclassified - will be marked for review
  return { category: 'Sem categoria', subcategory: null };
}

// Detect recurring transactions (monthly pattern)
async function detectRecurringPattern(
  supabase: any,
  profileId: string,
  merchant: string | null
): Promise<boolean> {
  if (!merchant) return false;
  
  try {
    // Look for transactions with same merchant in the last 90 days
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const { data, error } = await supabase
      .from('transactions')
      .select('date, amount')
      .eq('profile_id', profileId)
      .eq('merchant', merchant)
      .gte('date', threeMonthsAgo.toISOString().split('T')[0])
      .order('date', { ascending: true });
    
    if (error || !data || data.length < 2) return false;
    
    // Check if transactions appear monthly (simple heuristic: 2+ transactions ~30 days apart)
    for (let i = 1; i < data.length; i++) {
      const prevDate = new Date(data[i - 1].date);
      const currDate = new Date(data[i].date);
      const daysDiff = Math.abs((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // If transactions are 25-35 days apart, likely monthly
      if (daysDiff >= 25 && daysDiff <= 35) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error detecting recurring pattern');
    return false;
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

    console.log('Categorizing transactions');

    let categorized = 0;
    let unclassified = 0;
    let skipped = 0;
    const needsReview: string[] = [];

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
          console.error('Transaction not found or unauthorized');
          skipped++;
          continue;
        }

        // Skip if already categorized (and not "Sem categoria")
        if (txn.category && txn.category !== 'Outros' && txn.category !== 'Sem categoria') {
          skipped++;
          continue;
        }

        // Apply keyword-based categorization
        let { category, subcategory } = categorizeTransaction(
          txn.raw_description || txn.merchant || '',
          txn.merchant,
          txn.amount
        );

        // Check for recurring patterns if merchant exists
        if (txn.merchant && category !== 'Assinaturas') {
          const isRecurring = await detectRecurringPattern(
            supabase,
            profile_id,
            txn.merchant
          );
          
          if (isRecurring) {
            category = 'Assinaturas';
            subcategory = 'Recorrente';
          }
        }

        // Track unclassified transactions
        if (category === 'Sem categoria') {
          unclassified++;
          needsReview.push(txnId);
        }

        // Update transaction with tags for review queue
        const tags = category === 'Sem categoria' ? ['needs_review'] : txn.tags || [];

        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            category,
            subcategory,
            tags,
          })
          .eq('id', txnId);

        if (updateError) {
          console.error('Error updating transaction');
          skipped++;
        } else {
          categorized++;
        }
      } catch (error) {
        console.error('Error processing transaction');
        skipped++;
      }
    }

    // Log event with detailed categorization stats
    await supabase
      .from('events_logs')
      .insert({
        profile_id,
        event_type: 'transactions_categorized',
        payload: {
          categorized_count: categorized,
          unclassified_count: unclassified,
          skipped_count: skipped,
          total: transaction_ids.length,
          needs_review: needsReview,
          timestamp: new Date().toISOString(),
        },
      });

    const result = {
      status: 'success',
      categorized_count: categorized,
      unclassified_count: unclassified,
      skipped_count: skipped,
      needs_review_ids: needsReview,
      total: transaction_ids.length,
    };

    console.log('Categorization completed');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in categorize-transactions function');
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to categorize transactions',
        status: 'error',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
