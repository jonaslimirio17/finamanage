import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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