import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

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
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('asaas_subscriptions')
      .select('asaas_subscription_id, status')
      .eq('profile_id', user.id)
      .eq('status', 'ACTIVE')
      .single();

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'Nenhuma assinatura ativa encontrada' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Cancelar no Asaas
    const cancelResponse = await fetch(
      `https://api.asaas.com/v3/subscriptions/${subscription.asaas_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'access_token': asaasApiKey,
        },
      }
    );

    if (!cancelResponse.ok) {
      const errorData = await cancelResponse.json();
      console.error('Asaas cancel error:', errorData);
      throw new Error(errorData.errors?.[0]?.description || 'Erro ao cancelar assinatura');
    }

    // O webhook receberá o evento SUBSCRIPTION_DELETED e atualizará o banco

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Assinatura cancelada. Você terá acesso até o fim do período pago.',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in asaas-cancel-subscription:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
