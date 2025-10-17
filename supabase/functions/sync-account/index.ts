import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate transaction hash for deduplication
async function generateTransactionHash(
  profileId: string,
  date: string,
  amount: number,
  description: string
): Promise<string> {
  const data = `${profileId}${date}${amount}${description}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Normalize date to ISO format
function normalizeDate(dateStr: string): string | null {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  } catch {
    return null;
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

    const { account_id } = await req.json();

    if (!account_id) {
      throw new Error('Missing account_id');
    }

    console.log('Starting sync for account:', account_id);

    // Fetch account details
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', account_id)
      .eq('profile_id', user.id)
      .single();

    if (accountError || !account) {
      throw new Error('Account not found or unauthorized');
    }

    // Get aggregator credentials from environment
    const aggregatorUrl = Deno.env.get('AGGREGATOR_API_URL');
    const aggregatorKey = Deno.env.get('AGGREGATOR_API_KEY');

    if (!aggregatorUrl || !aggregatorKey) {
      console.error('Missing aggregator credentials');
      throw new Error('Aggregator not configured');
    }

    // Calculate date range (last 12 months)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);

    // Call aggregator API
    console.log('Calling aggregator API for account:', account.provider_account_id);
    
    const aggregatorResponse = await fetch(`${aggregatorUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${aggregatorKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        account_id: account.provider_account_id,
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      }),
    });

    if (!aggregatorResponse.ok) {
      throw new Error(`Aggregator API error: ${aggregatorResponse.statusText}`);
    }

    const aggregatorData = await aggregatorResponse.json();
    const transactions = aggregatorData.transactions || [];

    console.log(`Received ${transactions.length} transactions from aggregator`);

    let inserted = 0;
    let duplicates = 0;
    let errors = 0;
    const insertedIds: string[] = [];
    let totalBalance = 0;

    // Process each transaction
    for (const txn of transactions) {
      try {
        // Normalize transaction data
        const date = normalizeDate(txn.date || txn.transaction_date);
        if (!date) {
          console.error('Invalid date for transaction:', txn);
          errors++;
          continue;
        }

        const amount = parseFloat(txn.amount);
        if (isNaN(amount)) {
          console.error('Invalid amount for transaction:', txn);
          errors++;
          continue;
        }

        const description = txn.description || txn.merchant || 'Unknown';
        
        // Generate hash for deduplication
        const hash = await generateTransactionHash(
          user.id,
          date,
          amount,
          description
        );

        // Check if transaction already exists
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('provider_transaction_id', hash)
          .maybeSingle();

        if (existing) {
          duplicates++;
          continue;
        }

        // Insert transaction
        const { data: newTxn, error: insertError } = await supabase
          .from('transactions')
          .insert({
            profile_id: user.id,
            account_id: account.id,
            date,
            amount,
            type: amount < 0 ? 'expense' : 'income',
            merchant: txn.merchant || null,
            raw_description: description,
            currency: txn.currency || 'BRL',
            provider_transaction_id: hash,
            imported_from: `sync:${account.provider}`,
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting transaction:', insertError);
          errors++;
        } else {
          inserted++;
          insertedIds.push(newTxn.id);
          totalBalance += amount;
        }
      } catch (error) {
        console.error('Error processing transaction:', error);
        errors++;
      }
    }

    // Update account balance and last_sync
    const { error: updateError } = await supabase
      .from('accounts')
      .update({
        balance: account.balance + totalBalance,
        last_sync: new Date().toISOString(),
      })
      .eq('id', account.id);

    if (updateError) {
      console.error('Error updating account:', updateError);
    }

    // Call categorize-transactions if we inserted any transactions
    if (insertedIds.length > 0) {
      console.log(`Categorizing ${insertedIds.length} transactions`);
      
      try {
        const { error: categorizeError } = await supabase.functions.invoke('categorize-transactions', {
          body: {
            profile_id: user.id,
            transaction_ids: insertedIds,
          },
        });

        if (categorizeError) {
          console.error('Error categorizing transactions:', categorizeError);
        }
      } catch (error) {
        console.error('Failed to call categorize-transactions:', error);
      }
    }

    // Log event
    await supabase
      .from('events_logs')
      .insert({
        profile_id: user.id,
        event_type: 'account_synced',
        payload: {
          account_id: account.id,
          provider: account.provider,
          inserted,
          duplicates,
          errors,
          total_transactions: transactions.length,
        },
      });

    const result = {
      status: 'success',
      account_id: account.id,
      inserted,
      duplicates,
      errors,
      total: transactions.length,
    };

    console.log('Sync completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in sync-account function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        status: 'error',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
