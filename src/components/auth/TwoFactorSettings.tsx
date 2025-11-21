import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, ShieldCheck, ShieldOff, Smartphone } from "lucide-react";
import { TwoFactorSetup } from "./TwoFactorSetup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export function TwoFactorSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      if (data) {
        const totpFactors = data.totp || [];
        setFactors(totpFactors);
        setIsEnabled(totpFactors.some((f: any) => f.status === 'verified'));
      }
    } catch (error: any) {
      console.error('Error checking MFA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      // Find the verified factor
      const verifiedFactor = factors.find((f: any) => f.status === 'verified');
      
      if (!verifiedFactor) {
        throw new Error('Nenhum fator verificado encontrado');
      }

      const { error } = await supabase.auth.mfa.unenroll({
        factorId: verifiedFactor.id,
      });

      if (error) throw error;

      toast({
        title: "2FA desativado",
        description: "A autenticação de dois fatores foi desativada com sucesso.",
      });

      await checkMFAStatus();
    } catch (error: any) {
      toast({
        title: "Erro ao desativar 2FA",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = async () => {
    setShowSetup(false);
    await checkMFAStatus();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        onComplete={handleSetupComplete}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Autenticação de Dois Fatores (2FA)
        </CardTitle>
        <CardDescription>
          Adicione uma camada extra de segurança à sua conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">Status do 2FA</h4>
              {isEnabled ? (
                <Badge variant="default" className="gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  Ativado
                </Badge>
              ) : (
                <Badge variant="secondary" className="gap-1">
                  <ShieldOff className="h-3 w-3" />
                  Desativado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {isEnabled
                ? "Sua conta está protegida com autenticação de dois fatores."
                : "Proteja sua conta ativando a autenticação de dois fatores."}
            </p>
          </div>
        </div>

        {isEnabled && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Smartphone className="h-4 w-4 text-primary" />
              <span className="font-medium">App Autenticador Configurado</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Você precisará do código do seu app autenticador ao fazer login.
            </p>
          </div>
        )}

        <div className="flex gap-3">
          {isEnabled ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Desativar 2FA
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Desativar Autenticação de Dois Fatores?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Isso tornará sua conta menos segura. Você não precisará mais do código
                    do app autenticador para fazer login.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisable} className="bg-destructive hover:bg-destructive/90">
                    Desativar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button onClick={() => setShowSetup(true)}>
              <ShieldCheck className="h-4 w-4 mr-2" />
              Ativar 2FA
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
