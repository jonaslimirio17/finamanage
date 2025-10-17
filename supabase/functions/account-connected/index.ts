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
    console.log("Account connected webhook called");

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

    // Parse request body
    const body = await req.json();
    const { 
      provider, 
      provider_account_id, 
      provider_session_id, 
      mask,
      account_type = 'checking'
    } = body;

    // Validate required fields
    if (!provider || !provider_account_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: provider and provider_account_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Creating account for provider:", provider);

    // Create account record
    const { data: account, error: accountError } = await supabaseClient
      .from('accounts')
      .insert({
        profile_id: user.id,
        provider: provider,
        provider_account_id: provider_account_id,
        account_type: account_type,
        mask: mask || null,
        balance: 0,
        refresh_token_hash: provider_session_id || null
      })
      .select()
      .single();

    if (accountError) {
      console.error("Error creating account:", accountError);
      throw accountError;
    }

    console.log("Account created successfully:", account.id);

    // Log the connection event
    await supabaseClient.from('events_logs').insert({
      profile_id: user.id,
      event_type: 'account_connected',
      payload: {
        provider: provider,
        account_id: account.id,
        provider_account_id: provider_account_id,
        mask: mask
      }
    });

    // Create consent record
    await supabaseClient.from('consents').insert({
      profile_id: user.id,
      consent_type: 'open_finance_connection',
      details: {
        provider: provider,
        account_id: account.id
      }
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        account_id: account.id,
        message: 'Account connected successfully'
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error in account-connected webhook:", error);
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
