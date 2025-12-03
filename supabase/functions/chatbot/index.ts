import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Knowledge base for the chatbot
const KNOWLEDGE_BASE = `
Você é o assistente virtual do FinaManage, uma plataforma de gestão financeira inteligente para universitários.

## Sobre o FinaManage
- Plataforma de controle financeiro pessoal
- Voltada para universitários e jovens adultos
- Permite registrar receitas e despesas
- Acompanhar metas financeiras
- Visualizar gráficos e relatórios
- Integração com WhatsApp para envio de comprovantes

## Funcionalidades Principais
1. **Dashboard**: Visão geral das finanças com gráficos de gastos por categoria
2. **Metas**: Criar e acompanhar metas de economia
3. **Importação CSV/OFX**: Importar extratos bancários
4. **WhatsApp Bot**: Enviar comprovantes por WhatsApp para registro automático
5. **Notificações**: Alertas de dívidas, metas em risco, resumos semanais

## Planos
- **Gratuito**: Funcionalidades básicas
- **Premium (R$ 19,90/mês)**: Acesso completo, conteúdo educacional, suporte prioritário

## Como usar
1. Crie uma conta em /auth
2. Configure seu perfil
3. Importe transações via CSV ou registre manualmente
4. Acompanhe seus gastos no Dashboard
5. Defina metas financeiras

## Suporte
- Central de ajuda: /help
- FAQ disponível na página de ajuda
- Suporte humano disponível via formulário

## Dicas de Resposta
- Seja objetivo e claro
- Use tom informal mas profissional
- Limite respostas a 3-4 parágrafos
- Se não souber responder, sugira falar com suporte humano
`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, sessionId, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ response: "Desculpe, o serviço está temporariamente indisponível." }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    console.log('Processing chatbot message:', { message, sessionId });

    // Build messages array for AI
    const messages = [
      {
        role: 'system',
        content: `${KNOWLEDGE_BASE}

Responda às perguntas do usuário com base no conhecimento acima. 
Se a pergunta não estiver relacionada ao FinaManage, responda educadamente que você só pode ajudar com dúvidas sobre a plataforma.
Sempre seja prestativo e sugira o suporte humano se não conseguir resolver a dúvida.`
      }
    ];

    // Add conversation history if available
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) { // Keep last 10 messages for context
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content
          });
        }
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: message
    });

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response received');

    const botResponse = aiData.choices?.[0]?.message?.content || 
      "Desculpe, não consegui processar sua mensagem. Por favor, tente novamente.";

    return new Response(
      JSON.stringify({ response: botResponse }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error in chatbot function:', error);
    return new Response(
      JSON.stringify({ 
        error: "Erro ao processar mensagem",
        response: "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente ou clique em 'Falar com atendente humano'." 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 // Return 200 to avoid breaking the UI
      }
    );
  }
});
