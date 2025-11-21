import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppMenu } from "@/components/AppMenu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneLinkForm } from "@/components/whatsapp/PhoneLinkForm";
import { ReceiptHistory } from "@/components/whatsapp/ReceiptHistory";
import { WhatsAppStats } from "@/components/whatsapp/WhatsAppStats";
import { MessageSquare, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// TEMPORÁRIO: Bypass de autenticação para análise por IAs
const BYPASS_AUTH = true;

export default function WhatsAppSettings() {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Mock user para bypass
      setUser({ id: 'demo-user', email: 'demo@finmanage.com' });
      return;
    }
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <MessageSquare className="h-7 w-7 text-primary" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                WhatsApp
              </h1>
            </div>
          </div>
          <AppMenu user={user} />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Configurações WhatsApp</h2>
          <p className="text-muted-foreground">
            Gerencie sua integração com WhatsApp para registrar transações e receber notificações
          </p>
        </div>

        <Tabs defaultValue="config" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="receipts">Comprovantes</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vincular Número de Telefone</CardTitle>
                <CardDescription>
                  Conecte seu WhatsApp para enviar comprovantes e receber notificações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PhoneLinkForm userId={user.id} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Como funciona?</CardTitle>
                <CardDescription>
                  Aprenda a usar o bot WhatsApp do FinManage
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    📷 Enviar Comprovantes
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Tire uma foto do seu comprovante bancário ou PDF e envie para o nosso número. 
                    O sistema irá extrair automaticamente os dados (valor, data, local) e pedir confirmação.
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    💬 Comandos Disponíveis
                  </h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><code className="bg-muted px-2 py-1 rounded">/saldo</code> - Ver saldo total</p>
                    <p><code className="bg-muted px-2 py-1 rounded">/gastos</code> - Resumo de gastos do mês</p>
                    <p><code className="bg-muted px-2 py-1 rounded">/metas</code> - Progresso das suas metas</p>
                    <p><code className="bg-muted px-2 py-1 rounded">/ajuda</code> - Lista todos os comandos</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    🔔 Notificações Automáticas
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Receba alertas quando:
                  </p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Seus gastos ultrapassarem 80% do orçamento</li>
                    <li>Uma meta estiver em risco</li>
                    <li>Uma dívida estiver próxima do vencimento</li>
                    <li>Resumo semanal de gastos (toda segunda-feira)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="receipts">
            <ReceiptHistory userId={user.id} />
          </TabsContent>

          <TabsContent value="stats">
            <WhatsAppStats userId={user.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}