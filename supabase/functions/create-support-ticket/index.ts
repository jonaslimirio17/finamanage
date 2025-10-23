import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting map: IP -> { count, timestamp }
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_WINDOW = 5;

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now - data.timestamp > RATE_LIMIT_WINDOW) {
      rateLimitMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);

// Simple spam detection patterns
const SPAM_PATTERNS = [
  /(.)\1{10,}/i, // Repeated characters
  /https?:\/\//gi, // Multiple URLs
  /\b(viagra|casino|bitcoin|crypto)\b/gi, // Common spam keywords
];

function isSpam(text: string): boolean {
  return SPAM_PATTERNS.some(pattern => {
    const matches = text.match(pattern);
    return matches && matches.length > 3;
  });
}

function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0] || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

// Validation schema
const ticketSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string().email('Email inválido').max(255, 'Email deve ter no máximo 255 caracteres'),
  subject: z.string().min(1, 'Assunto é obrigatório').max(200, 'Assunto deve ter no máximo 200 caracteres'),
  category: z.string().min(1, 'Categoria é obrigatória'),
  priority: z.string().optional(),
  description: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres').max(5000, 'Descrição deve ter no máximo 5000 caracteres'),
  attachments: z.array(z.any()).optional(),
  profile_id: z.string().uuid().optional().nullable()
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    const now = Date.now();
    
    // Check rate limit
    const rateLimitData = rateLimitMap.get(clientIP);
    if (rateLimitData) {
      if (now - rateLimitData.timestamp < RATE_LIMIT_WINDOW) {
        if (rateLimitData.count >= MAX_REQUESTS_PER_WINDOW) {
          console.log(`Rate limit exceeded for IP: ${clientIP}`);
          return new Response(
            JSON.stringify({ 
              error: 'Rate limit exceeded. Please try again later.',
              retry_after: Math.ceil((rateLimitData.timestamp + RATE_LIMIT_WINDOW - now) / 1000 / 60)
            }),
            { 
              status: 429, 
              headers: { 
                ...corsHeaders, 
                'Content-Type': 'application/json',
                'Retry-After': String(Math.ceil((rateLimitData.timestamp + RATE_LIMIT_WINDOW - now) / 1000))
              } 
            }
          );
        }
        rateLimitData.count++;
      } else {
        // Reset window
        rateLimitData.count = 1;
        rateLimitData.timestamp = now;
      }
    } else {
      rateLimitMap.set(clientIP, { count: 1, timestamp: now });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();

    // Validate input using zod schema
    const validation = ticketSchema.safeParse(body);
    
    if (!validation.success) {
      const errors = validation.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return new Response(
        JSON.stringify({ error: 'Validation failed', details: errors }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, subject, category, priority, description, attachments, profile_id } = validation.data;

    // Check for spam patterns
    const fullText = `${name} ${email} ${subject} ${description}`;
    if (isSpam(fullText)) {
      console.log(`Spam detected from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ error: 'Your request could not be processed. Please contact support directly.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create support ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert({
        profile_id: profile_id || null,
        name,
        email,
        subject,
        category,
        priority: priority || 'Normal',
        description,
        attachments: attachments || [],
        status: 'open'
      })
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Log event
    await supabase.from('events_logs').insert({
      profile_id: profile_id || null,
      event_type: 'support_ticket_created',
      payload: {
        ticket_id: ticket.id,
        category,
        priority: priority || 'Normal'
      }
    });

    console.log('Support ticket created');

    return new Response(
      JSON.stringify({ 
        success: true,
        ticket_id: ticket.id,
        ticket_number: ticket.id.split('-')[0].toUpperCase()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating support ticket');
    return new Response(
      JSON.stringify({ error: 'Failed to create support ticket' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});