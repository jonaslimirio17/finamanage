import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link2, Upload, PlusCircle } from "lucide-react";

export default function Onboarding() {
  const navigate = useNavigate();
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [addTransactionDialogOpen, setAddTransactionDialogOpen] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [connecting, setConnecting] = useState(false);
  
  // Manual transaction form state
  const [transactionDate, setTransactionDate] = useState("");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionMerchant, setTransactionMerchant] = useState("");
  const [transactionCategory, setTransactionCategory] = useState("");
  const [transactionType, setTransactionType] = useState<"credit" | "debit">("debit");
  const [submitting, setSubmitting] = useState(false);

  const logEvent = async (eventType: string, payload?: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("events_logs").insert({
        profile_id: user.id,
        event_type: eventType,
        payload: payload || {}
      });
    } catch (error) {
      console.error("Error logging event:", error);
    }
  };

  // Setup global callback for aggregator widget
  useEffect(() => {
    // Define the global callback function that the widget will call
    (window as any).onWidgetSuccess = async (data: {
      provider: string;
      provider_account_id: string;
      provider_session_id?: string;
      mask?: string;
      account_type?: string;
    }) => {
      console.log("Widget success callback triggered:", data);
      setConnecting(true);

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Call the webhook endpoint
        const { data: result, error } = await supabase.functions.invoke("account-connected", {
          body: {
            provider: data.provider,
            provider_account_id: data.provider_account_id,
            provider_session_id: data.provider_session_id,
            mask: data.mask,
            account_type: data.account_type || 'checking',
            profile_id: user.id
          }
        });

        if (error) throw error;

        console.log("Account connected successfully:", result);

        toast({
          title: "Conta conectada!",
          description: "Sua conta foi conectada com sucesso via Open Finance."
        });

        // Close modal and reset state
        setConnectModalOpen(false);
        setConsentChecked(false);
        setWidgetLoaded(false);

      } catch (error: any) {
        console.error("Error connecting account:", error);
        toast({
          title: "Erro ao conectar conta",
          description: error.message || "Não foi possível conectar sua conta. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setConnecting(false);
      }
    };

    // Cleanup
    return () => {
      delete (window as any).onWidgetSuccess;
    };
  }, []);

  const handleConnectAccount = async () => {
    if (!consentChecked) {
      toast({
        title: "Consentimento necessário",
        description: "Por favor, aceite os termos antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    await logEvent("connect_account_initiated");
    setWidgetLoaded(true);
    
    toast({
      title: "Carregando widget",
      description: "O widget do Open Finance será carregado em breve."
    });
  };

  const handleImportFile = async () => {
    if (!importFile) {
      toast({
        title: "Arquivo necessário",
        description: "Por favor, selecione um arquivo CSV ou OFX.",
        variant: "destructive"
      });
      return;
    }

    setImporting(true);
    await logEvent("import_statement_initiated", { filename: importFile.name });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const formData = new FormData();
      formData.append("file", importFile);

      const { data, error } = await supabase.functions.invoke("import-csv", {
        body: formData
      });

      if (error) throw error;

      const summary = data?.summary || {};
      
      toast({
        title: "Importação concluída",
        description: `${summary.inserted || 0} transações importadas, ${summary.duplicates || 0} duplicadas, ${summary.failed_rows || 0} com erro.`
      });

      setImportDialogOpen(false);
      setImportFile(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erro na importação",
        description: error.message || "Não foi possível importar o arquivo.",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
    }
  };

  const handleAddTransaction = async () => {
    if (!transactionDate || !transactionAmount || !transactionMerchant) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha data, valor e estabelecimento.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    await logEvent("manual_transaction_initiated");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Get or create a default account for manual entries
      let { data: accounts } = await supabase
        .from("accounts")
        .select("id")
        .eq("profile_id", user.id)
        .eq("provider", "manual")
        .limit(1);

      let accountId: string;

      if (!accounts || accounts.length === 0) {
        // Create a default manual account
        const { data: newAccount, error: accountError } = await supabase
          .from("accounts")
          .insert({
            profile_id: user.id,
            provider: "manual",
            provider_account_id: "manual-default",
            account_type: "manual",
            balance: 0
          })
          .select()
          .single();

        if (accountError) throw accountError;
        accountId = newAccount.id;
      } else {
        accountId = accounts[0].id;
      }

      const { error } = await supabase.from("transactions").insert({
        profile_id: user.id,
        account_id: accountId,
        date: transactionDate,
        amount: parseFloat(transactionAmount),
        merchant: transactionMerchant,
        category: transactionCategory || null,
        type: transactionType,
        currency: "BRL",
        imported_from: "manual"
      });

      if (error) throw error;

      toast({
        title: "Transação adicionada",
        description: "Sua transação foi registrada com sucesso."
      });

      // Reset form
      setTransactionDate("");
      setTransactionAmount("");
      setTransactionMerchant("");
      setTransactionCategory("");
      setTransactionType("debit");
      setAddTransactionDialogOpen(false);
    } catch (error: any) {
      console.error("Add transaction error:", error);
      toast({
        title: "Erro ao adicionar transação",
        description: error.message || "Não foi possível adicionar a transação.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">Conecte suas finanças</h1>
            <p className="text-muted-foreground">
              Escolha como você quer começar a gerenciar suas transações
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Card A - Conectar conta */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Link2 className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Conectar conta</CardTitle>
                <CardDescription>
                  Conecte sua conta bancária via Open Finance para sincronização automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Conectar permite ver seu orçamento automaticamente — você pode revogar a qualquer momento.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => {
                    logEvent("connect_account_clicked");
                    setConnectModalOpen(true);
                  }}
                >
                  Conectar via Open Finance
                </Button>
              </CardContent>
            </Card>

            {/* Card B - Importar extrato */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Upload className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Importar extrato</CardTitle>
                <CardDescription>
                  Importe seus extratos bancários em formato CSV ou OFX
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Carregue seus dados históricos rapidamente através de arquivos de extrato.
                </p>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    logEvent("import_statement_clicked");
                    setImportDialogOpen(true);
                  }}
                >
                  Importar CSV/OFX
                </Button>
              </CardContent>
            </Card>

            {/* Card C - Inserção manual */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <PlusCircle className="w-12 h-12 mb-4 text-primary" />
                <CardTitle>Inserção manual</CardTitle>
                <CardDescription>
                  Adicione transações manualmente quando precisar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Controle total sobre suas entradas, perfeito para gastos em dinheiro.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => {
                    logEvent("manual_transaction_clicked");
                    setAddTransactionDialogOpen(true);
                  }}
                >
                  Adicionar transação
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Ir para o Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Connect Account Modal */}
      <Dialog open={connectModalOpen} onOpenChange={setConnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar conta via Open Finance</DialogTitle>
            <DialogDescription>
              Você será redirecionado para o widget seguro do agregador financeiro.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="consent" 
                checked={consentChecked}
                onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
              />
              <label
                htmlFor="consent"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Autorizo o acesso aos meus dados financeiros conforme a LGPD e regulamentação 
                do Banco Central. Posso revogar este consentimento a qualquer momento.
              </label>
            </div>
            
            {/* Aggregator widget iframe container */}
            {widgetLoaded ? (
              <div className="border rounded-md overflow-hidden min-h-[400px]">
                <iframe
                  id="aggregator-widget"
                  src="about:blank"
                  className="w-full h-[400px] border-0"
                  title="Open Finance Widget"
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
                <div className="p-2 bg-muted text-xs text-muted-foreground text-center">
                  Substitua o src do iframe pelo snippet oficial do agregador quando disponível.
                  <br />
                  O widget chamará window.onWidgetSuccess(data) após sucesso.
                </div>
              </div>
            ) : (
              <div className="border rounded-md p-4 bg-muted min-h-[200px] flex items-center justify-center">
                <p className="text-sm text-muted-foreground text-center">
                  {consentChecked 
                    ? "Clique em 'Continuar' para carregar o widget do agregador" 
                    : "Aceite o consentimento para continuar"}
                </p>
              </div>
            )}
            
            {connecting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                Conectando sua conta...
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConnectModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConnectAccount} disabled={!consentChecked}>
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Statement Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar extrato</DialogTitle>
            <DialogDescription>
              Selecione um arquivo CSV ou OFX com suas transações bancárias.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="file">Arquivo</Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.ofx"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Formatos aceitos: CSV, OFX
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImportFile} disabled={!importFile || importing}>
              {importing ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={addTransactionDialogOpen} onOpenChange={setAddTransactionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar transação</DialogTitle>
            <DialogDescription>
              Preencha os dados da transação manualmente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={transactionAmount}
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="merchant">Estabelecimento</Label>
              <Input
                id="merchant"
                placeholder="Nome do estabelecimento"
                value={transactionMerchant}
                onChange={(e) => setTransactionMerchant(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria (opcional)</Label>
              <Input
                id="category"
                placeholder="Ex: Alimentação, Transporte"
                value={transactionCategory}
                onChange={(e) => setTransactionCategory(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select value={transactionType} onValueChange={(value: "credit" | "debit") => setTransactionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="debit">Débito (Gasto)</SelectItem>
                  <SelectItem value="credit">Crédito (Receita)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddTransactionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTransaction} disabled={submitting}>
              {submitting ? "Adicionando..." : "Adicionar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
