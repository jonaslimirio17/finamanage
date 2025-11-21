import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { password } = await req.json();

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Password is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create SHA-1 hash of the password
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();

    // Use k-Anonymity: send only first 5 chars of hash to API
    const prefix = hashHex.substring(0, 5);
    const suffix = hashHex.substring(5);

    // Query HaveIBeenPwned API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'Add-Padding': 'true', // Security best practice
      },
    });

    if (!response.ok) {
      throw new Error('Failed to check password against breach database');
    }

    const data = await response.text();
    const hashes = data.split('\n');

    // Check if our password hash suffix exists in the results
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      if (hashSuffix === suffix) {
        return new Response(
          JSON.stringify({ 
            leaked: true, 
            count: parseInt(count.trim()),
            message: `Esta senha foi encontrada em ${parseInt(count.trim())} vazamentos de dados. Por favor, escolha uma senha mais segura.`
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Password not found in breaches
    return new Response(
      JSON.stringify({ leaked: false }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error checking password:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
