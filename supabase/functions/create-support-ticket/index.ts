import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, email, subject, category, priority, description, attachments, profile_id } = await req.json();

    // Validate required fields
    if (!name || !email || !subject || !category || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate description length
    if (description.length < 20) {
      return new Response(
        JSON.stringify({ error: 'Descrição deve ter pelo menos 20 caracteres' }),
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

    console.log('Support ticket created:', ticket.id);

    return new Response(
      JSON.stringify({ 
        success: true,
        ticket_id: ticket.id,
        ticket_number: ticket.id.split('-')[0].toUpperCase()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});