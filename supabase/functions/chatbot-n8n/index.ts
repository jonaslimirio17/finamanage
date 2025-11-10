import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, conversationHistory } = await req.json();

    console.log('Sending message to N8N webhook:', { message, sessionId });

    const N8N_WEBHOOK_URL = "https://linktech.app.n8n.cloud/webhook-test/584300c1-3260-40a1-b39b-bc5685145652";

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        sessionId,
        conversationHistory,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('N8N webhook error:', response.status, await response.text());
      throw new Error("Falha ao processar mensagem");
    }

    const data = await response.json();
    console.log('N8N response:', data);

    return new Response(
      JSON.stringify({ response: data.output || data.response || data.message || "Desculpe, não consegui processar sua mensagem." }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in chatbot-n8n function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Erro ao processar mensagem",
        response: "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente." 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
