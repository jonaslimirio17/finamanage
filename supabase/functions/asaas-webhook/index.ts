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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN');

    // Validar token do webhook
    if (webhookToken) {
      const receivedToken = req.headers.get('asaas-access-token');
      if (receivedToken !== webhookToken) {
        console.error('Invalid webhook token');
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const payload = await req.json();

    console.log('Webhook received:', payload.event);

    const { event, payment, subscription } = payload;

    // Eventos de pagamento
    if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
      await handlePaymentConfirmed(supabase, payment);
    }

    // Evento de assinatura criada
    else if (event === 'SUBSCRIPTION_CREATED') {
      console.log('Subscription created:', subscription.id);
    }

    // Evento de assinatura atualizada
    else if (event === 'SUBSCRIPTION_UPDATED') {
      await handleSubscriptionUpdated(supabase, subscription);
    }

    // Evento de assinatura deletada/cancelada
    else if (event === 'SUBSCRIPTION_DELETED') {
      await handleSubscriptionCanceled(supabase, subscription);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in asaas-webhook:', error);
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

async function handlePaymentConfirmed(supabase: any, payment: any) {
  console.log('Payment confirmed:', payment.id);

  // 1. Atualizar pagamento no banco
  const { data: paymentRecord, error: paymentUpdateError } = await supabase
    .from('asaas_payments')
    .update({
      status: payment.status,
      payment_date: new Date().toISOString(),
    })
    .eq('asaas_payment_id', payment.id)
    .select('profile_id, subscription_id')
    .single();

  if (paymentUpdateError) {
    console.error('Error updating payment:', paymentUpdateError);
    return;
  }

  if (!paymentRecord) {
    console.error('Payment not found:', payment.id);
    return;
  }

  // 2. Buscar assinatura relacionada
  const { data: subscription, error: subError } = await supabase
    .from('asaas_subscriptions')
    .select('next_due_date')
    .eq('profile_id', paymentRecord.profile_id)
    .single();

  if (subError || !subscription) {
    console.error('Subscription not found for payment');
    return;
  }

  // 3. Ativar/renovar premium no profile
  const expiresAt = new Date(subscription.next_due_date);
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_plan, subscription_started_at')
    .eq('id', paymentRecord.profile_id)
    .single();

  const updateData: any = {
    subscription_plan: 'premium',
    subscription_expires_at: expiresAt.toISOString(),
  };

  // Se é o primeiro pagamento, definir started_at
  if (profile?.subscription_plan !== 'premium') {
    updateData.subscription_started_at = new Date().toISOString();
  }

  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', paymentRecord.profile_id);

  if (profileUpdateError) {
    console.error('Error updating profile:', profileUpdateError);
    return;
  }

  // 4. Enviar notificação WhatsApp (opcional)
  const message = profile?.subscription_plan === 'premium'
    ? '🎉 Sua assinatura Premium foi renovada com sucesso!'
    : '🎉 Bem-vindo ao Premium FinaManage! Aproveite todos os benefícios exclusivos.';

  try {
    await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        profile_id: paymentRecord.profile_id,
        message,
      },
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }

  console.log('Premium activated for user:', paymentRecord.profile_id);
}

async function handleSubscriptionUpdated(supabase: any, subscription: any) {
  console.log('Subscription updated:', subscription.id);

  const { error } = await supabase
    .from('asaas_subscriptions')
    .update({
      status: subscription.status,
      next_due_date: subscription.nextDueDate,
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionCanceled(supabase: any, subscription: any) {
  console.log('Subscription canceled:', subscription.id);

  // 1. Atualizar status da assinatura
  const { data: subRecord, error: subError } = await supabase
    .from('asaas_subscriptions')
    .update({
      status: 'INACTIVE',
      updated_at: new Date().toISOString(),
    })
    .eq('asaas_subscription_id', subscription.id)
    .select('profile_id')
    .single();

  if (subError || !subRecord) {
    console.error('Error updating canceled subscription:', subError);
    return;
  }

  // 2. Nota: NÃO removemos o premium imediatamente
  // O usuário mantém acesso até subscription_expires_at
  console.log('User will keep access until subscription_expires_at');

  // 3. Enviar notificação WhatsApp
  try {
    await supabase.functions.invoke('send-whatsapp-notification', {
      body: {
        profile_id: subRecord.profile_id,
        message: '❌ Sua assinatura Premium foi cancelada. Você terá acesso até o fim do período pago.',
      },
    });
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
  }
}
