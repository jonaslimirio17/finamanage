import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }),
});

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação
    const validation = emailSchema.safeParse({ email });
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
      const { error } = await supabase.functions.invoke("request-password-reset", {
        body: { email: validation.data.email },
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Link enviado",
        description: "Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha.",
      });
    } catch (error: any) {
      console.error("Erro ao solicitar recuperação:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-secondary/20">
      <Card className="w-full max-w-md">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            className="w-fit -ml-2 mb-2"
            onClick={() => navigate("/auth")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <CardTitle className="text-2xl">Recuperar senha</CardTitle>
          <CardDescription>
            Esqueceu sua senha? Informe o e-mail usado no cadastro que enviaremos um link para redefinição.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar link de redefinição"
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Se existir uma conta com esse e-mail, você receberá um link para redefinir a senha. 
                  Verifique sua caixa de spam se não encontrar o e-mail.
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Voltar para o login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
