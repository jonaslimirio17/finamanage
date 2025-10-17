import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Import CSV function called");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("User authenticated:", user.id);

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Processing file:", file.name, "Type:", file.type);

    const fileContent = await file.text();
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Empty file' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get or create a default account for imported transactions
    let { data: accounts } = await supabaseClient
      .from('accounts')
      .select('id')
      .eq('profile_id', user.id)
      .eq('provider', 'csv_import')
      .limit(1);

    let accountId: string;

    if (!accounts || accounts.length === 0) {
      console.log("Creating new import account");
      const { data: newAccount, error: accountError } = await supabaseClient
        .from('accounts')
        .insert({
          profile_id: user.id,
          provider: 'csv_import',
          provider_account_id: 'csv-import-default',
          account_type: 'imported',
          balance: 0
        })
        .select()
        .single();

      if (accountError) {
        console.error("Error creating account:", accountError);
        throw accountError;
      }
      accountId = newAccount.id;
    } else {
      accountId = accounts[0].id;
    }

    console.log("Using account ID:", accountId);

    // Parse CSV (assuming format: date,amount,merchant,category,type)
    // Skip header row
    const dataLines = lines.slice(1);
    const transactions = [];

    for (const line of dataLines) {
      const parts = line.split(',').map(p => p.trim());
      
      if (parts.length < 3) continue; // Skip invalid lines

      const [date, amount, merchant, category = '', type = 'debit'] = parts;

      // Basic validation
      if (!date || !amount || !merchant) continue;

      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount)) continue;

      transactions.push({
        profile_id: user.id,
        account_id: accountId,
        date: date,
        amount: parsedAmount,
        merchant: merchant,
        category: category || null,
        subcategory: null,
        type: type.toLowerCase() === 'credit' ? 'credit' : 'debit',
        currency: 'BRL',
        imported_from: 'csv',
        raw_description: line
      });
    }

    console.log(`Parsed ${transactions.length} transactions from ${dataLines.length} lines`);

    if (transactions.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid transactions found in file', count: 0 }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert transactions
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('transactions')
      .insert(transactions)
      .select();

    if (insertError) {
      console.error("Error inserting transactions:", insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} transactions`);

    // Log the import event
    await supabaseClient.from('events_logs').insert({
      profile_id: user.id,
      event_type: 'csv_import_completed',
      payload: {
        filename: file.name,
        transaction_count: insertedData?.length || 0
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        count: insertedData?.length || 0,
        message: `Successfully imported ${insertedData?.length || 0} transactions`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in import-csv function:", error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
