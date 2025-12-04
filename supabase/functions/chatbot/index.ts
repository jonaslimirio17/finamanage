import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // 20 requests per minute per IP
const GLOBAL_RATE_LIMIT = 100; // 100 requests per minute globally
let globalRequestCount = 0;
let globalResetTime = Date.now() + RATE_LIMIT_WINDOW_MS;

// Get client IP from request headers
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         req.headers.get('cf-connecting-ip') ||
         'unknown';
}

// Check if request should be rate limited
function isRateLimited(ip: string): { limited: boolean; retryAfter?: number } {
  const now = Date.now();
  
  // Reset global counter if window expired
  if (now > globalResetTime) {
    globalRequestCount = 0;
    globalResetTime = now + RATE_LIMIT_WINDOW_MS;
  }
  
  // Check global rate limit
  if (globalRequestCount >= GLOBAL_RATE_LIMIT) {
    const retryAfter = Math.ceil((globalResetTime - now) / 1000);
    return { limited: true, retryAfter };
  }
  
  // Check IP-based rate limit
  const ipData = rateLimitMap.get(ip);
  
  if (!ipData || now > ipData.resetTime) {
    // New window for this IP
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    globalRequestCount++;
    return { limited: false };
  }
  
  if (ipData.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((ipData.resetTime - now) / 1000);
    return { limited: true, retryAfter };
  }
  
  // Increment counters
  ipData.count++;
  globalRequestCount++;
  return { limited: false };
}

// Clean up old entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap.entries()) {
    if (now > data.resetTime + RATE_LIMIT_WINDOW_MS) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

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

  // Apply rate limiting
  const clientIP = getClientIP(req);
  const rateLimitResult = isRateLimited(clientIP);
  
  if (rateLimitResult.limited) {
    console.log(`Rate limited IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ 
        error: "Muitas requisições. Por favor, aguarde um momento.",
        response: "Você está enviando mensagens muito rápido. Por favor, aguarde um momento antes de tentar novamente.",
        retryAfter: rateLimitResult.retryAfter
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimitResult.retryAfter || 60)
        },
        status: 429 
      }
    );
  }

  try {
    const { message, sessionId, conversationHistory } = await req.json();
    
    // Validate input
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ response: "Mensagem inválida." }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
    // Limit message length to prevent abuse
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ response: "Mensagem muito longa. Por favor, envie uma mensagem menor." }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }
    
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

    console.log('Processing chatbot message:', { messageLength: message.length, sessionId, ip: clientIP });

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

    // Add conversation history if available (limit to last 10 messages)
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory.slice(-10)) {
        if (msg.role && msg.content) {
          messages.push({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: String(msg.content).slice(0, 2000) // Truncate history messages too
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
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ 
            response: "O serviço está muito ocupado no momento. Por favor, tente novamente em alguns instantes." 
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }
      
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
