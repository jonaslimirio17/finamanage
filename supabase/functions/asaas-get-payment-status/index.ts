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

    const { payment_id } = await req.json();

    if (!payment_id) {
      throw new Error('payment_id is required');
    }

    // Verificar se o pagamento pertence ao usuário
    const { data: payment, error: paymentError } = await supabase
      .from('asaas_payments')
      .select('asaas_payment_id, status')
      .eq('profile_id', user.id)
      .eq('asaas_payment_id', payment_id)
      .single();

    if (paymentError || !payment) {
      return new Response(
        JSON.stringify({ error: 'Pagamento não encontrado' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Consultar status no Asaas
    const statusResponse = await fetch(
      `https://api.asaas.com/v3/payments/${payment_id}`,
      {
        headers: { 'access_token': asaasApiKey },
      }
    );

    if (!statusResponse.ok) {
      throw new Error('Erro ao consultar status do pagamento');
    }

    const paymentData = await statusResponse.json();

    // Se for PIX, buscar QR Code
    let pixData = null;
    if (paymentData.billingType === 'PIX' && paymentData.status === 'PENDING') {
      const pixResponse = await fetch(
        `https://api.asaas.com/v3/payments/${payment_id}/pixQrCode`,
        {
          headers: { 'access_token': asaasApiKey },
        }
      );

      if (pixResponse.ok) {
        const pix = await pixResponse.json();
        pixData = {
          qrcode: pix.encodedImage,
          copy_paste: pix.payload,
        };
      }
    }

    // Atualizar status no banco se mudou
    if (paymentData.status !== payment.status) {
      await supabase
        .from('asaas_payments')
        .update({ status: paymentData.status })
        .eq('asaas_payment_id', payment_id);
    }

    return new Response(
      JSON.stringify({
        status: paymentData.status,
        value: paymentData.value,
        due_date: paymentData.dueDate,
        payment_date: paymentData.paymentDate,
        invoice_url: paymentData.invoiceUrl,
        pix: pixData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in asaas-get-payment-status:', error);
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
