import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, ArrowLeft } from "lucide-react";

interface TwoFactorVerificationProps {
  factorId: string;
  onVerified: () => void;
  onBack: () => void;
}

export function TwoFactorVerification({ factorId, onVerified, onBack }: TwoFactorVerificationProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Create a challenge
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      if (challengeData) {
        // Verify the code
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: challengeData.id,
          code,
        });

        if (verifyError) throw verifyError;

        toast({
          title: "Verificação bem-sucedida!",
          description: "Você será redirecionado em instantes...",
        });

        onVerified();
      }
    } catch (error: any) {
      toast({
        title: "Código inválido",
        description: "Por favor, verifique o código e tente novamente.",
        variant: "destructive",
      });
      setCode("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Verificação de Dois Fatores
        </CardTitle>
        <CardDescription>
          Digite o código de 6 dígitos do seu app autenticador
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">Código de Verificação</Label>
            <Input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono"
              autoFocus
              required
            />
          </div>

          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={loading || code.length !== 6}
              className="flex-1"
            >
              {loading ? "Verificando..." : "Verificar"}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Não consegue acessar seu app autenticador? Entre em contato com o suporte.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
