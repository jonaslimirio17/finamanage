import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordBody {
  token: string;
  new_password: string;
  logout_all: boolean;
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
    const { token, new_password, logout_all }: ResetPasswordBody = await req.json();

    // Validações básicas
    if (!token || !new_password) {
      return new Response(
        JSON.stringify({ error: "Token e nova senha são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const tokenHash = await hashToken(token);
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";

    // Buscar e validar token
    const { data: resetRecord, error: fetchError } = await supabaseAdmin
      .from("password_resets")
      .select("*, profiles(id, email, nome)")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (fetchError) {
      console.error("Erro ao buscar token:", fetchError);
      throw fetchError;
    }

    if (!resetRecord) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (resetRecord.used) {
      return new Response(
        JSON.stringify({ error: "Este token já foi usado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const now = new Date();
    const expiresAt = new Date(resetRecord.expires_at);
    
    if (now > expiresAt) {
      return new Response(
        JSON.stringify({ error: "Token expirado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Buscar user_id do auth.users
    const { data: authUser } = await supabaseAdmin.auth.admin.listUsers();
    const user = authUser.users.find(u => u.email === resetRecord.profiles?.email);

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Usuário não encontrado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Atualizar senha
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      console.error("Erro ao atualizar senha:", updateError);
      throw updateError;
    }

    // Marcar token como usado
    const { error: markUsedError } = await supabaseAdmin
      .from("password_resets")
      .update({
        used: true,
        used_at: new Date().toISOString(),
        used_ip: clientIp,
        used_user_agent: userAgent,
      })
      .eq("id", resetRecord.id);

    if (markUsedError) {
      console.error("Erro ao marcar token como usado:", markUsedError);
    }

    // Invalidar sessões se solicitado
    if (logout_all) {
      await supabaseAdmin.auth.admin.signOut(user.id, 'global');
    }

    // Enviar e-mail de confirmação
    if (resetRecord.profiles?.email) {
      const { error: emailError } = await resend.emails.send({
        from: "FinManage <onboarding@resend.dev>",
        to: [resetRecord.profiles.email],
        subject: "FinManage — Senha alterada com sucesso",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 28px;">FinManage</h1>
              </div>
              
              <div style="background: #ffffff; padding: 40px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #333; margin-top: 0;">Senha alterada com sucesso</h2>
                
                <p>Olá${resetRecord.profiles?.nome ? `, ${resetRecord.profiles.nome}` : ''}!</p>
                
                <p>Sua senha foi alterada com sucesso em <strong>${now.toLocaleString('pt-BR')}</strong>.</p>
                
                <div style="background: #d4edda; border-left: 4px solid #28a745; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #155724;">
                    ✓ Sua conta está segura e protegida.
                  </p>
                </div>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    ⚠️ <strong>Se você não solicitou esta alteração:</strong><br>
                    Entre em contato conosco imediatamente. Sua conta pode estar comprometida.
                  </p>
                </div>
                
                <p style="margin-top: 30px; font-size: 14px; color: #999;">
                  Atenciosamente,<br>
                  <strong>Equipe FinManage</strong>
                </p>
              </div>
              
              <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
                <p>© ${new Date().getFullYear()} FinManage. Todos os direitos reservados.</p>
              </div>
            </body>
          </html>
        `,
      });

      if (emailError) {
        console.error("Erro ao enviar e-mail de confirmação:", emailError);
      }
    }

    console.log(`Senha redefinida com sucesso para profile_id: ${resetRecord.profile_id}`);

    return new Response(
      JSON.stringify({ status: "ok", message: "Senha redefinida com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em reset-password:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno ao redefinir senha" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
