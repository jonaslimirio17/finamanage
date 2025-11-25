import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { AppMenu } from "@/components/AppMenu";
import { TwoFactorSettings } from "@/components/auth/TwoFactorSettings";
import { Shield } from "lucide-react";

import { Logo } from "@/components/Logo";

const SecuritySettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo onClick={() => navigate("/dashboard")} />
          <AppMenu user={user} />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-3xl font-bold">Configurações de Segurança</h2>
              <p className="text-muted-foreground">
                Gerencie as configurações de segurança da sua conta
              </p>
            </div>
          </div>

          <TwoFactorSettings />

          <Card>
            <CardHeader>
              <CardTitle>Informações da Conta</CardTitle>
              <CardDescription>
                Detalhes básicos da sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">E-mail</span>
                <span className="text-sm text-muted-foreground">{user.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-sm font-medium">ID do Usuário</span>
                <span className="text-sm text-muted-foreground font-mono">{user.id.substring(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-sm font-medium">Conta criada em</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(user.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Voltar para Dashboard
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecuritySettings;
