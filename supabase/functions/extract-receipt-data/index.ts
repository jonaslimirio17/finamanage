import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-token',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify webhook token for security
    const webhookToken = req.headers.get('x-webhook-token');
    const expectedToken = Deno.env.get('N8N_WEBHOOK_TOKEN');
    
    if (expectedToken && webhookToken !== expectedToken) {
      console.error('Invalid webhook token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing imageBase64 field' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Calling Lovable AI for receipt extraction...');

    // Call Lovable AI with vision model
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia as informações do recibo e retorne um JSON válido com os campos: date (formato YYYY-MM-DD), merchant (nome do estabelecimento), amount (valor total em formato numérico), type ("expense" ou "income"), category (categoria geral como Alimentação, Transporte, etc), raw_description (descrição completa do recibo). Se não conseguir identificar algum campo, use null. Retorne APENAS o JSON, sem texto adicional.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_receipt',
              description: 'Extract structured data from receipt image',
              parameters: {
                type: 'object',
                properties: {
                  date: { type: 'string', description: 'Date in YYYY-MM-DD format' },
                  merchant: { type: 'string', description: 'Name of the merchant/store' },
                  amount: { type: 'number', description: 'Total amount as number' },
                  type: { type: 'string', enum: ['expense', 'income'], description: 'Transaction type' },
                  category: { type: 'string', description: 'Category like Food, Transport, etc' },
                  raw_description: { type: 'string', description: 'Full description of the receipt' }
                },
                required: ['date', 'amount', 'type'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_receipt' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable AI workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`Lovable AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI Response:', JSON.stringify(aiData, null, 2));

    // Extract structured data from tool call
    let extractedData;
    if (aiData.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments) {
      const argsStr = aiData.choices[0].message.tool_calls[0].function.arguments;
      extractedData = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
    } else {
      // Fallback: try to parse from content
      const content = aiData.choices?.[0]?.message?.content || '{}';
      try {
        extractedData = JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse AI response:', e);
        extractedData = { raw_description: content };
      }
    }

    console.log('Extracted data:', JSON.stringify(extractedData, null, 2));

    return new Response(
      JSON.stringify(extractedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-receipt-data:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});