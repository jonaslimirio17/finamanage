import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, Key, Copy, Check } from "lucide-react";
import QRCode from "qrcode";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TwoFactorSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function TwoFactorSetup({ onComplete, onCancel }: TwoFactorSetupProps) {
  const [step, setStep] = useState<'intro' | 'qr' | 'verify'>('intro');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [factorId, setFactorId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
      });

      if (error) throw error;

      if (data) {
        setFactorId(data.id);
        setSecret(data.totp.secret);
        
        // Generate QR code
        const qrCode = await QRCode.toDataURL(data.totp.uri);
        setQrCodeUrl(qrCode);
        
        setStep('qr');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao configurar 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    toast({
      title: "Código copiado!",
      description: "O código secreto foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.challenge({ 
        factorId 
      });

      if (error) throw error;

      if (data) {
        const { error: verifyError } = await supabase.auth.mfa.verify({
          factorId,
          challengeId: data.id,
          code: verificationCode,
        });

        if (verifyError) throw verifyError;

        toast({
          title: "2FA ativado com sucesso!",
          description: "Sua conta agora está protegida com autenticação de dois fatores.",
        });

        onComplete();
      }
    } catch (error: any) {
      toast({
        title: "Erro na verificação",
        description: error.message || "Código incorreto. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (step === 'intro') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Configurar Autenticação de Dois Fatores
          </CardTitle>
          <CardDescription>
            Adicione uma camada extra de segurança à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              A autenticação de dois fatores (2FA) adiciona uma camada extra de segurança
              exigindo um código adicional ao fazer login.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">App Autenticador</h4>
                <p className="text-sm text-muted-foreground">
                  Você precisará de um app autenticador como Google Authenticator, 
                  Microsoft Authenticator ou Authy.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">Maior Segurança</h4>
                <p className="text-sm text-muted-foreground">
                  Mesmo que alguém descubra sua senha, não conseguirá acessar
                  sua conta sem o código do seu dispositivo.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleStartSetup} disabled={loading} className="flex-1">
              {loading ? "Configurando..." : "Começar Configuração"}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'qr') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Escaneie o QR Code</CardTitle>
          <CardDescription>
            Use seu app autenticador para escanear o código abaixo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code para 2FA" 
                className="border rounded-lg p-4 bg-white"
              />
            )}
            
            <div className="w-full space-y-2">
              <Label>Ou digite o código manualmente:</Label>
              <div className="flex gap-2">
                <Input
                  value={secret}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Importante:</strong> Salve este código em um local seguro.
              Você precisará dele se perder acesso ao seu app autenticador.
            </AlertDescription>
          </Alert>

          <div className="flex gap-3">
            <Button onClick={() => setStep('verify')} className="flex-1">
              Próximo: Verificar
            </Button>
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Verificar Configuração</CardTitle>
          <CardDescription>
            Digite o código de 6 dígitos do seu app autenticador
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="verification-code">Código de Verificação</Label>
            <Input
              id="verification-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              className="text-center text-2xl tracking-widest font-mono"
            />
          </div>

          <div className="flex gap-3">
            <Button 
              onClick={handleVerify} 
              disabled={loading || verificationCode.length !== 6}
              className="flex-1"
            >
              {loading ? "Verificando..." : "Verificar e Ativar"}
            </Button>
            <Button variant="outline" onClick={() => setStep('qr')}>
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
