import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateCouponRequest {
  couponCode: string;
}

interface CouponValidation {
  valid: boolean;
  prize?: string;
  discountType?: string;
  message: string;
  expiresIn?: number; // days remaining
}

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, 60000);

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { limited: false };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }

  record.count++;
  return { limited: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Apply rate limiting
  const clientIP = getClientIP(req);
  const { limited, retryAfter } = isRateLimited(clientIP);
  
  if (limited) {
    console.log(`Rate limited IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ valid: false, message: 'Muitas tentativas. Tente novamente em alguns segundos.' } as CouponValidation),
      { 
        status: 429, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(retryAfter || 60)
        } 
      }
    );
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body: ValidateCouponRequest = await req.json();
    const { couponCode } = body;

    if (!couponCode || couponCode.trim() === '') {
      return new Response(
        JSON.stringify({ valid: false, message: 'Código do cupom é obrigatório' } as CouponValidation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar cupom no banco
    const { data: coupon, error } = await supabase
      .from('fair_leads')
      .select('id, coupon_code, prize_won, discount_type, redeemed_at, created_at')
      .eq('coupon_code', couponCode.toUpperCase().trim())
      .maybeSingle();

    if (error) {
      console.error('Error fetching coupon:', error);
      throw new Error('Erro ao validar cupom');
    }

    if (!coupon) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Cupom não encontrado' } as CouponValidation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar se já foi usado
    if (coupon.redeemed_at) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Este cupom já foi utilizado' } as CouponValidation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar validade (30 dias)
    const createdAt = new Date(coupon.created_at);
    const expiresAt = new Date(createdAt);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const now = new Date();

    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, message: 'Este cupom expirou' } as CouponValidation),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Determinar o tipo de desconto baseado no prêmio
    let discountType = coupon.discount_type;
    if (!discountType) {
      // Fallback para prêmios antigos sem discount_type
      const prizeMapping: Record<string, string> = {
        '1 mês grátis': 'free_months_1',
        '2 meses grátis': 'free_months_2',
        '3 meses grátis': 'free_months_3',
        '30% desconto': 'percent_30_6m',
        '50% desconto': 'percent_50_6m',
        '30% off 6 meses': 'percent_30_6m',
        '50% off 6 meses': 'percent_50_6m',
      };
      discountType = prizeMapping[coupon.prize_won] || 'unknown';
    }

    const response: CouponValidation = {
      valid: true,
      prize: coupon.prize_won,
      discountType,
      message: `Cupom válido! ${coupon.prize_won}`,
      expiresIn: daysRemaining,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in validate-coupon:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ valid: false, message: errorMessage } as CouponValidation),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
