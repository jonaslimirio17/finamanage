import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { User, Bell, Palette, Shield, CreditCard, MessageSquare, Download, Trash2, Save, Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppMenu } from "@/components/AppMenu";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DeleteAccountDialog } from "@/components/dashboard/DeleteAccountDialog";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profile state
  const [nome, setNome] = useState("");
  const [phone, setPhone] = useState("");
  const [estimatedIncome, setEstimatedIncome] = useState("");
  
  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }
      
      setUser(user);
      
      // Load profile data
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      
      if (profile) {
        setNome(profile.nome || "");
        setPhone(profile.phone || "");
        setEstimatedIncome(profile.estimated_income?.toString() || "");
        setEmailNotifications(profile.email_notifications ?? true);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [navigate]);

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from("profiles")
      .update({
        nome,
        phone,
        estimated_income: estimatedIncome ? parseFloat(estimatedIncome) : 0,
        email_notifications: emailNotifications,
      })
      .eq("id", user.id);
    
    setSaving(false);
    
    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas com sucesso.",
      });
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    
    toast({
      title: "Exportando dados...",
      description: "Preparando seus dados para download.",
    });
    
    // Fetch all user data
    const [transactionsRes, goalsRes, debtsRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("profile_id", user.id),
      supabase.from("goals").select("*").eq("profile_id", user.id),
      supabase.from("debts").select("*").eq("profile_id", user.id),
    ]);
    
    const exportData = {
      exportedAt: new Date().toISOString(),
      transactions: transactionsRes.data || [],
      goals: goalsRes.data || [],
      debts: debtsRes.data || [],
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finamanage-dados-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Dados exportados",
      description: "Seus dados foram baixados com sucesso.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configurações | FinaManage</title>
        <meta name="description" content="Gerencie suas configurações e preferências do FinaManage." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Logo className="h-8 cursor-pointer" onClick={() => navigate("/")} />
            <AppMenu user={user} />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
            <p className="text-muted-foreground mt-2">
              Gerencie suas preferências e configurações da conta.
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
              <TabsTrigger value="profile" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Aparência</span>
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Dados</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <CardTitle>Informações do Perfil</CardTitle>
                  <CardDescription>
                    Atualize suas informações pessoais.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={user?.email || ""}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      O email não pode ser alterado.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      placeholder="Seu nome completo"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usado para notificações via WhatsApp.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="income">Renda Estimada Mensal</Label>
                    <Input
                      id="income"
                      type="number"
                      value={estimatedIncome}
                      onChange={(e) => setEstimatedIncome(e.target.value)}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Usado para cálculos de planejamento financeiro.
                    </p>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Alterações"}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Links */}
              <div className="grid gap-4 mt-6 sm:grid-cols-2">
                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate("/security")}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Segurança</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerenciar senha e 2FA
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate("/subscription")}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <CreditCard className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">Assinatura</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerenciar plano e pagamentos
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => navigate("/whatsapp")}
                >
                  <CardContent className="flex items-center gap-4 p-6">
                    <MessageSquare className="h-8 w-8 text-primary" />
                    <div>
                      <h3 className="font-semibold">WhatsApp Bot</h3>
                      <p className="text-sm text-muted-foreground">
                        Configurar integração
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificações</CardTitle>
                  <CardDescription>
                    Configure como e quando você deseja ser notificado.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba resumos e alertas importantes por email.
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Tipos de Notificações</h4>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Alertas de Vencimento</Label>
                        <p className="text-sm text-muted-foreground">
                          Notificações sobre dívidas próximas do vencimento.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Progresso de Metas</Label>
                        <p className="text-sm text-muted-foreground">
                          Atualizações sobre o progresso das suas metas.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Resumo Semanal</Label>
                        <p className="text-sm text-muted-foreground">
                          Relatório semanal das suas finanças.
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Salvando..." : "Salvar Preferências"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <Card>
                <CardHeader>
                  <CardTitle>Aparência</CardTitle>
                  <CardDescription>
                    Personalize a aparência do aplicativo.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Tema</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <Button
                        variant={theme === "light" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("light")}
                      >
                        <Sun className="h-6 w-6" />
                        <span>Claro</span>
                      </Button>
                      <Button
                        variant={theme === "dark" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("dark")}
                      >
                        <Moon className="h-6 w-6" />
                        <span>Escuro</span>
                      </Button>
                      <Button
                        variant={theme === "system" ? "default" : "outline"}
                        className="flex flex-col items-center gap-2 h-auto py-4"
                        onClick={() => setTheme("system")}
                      >
                        <Monitor className="h-6 w-6" />
                        <span>Sistema</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Data Tab */}
            <TabsContent value="data">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Exportar Dados</CardTitle>
                    <CardDescription>
                      Baixe uma cópia de todos os seus dados.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Você pode exportar todas as suas transações, metas e dívidas em formato JSON.
                    </p>
                    <Button variant="outline" onClick={handleExportData}>
                      <Download className="h-4 w-4 mr-2" />
                      Exportar Meus Dados
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>
                      Ações irreversíveis para sua conta.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      Ao excluir sua conta, todos os seus dados serão permanentemente removidos.
                      Esta ação não pode ser desfeita.
                    </p>
                    <DeleteAccountDialog />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
};

export default Settings;