import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const WHATSAPP_VERIFY_TOKEN = Deno.env.get('WHATSAPP_VERIFY_TOKEN');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Webhook verification (GET request from Meta)
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe' && token === WHATSAPP_VERIFY_TOKEN) {
        console.log('Webhook verified successfully');
        return new Response(challenge, { status: 200 });
      } else {
        console.error('Webhook verification failed');
        return new Response('Forbidden', { status: 403 });
      }
    }

    // Handle incoming messages (POST request)
    const body = await req.json();
    console.log('Received WhatsApp webhook:', JSON.stringify(body, null, 2));

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messages = value?.messages;

    if (!messages || messages.length === 0) {
      console.log('No messages in webhook');
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const message = messages[0];
    const from = message.from; // Phone number
    const messageType = message.type;
    const messageId = message.id;

    console.log(`Processing message from ${from}, type: ${messageType}`);

    // Find or create session for this phone number
    const { data: existingSession } = await supabase
      .from('whatsapp_sessions')
      .select('*')
      .eq('phone_number', from)
      .single();

    let session = existingSession;

    if (!session) {
      // Try to find user by phone number in profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', from)
        .single();

      if (profile) {
        const { data: newSession } = await supabase
          .from('whatsapp_sessions')
          .insert({
            profile_id: profile.id,
            phone_number: from,
            state: 'idle',
            context: {}
          })
          .select()
          .single();
        
        session = newSession;
      } else {
        // User not found, send onboarding message
        await supabase.functions.invoke('whatsapp-commands', {
          body: {
            to: from,
            command: 'onboarding',
            context: {}
          }
        });
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Update last message timestamp
    await supabase
      .from('whatsapp_sessions')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', session.id);

    // Route message based on type
    if (messageType === 'image' || messageType === 'document') {
      // Process receipt
      console.log('Processing receipt image/document');
      await supabase.functions.invoke('process-receipt', {
        body: {
          sessionId: session.id,
          profileId: session.profile_id,
          message: message,
          from: from
        }
      });
    } else if (messageType === 'text') {
      // Process text command
      const text = message.text.body.trim();
      console.log('Processing text command:', text);
      
      await supabase.functions.invoke('whatsapp-commands', {
        body: {
          to: from,
          command: text,
          context: session.context,
          sessionId: session.id,
          profileId: session.profile_id
        }
      });
    } else if (messageType === 'interactive') {
      // Handle button responses
      const buttonId = message.interactive?.button_reply?.id;
      console.log('Processing button response:', buttonId);
      
      await supabase.functions.invoke('whatsapp-commands', {
        body: {
          to: from,
          command: buttonId,
          context: session.context,
          sessionId: session.id,
          profileId: session.profile_id
        }
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in whatsapp-webhook:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});