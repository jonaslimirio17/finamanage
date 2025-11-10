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

  const WHATSAPP_ACCESS_TOKEN = Deno.env.get('WHATSAPP_ACCESS_TOKEN');
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { sessionId, profileId, message, from } = await req.json();
    console.log('Processing receipt for session:', sessionId);

    // Download the media file from WhatsApp
    let mediaUrl = '';
    let mediaId = '';
    
    if (message.type === 'image') {
      mediaId = message.image.id;
    } else if (message.type === 'document') {
      mediaId = message.document.id;
    }

    // Get media URL from WhatsApp
    const mediaInfoResponse = await fetch(`https://graph.facebook.com/v17.0/${mediaId}`, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
      }
    });
    const mediaInfo = await mediaInfoResponse.json();
    mediaUrl = mediaInfo.url;

    // Download the file
    const fileResponse = await fetch(mediaUrl, {
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`
      }
    });
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileBase64 = btoa(String.fromCharCode(...new Uint8Array(fileBuffer)));

    // Save to storage
    const fileName = `receipts/${profileId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('educational-files')
      .upload(fileName, fileBuffer, {
        contentType: message.type === 'image' ? 'image/jpeg' : 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw uploadError;
    }

    console.log('File uploaded successfully:', fileName);

    // Use Lovable AI to extract data from receipt
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
            role: 'system',
            content: `Você é um assistente especializado em extrair dados de comprovantes bancários brasileiros. 
            Retorne APENAS um objeto JSON válido com os seguintes campos:
            - amount: valor numérico (ex: 150.50)
            - date: data no formato YYYY-MM-DD
            - merchant: nome do estabelecimento
            - type: "income" ou "expense"
            - category: categoria sugerida (ex: "Alimentação", "Transporte", "Saúde")
            - confidence: número de 0 a 1 indicando confiança na extração`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extraia os dados deste comprovante bancário:'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${fileBase64}`
                }
              }
            ]
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    interface ExtractedData {
      amount?: number;
      date?: string;
      merchant?: string;
      category?: string;
      type?: 'income' | 'expense';
      confidence?: number;
      error?: string;
    }

    let extractedData: ExtractedData = {};
    try {
      const content = aiData.choices[0].message.content;
      // Remove markdown code blocks if present
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      extractedData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      extractedData = { error: 'Failed to parse receipt data' };
    }

    // Save to receipt_uploads table
    const { data: receipt } = await supabase
      .from('receipt_uploads')
      .insert({
        profile_id: profileId,
        file_path: fileName,
        extracted_data: extractedData,
        status: 'pending_confirmation'
      })
      .select()
      .single();

    console.log('Receipt saved to database:', receipt?.id);

    // Update session state
    await supabase
      .from('whatsapp_sessions')
      .update({
        state: 'awaiting_confirmation',
        context: {
          receiptId: receipt?.id,
          extractedData: extractedData
        }
      })
      .eq('id', sessionId);

    // Send confirmation message with buttons
    const confirmationMessage = {
      messaging_product: 'whatsapp',
      to: from,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: {
          text: `📄 *Comprovante Recebido!*\n\n` +
                `💰 Valor: R$ ${extractedData.amount || 'N/D'}\n` +
                `📅 Data: ${extractedData.date || 'N/D'}\n` +
                `🏪 Local: ${extractedData.merchant || 'N/D'}\n` +
                `📊 Categoria: ${extractedData.category || 'N/D'}\n` +
                `📍 Tipo: ${extractedData.type === 'expense' ? 'Despesa' : 'Receita'}\n\n` +
                `Os dados estão corretos?`
        },
        action: {
          buttons: [
            {
              type: 'reply',
              reply: {
                id: 'confirm_receipt',
                title: '✅ Confirmar'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'edit_receipt',
                title: '✏️ Editar'
              }
            },
            {
              type: 'reply',
              reply: {
                id: 'cancel_receipt',
                title: '❌ Cancelar'
              }
            }
          ]
        }
      }
    };

    await fetch(`https://graph.facebook.com/v17.0/${Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(confirmationMessage)
    });

    return new Response(JSON.stringify({ success: true, receipt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in process-receipt:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});