import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const passwordSchema = z.object({
  password: z.string().min(8, { message: "A senha deve ter pelo menos 8 caracteres" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [validationError, setValidationError] = useState("");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [logoutAll, setLogoutAll] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setValidationError("Token não encontrado");
      setIsVerifying(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-reset-token", {
        body: { token },
      });

      if (error) throw error;

      if (data.valid) {
        setIsValid(true);
      } else {
        setValidationError(
          data.reason === "expired" 
            ? "Link expirado. Solicite um novo link de redefinição."
            : data.reason === "used"
            ? "Este link já foi usado. Solicite um novo link."
            : "Link inválido. Solicite um novo link de redefinição."
        );
      }
    } catch (error: any) {
      console.error("Erro ao verificar token:", error);
      setValidationError("Erro ao verificar o link. Tente novamente.");
    } finally {
      setIsVerifying(false);
    }
  };

  const getPasswordStrength = (pwd: string) => {
    if (pwd.length < 8) return { label: "Fraca", color: "text-destructive" };
    if (pwd.length < 12) return { label: "Média", color: "text-yellow-500" };
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { label: "Forte", color: "text-green-500" };
    }
    return { label: "Média", color: "text-yellow-500" };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = passwordSchema.safeParse({ password, confirmPassword });
    if (!validation.success) {
      toast({
        title: "Erro de validação",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.functions.invoke("reset-password", {
        body: {
          token,
          new_password: password,
          logout_all: logoutAll,
        },
      });

      if (error) throw error;

      setSuccess(true);
      toast({
        title: "Senha redefinida",
        description: "Sua senha foi redefinida com sucesso!",
      });
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao redefinir sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando link...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Link inválido</CardTitle>
            </div>
            <CardDescription>{validationError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/forgot-password")}
            >
              Solicitar novo link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2 text-green-500">
              <CheckCircle2 className="h-5 w-5" />
              <CardTitle>Senha redefinida com sucesso</CardTitle>
            </div>
            <CardDescription>
              Sua senha foi atualizada. Agora você pode fazer login com a nova senha.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const strength = password ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Redefinir senha</CardTitle>
          <CardDescription>
            Crie uma nova senha para sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Mínimo 8 caracteres"
              />
              {strength && (
                <p className={`text-sm ${strength.color}`}>
                  Força: {strength.label}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Digite a senha novamente"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="logoutAll"
                checked={logoutAll}
                onCheckedChange={(checked) => setLogoutAll(checked as boolean)}
                disabled={isLoading}
              />
              <Label
                htmlFor="logoutAll"
                className="text-sm font-normal cursor-pointer"
              >
                Deslogar todos os dispositivos
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redefinindo...
                </>
              ) : (
                "Redefinir senha"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
