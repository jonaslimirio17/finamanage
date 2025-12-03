import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSubscriptionRequest {
  payment_method: 'CREDIT_CARD' | 'PIX';
  cycle: 'MONTHLY' | 'SEMIANNUAL' | 'YEARLY';
  value: number;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  couponCode?: string;
  discountType?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const asaasApiKey = Deno.env.get('ASAAS_API_KEY');

    if (!asaasApiKey) {
      throw new Error('ASAAS_API_KEY not configured');
    }

    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service role client for coupon operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: CreateSubscriptionRequest = await req.json();
    const { payment_method, cycle, value, name, cpf, email, phone, creditCard, couponCode, discountType } = body;

    // Validar CPF
    const cleanCpf = cpf.replace(/\D/g, '');
    if (cleanCpf.length !== 11) {
      throw new Error('CPF inválido');
    }

    // Verificar se já tem assinatura ativa
    const { data: existingSub } = await supabase
      .from('asaas_subscriptions')
      .select('id, status')
      .eq('profile_id', user.id)
      .eq('status', 'ACTIVE')
      .maybeSingle();

    if (existingSub) {
      return new Response(
        JSON.stringify({ error: 'Você já possui uma assinatura ativa' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar cupom se fornecido
    let validCoupon = null;
    let finalDiscountType = discountType;

    if (couponCode) {
      const { data: coupon, error: couponError } = await supabaseAdmin
        .from('fair_leads')
        .select('id, coupon_code, prize_won, discount_type, redeemed_at, created_at')
        .eq('coupon_code', couponCode.toUpperCase().trim())
        .maybeSingle();

      if (couponError) {
        console.error('Error fetching coupon:', couponError);
      } else if (coupon) {
        // Verificar se já foi usado
        if (coupon.redeemed_at) {
          return new Response(
            JSON.stringify({ error: 'Este cupom já foi utilizado' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Verificar validade (30 dias)
        const createdAt = new Date(coupon.created_at);
        const expiresAt = new Date(createdAt);
        expiresAt.setDate(expiresAt.getDate() + 30);

        if (new Date() > expiresAt) {
          return new Response(
            JSON.stringify({ error: 'Este cupom expirou' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        validCoupon = coupon;
        finalDiscountType = coupon.discount_type || discountType;
      } else {
        return new Response(
          JSON.stringify({ error: 'Cupom não encontrado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 1. Criar/Atualizar cliente no Asaas
    const customerResponse = await fetch('https://api.asaas.com/v3/customers', {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        phone: phone.replace(/\D/g, ''),
        cpfCnpj: cleanCpf,
        externalReference: user.id,
      }),
    });

    const customerData = await customerResponse.json();
    
    if (!customerResponse.ok) {
      console.error('Asaas customer error:', customerData);
      throw new Error(customerData.errors?.[0]?.description || 'Erro ao criar cliente');
    }

    const customerId = customerData.id;

    // 2. Calcular próxima data de vencimento baseada no ciclo e cupom
    const nextDueDate = new Date();
    
    // Aplicar meses grátis se houver cupom
    if (finalDiscountType) {
      if (finalDiscountType === 'free_months_1') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (finalDiscountType === 'free_months_2') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 2);
      } else if (finalDiscountType === 'free_months_3') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 3);
      }
    }
    
    // Adicionar ciclo padrão se não for meses grátis
    if (!finalDiscountType || !finalDiscountType.startsWith('free_months')) {
      if (cycle === 'MONTHLY') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 1);
      } else if (cycle === 'SEMIANNUAL') {
        nextDueDate.setMonth(nextDueDate.getMonth() + 6);
      } else if (cycle === 'YEARLY') {
        nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
      }
    }

    // Calcular valor com desconto percentual se aplicável
    let subscriptionValue = value;
    let discountAppliedMonths = 0;

    if (finalDiscountType === 'percent_30_6m') {
      subscriptionValue = value * 0.7; // 30% off
      discountAppliedMonths = 6;
    } else if (finalDiscountType === 'percent_50_6m') {
      subscriptionValue = value * 0.5; // 50% off
      discountAppliedMonths = 6;
    }

    const subscriptionPayload: any = {
      customer: customerId,
      billingType: payment_method,
      value: subscriptionValue,
      cycle: cycle,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
      description: `Assinatura Premium FinaManage - ${cycle === 'MONTHLY' ? 'Mensal' : cycle === 'SEMIANNUAL' ? 'Semestral' : 'Anual'}${validCoupon ? ` (Cupom: ${couponCode})` : ''}`,
    };

    // Se for cartão, adicionar dados do cartão
    if (payment_method === 'CREDIT_CARD' && creditCard) {
      subscriptionPayload.creditCard = {
        holderName: creditCard.holderName,
        number: creditCard.number.replace(/\s/g, ''),
        expiryMonth: creditCard.expiryMonth,
        expiryYear: creditCard.expiryYear,
        ccv: creditCard.ccv,
      };
      subscriptionPayload.creditCardHolderInfo = {
        name,
        email,
        cpfCnpj: cleanCpf,
        phone: phone.replace(/\D/g, ''),
      };
    }

    console.log('Creating subscription with payload:', { 
      ...subscriptionPayload, 
      creditCard: subscriptionPayload.creditCard ? '***REDACTED***' : undefined 
    });

    const subscriptionResponse = await fetch('https://api.asaas.com/v3/subscriptions', {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const subscriptionData = await subscriptionResponse.json();
    
    if (!subscriptionResponse.ok) {
      console.error('Asaas subscription error:', subscriptionData);
      throw new Error(subscriptionData.errors?.[0]?.description || 'Erro ao criar assinatura');
    }

    // 3. Inserir assinatura no banco
    const { error: subInsertError } = await supabase
      .from('asaas_subscriptions')
      .insert({
        profile_id: user.id,
        asaas_subscription_id: subscriptionData.id,
        asaas_customer_id: customerId,
        status: subscriptionData.status,
        payment_method,
        value: subscriptionValue,
        next_due_date: subscriptionData.nextDueDate,
      });

    if (subInsertError) {
      console.error('Error inserting subscription:', subInsertError);
      throw subInsertError;
    }

    // 4. Marcar cupom como usado
    if (validCoupon) {
      const { error: couponUpdateError } = await supabaseAdmin
        .from('fair_leads')
        .update({ redeemed_at: new Date().toISOString() })
        .eq('id', validCoupon.id);

      if (couponUpdateError) {
        console.error('Error marking coupon as used:', couponUpdateError);
        // Não falhar a operação por causa disso
      } else {
        console.log('Coupon marked as used:', couponCode);
      }
    }

    // 5. Buscar informações do primeiro pagamento
    const paymentResponse = await fetch(
      `https://api.asaas.com/v3/payments?subscription=${subscriptionData.id}`,
      {
        headers: { 'access_token': asaasApiKey },
      }
    );

    const paymentListData = await paymentResponse.json();
    const firstPayment = paymentListData.data?.[0];

    if (firstPayment) {
      // Inserir pagamento no banco
      const paymentRecord: any = {
        profile_id: user.id,
        asaas_payment_id: firstPayment.id,
        value: firstPayment.value,
        payment_method: firstPayment.billingType,
        status: firstPayment.status,
        due_date: firstPayment.dueDate,
        invoice_url: firstPayment.invoiceUrl,
      };

      // Se for PIX, buscar informações do QR Code
      if (payment_method === 'PIX') {
        const pixResponse = await fetch(
          `https://api.asaas.com/v3/payments/${firstPayment.id}/pixQrCode`,
          {
            headers: { 'access_token': asaasApiKey },
          }
        );

        if (pixResponse.ok) {
          const pixData = await pixResponse.json();
          paymentRecord.pix_qrcode = pixData.encodedImage;
          paymentRecord.pix_copy_paste = pixData.payload;
        }
      }

      const { error: paymentInsertError } = await supabase
        .from('asaas_payments')
        .insert(paymentRecord);

      if (paymentInsertError) {
        console.error('Error inserting payment:', paymentInsertError);
      }
    }

    // 6. Ativar premium imediatamente para:
    // - Cartão confirmado imediatamente
    // - Cupom com meses grátis (ativar premium sem esperar pagamento)
    const shouldActivatePremium = 
      (payment_method === 'CREDIT_CARD' && firstPayment?.status === 'CONFIRMED') ||
      (finalDiscountType && finalDiscountType.startsWith('free_months'));

    if (shouldActivatePremium) {
      // Calcular data de expiração
      let expiresAt = new Date();
      
      if (finalDiscountType?.startsWith('free_months')) {
        // Para meses grátis, expiração é baseada nos meses grátis + ciclo
        const freeMonths = parseInt(finalDiscountType.split('_')[2]) || 0;
        expiresAt.setMonth(expiresAt.getMonth() + freeMonths);
        
        // Adicionar o ciclo após os meses grátis
        if (cycle === 'MONTHLY') {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (cycle === 'SEMIANNUAL') {
          expiresAt.setMonth(expiresAt.getMonth() + 6);
        } else if (cycle === 'YEARLY') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }
      } else {
        // Para pagamento confirmado sem cupom, usar nextDueDate
        expiresAt = new Date(nextDueDate);
      }

      await supabase
        .from('profiles')
        .update({
          subscription_plan: 'premium',
          subscription_started_at: new Date().toISOString(),
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', user.id);
        
      console.log('Premium activated for user:', user.id, 'expires at:', expiresAt.toISOString());
    }

    // Retornar resposta
    const response: any = {
      success: true,
      subscription_id: subscriptionData.id,
      payment_method,
      status: subscriptionData.status,
      next_due_date: subscriptionData.nextDueDate,
      coupon_applied: !!validCoupon,
      discount_type: finalDiscountType,
    };

    if (payment_method === 'PIX' && firstPayment) {
      const pixResponse = await fetch(
        `https://api.asaas.com/v3/payments/${firstPayment.id}/pixQrCode`,
        {
          headers: { 'access_token': asaasApiKey },
        }
      );

      if (pixResponse.ok) {
        const pixData = await pixResponse.json();
        response.pix = {
          qrcode: pixData.encodedImage,
          copy_paste: pixData.payload,
          payment_id: firstPayment.id,
        };
      }
    }

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in asaas-create-subscription:', error);
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
