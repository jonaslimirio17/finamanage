import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-forwarded-for',
};

// Rate limit configuration
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_REQUESTS_PER_IP = 5; // Max 5 signups per IP per hour
const MAX_REQUESTS_PER_EMAIL = 1; // Max 1 signup per email (ever)

// In-memory rate limiter (resets on function cold start, but provides first line of defense)
const ipRequests = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = ipRequests.get(ip);
  
  if (!record || now > record.resetTime) {
    ipRequests.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  
  if (record.count >= MAX_REQUESTS_PER_IP) {
    return true;
  }
  
  record.count++;
  return false;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    const { email, source_page, utm_source, utm_campaign } = await req.json();

    // Detect if request comes from fair page (shared IP scenario)
    const isFairSource = source_page === 'feira' || 
                         utm_source?.toLowerCase().includes('feira') ||
                         utm_campaign?.toLowerCase().includes('feira');

    console.log(`Pre-signup request from IP: ${clientIp}, source: ${source_page}, isFair: ${isFairSource}`);

    // Only apply IP rate limit for non-fair sources (fairs share same IP)
    if (!isFairSource && isRateLimited(clientIp)) {
      console.log(`Rate limited IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ 
          error: 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.',
          code: 'RATE_LIMITED'
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate email
    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email é obrigatório', code: 'INVALID_EMAIL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido', code: 'INVALID_EMAIL_FORMAT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email length
    if (email.length > 255) {
      return new Response(
        JSON.stringify({ error: 'Email muito longo', code: 'EMAIL_TOO_LONG' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if email already exists (database-level duplicate prevention)
    const { data: existingEmail } = await supabase
      .from('pre_signups')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingEmail) {
      console.log(`Duplicate email attempt: ${email}`);
      // Return success to not reveal if email exists (security best practice)
      return new Response(
        JSON.stringify({ success: true, message: 'Se este email não estava cadastrado, você receberá nossas comunicações.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert the pre-signup
    const { error: insertError } = await supabase
      .from('pre_signups')
      .insert({
        email: email.toLowerCase().trim(),
        source_page: source_page || 'landing',
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        return new Response(
          JSON.stringify({ success: true, message: 'Se este email não estava cadastrado, você receberá nossas comunicações.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw insertError;
    }

    console.log(`Pre-signup successful for: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Cadastro realizado com sucesso!' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pre-signup error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno. Tente novamente mais tarde.', code: 'INTERNAL_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
