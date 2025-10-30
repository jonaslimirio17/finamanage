import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VerifyResetTokenBody {
  token: string;
}

const hashToken = async (token: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token }: VerifyResetTokenBody = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ valid: false, reason: "not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const tokenHash = await hashToken(token);

    // Buscar token no banco
    const { data: resetRecord, error } = await supabaseAdmin
      .from("password_resets")
      .select("*")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar token:", error);
      throw error;
    }

    if (!resetRecord) {
      return new Response(
        JSON.stringify({ valid: false, reason: "not_found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se já foi usado
    if (resetRecord.used) {
      return new Response(
        JSON.stringify({ valid: false, reason: "used" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar expiração
    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ valid: false, reason: "expired" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Token válido
    return new Response(
      JSON.stringify({ valid: true, profile_id: resetRecord.profile_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em verify-reset-token:", error);
    return new Response(
      JSON.stringify({ valid: false, reason: "error", message: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
