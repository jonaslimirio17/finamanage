import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting map (em produção, use Redis ou similar)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 5;
const TOKEN_EXPIRY_MINUTES = 60;

interface RequestPasswordResetBody {
  email: string;
}

const checkRateLimit = (key: string): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 3600000 }); // 1 hora
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_HOUR) {
    return false;
  }

  record.count++;
  return true;
};

const generateSecureToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

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
    const { email }: RequestPasswordResetBody = await req.json();

    // Validação básica
    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ status: "ok" }), // Não revelar se email é válido
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const rateLimitKey = `${clientIp}:${email}`;
    
    if (!checkRateLimit(rateLimitKey)) {
      console.log(`Rate limit exceeded for ${rateLimitKey}`);
      return new Response(
        JSON.stringify({ status: "ok" }), // Não revelar rate limit por segurança
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar usuário
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, nome")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle();

    if (profile) {
      // Gerar token
      const rawToken = generateSecureToken();
      const tokenHash = await hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60000).toISOString();

      // Armazenar token no banco
      const { error: insertError } = await supabaseAdmin
        .from("password_resets")
        .insert({
          profile_id: profile.id,
          token_hash: tokenHash,
          expires_at: expiresAt,
          request_ip: clientIp,
          request_user_agent: req.headers.get("user-agent") || "unknown",
        });

      if (insertError) {
        console.error("Erro ao inserir token:", insertError);
        throw insertError;
      }

      // Enviar e-mail
      const frontendUrl = Deno.env.get("VITE_SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "http://localhost:8080";
      const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

      const { error: emailError } = await resend.emails.send({
        from: "FinManage <onboarding@resend.dev>",
        to: [email],
        subject: "FinManage — Redefinição de senha",
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
                <h2 style="color: #333; margin-top: 0;">Olá${profile.nome ? `, ${profile.nome}` : ''}!</h2>
                
                <p>Recebemos uma solicitação para redefinir a senha da sua conta FinManage.</p>
                
                <p>Clique no botão abaixo para criar uma nova senha. <strong>Este link expira em ${TOKEN_EXPIRY_MINUTES} minutos.</strong></p>
                
                <div style="text-align: center; margin: 35px 0;">
                  <a href="${resetLink}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                    Redefinir minha senha
                  </a>
                </div>
                
                <p style="font-size: 14px; color: #666; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                  <strong>Link alternativo:</strong><br>
                  Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                  <a href="${resetLink}" style="color: #667eea; word-break: break-all;">${resetLink}</a>
                </p>
                
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px 16px; margin: 20px 0; border-radius: 4px;">
                  <p style="margin: 0; font-size: 14px; color: #856404;">
                    ⚠️ <strong>Segurança:</strong> Não compartilhe este link com ninguém.
                  </p>
                </div>
                
                <p style="font-size: 14px; color: #666;">
                  Se você <strong>não solicitou</strong> a redefinição, ignore este e-mail. Sua senha permanecerá a mesma.
                </p>
                
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
        console.error("Erro ao enviar e-mail:", emailError);
      } else {
        console.log(`E-mail de recuperação enviado para ${email}`);
      }
    }

    // Sempre retornar 200 para evitar user enumeration
    return new Response(
      JSON.stringify({ status: "ok" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Erro em request-password-reset:", error);
    return new Response(
      JSON.stringify({ status: "ok" }), // Não revelar erros internos
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
