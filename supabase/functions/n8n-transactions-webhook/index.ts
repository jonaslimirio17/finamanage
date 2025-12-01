import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook token for security
    const webhookToken = req.headers.get('x-webhook-token');
    const expectedToken = Deno.env.get('N8N_WEBHOOK_TOKEN');
    
    if (!expectedToken) {
      console.warn('N8N_WEBHOOK_TOKEN not configured. Please add it in Lovable Cloud secrets.');
    }
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.error('Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse incoming transaction data from N8N
    const transactionData = await req.json();
    
    console.log('Received transaction data:', JSON.stringify(transactionData, null, 2));

    // Validate required fields
    if (!transactionData.profile_id || !transactionData.account_id || !transactionData.amount || !transactionData.date || !transactionData.type) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: profile_id, account_id, amount, date, type' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert transaction into database
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        profile_id: transactionData.profile_id,
        account_id: transactionData.account_id,
        amount: transactionData.amount,
        date: transactionData.date,
        type: transactionData.type,
        merchant: transactionData.merchant || null,
        category: transactionData.category || null,
        subcategory: transactionData.subcategory || null,
        raw_description: transactionData.raw_description || null,
        tags: transactionData.tags || null,
        currency: transactionData.currency || 'BRL',
        imported_from: 'n8n_whatsapp'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to insert transaction', details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transaction inserted successfully:', data.id);

    // Log event
    await supabase.from('events_logs').insert({
      profile_id: transactionData.profile_id,
      event_type: 'transaction_created',
      payload: { transaction_id: data.id, source: 'n8n_whatsapp' }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: data.id,
        message: 'Transaction created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in n8n-transactions-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});