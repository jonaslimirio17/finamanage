import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppMenu } from "@/components/AppMenu";
import { Logo } from "@/components/Logo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CreditCard, Calendar, DollarSign, FileText } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Subscription {
  id: string;
  status: string;
  payment_method: string;
  value: number;
  next_due_date: string;
  created_at: string;
}

interface Payment {
  id: string;
  value: number;
  payment_method: string;
  status: string;
  due_date: string;
  payment_date: string | null;
  invoice_url: string | null;
  created_at: string;
}

const Subscription = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    setUser(session.user);
    await loadSubscriptionData(session.user.id);
  };

  const loadSubscriptionData = async (userId: string) => {
    setLoading(true);
    try {
      // Buscar assinatura ativa
      const { data: subData, error: subError } = await supabase
        .from("asaas_subscriptions")
        .select("*")
        .eq("profile_id", userId)
        .eq("status", "ACTIVE")
        .single();

      if (subError && subError.code !== "PGRST116") {
        throw subError;
      }

      setSubscription(subData);

      // Buscar histórico de pagamentos
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("asaas_payments")
        .select("*")
        .eq("profile_id", userId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (paymentsError) throw paymentsError;

      setPayments(paymentsData || []);
    } catch (error: any) {
      console.error("Error loading subscription:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados da assinatura.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("asaas-cancel-subscription");

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Assinatura cancelada",
        description: data.message,
      });

      // Recarregar dados
      if (user) {
        await loadSubscriptionData(user.id);
      }
    } catch (error: any) {
      console.error("Error canceling subscription:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar assinatura.",
        variant: "destructive",
      });
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      ACTIVE: { label: "Ativa", variant: "default" },
      INACTIVE: { label: "Inativa", variant: "secondary" },
      PENDING: { label: "Pendente", variant: "outline" },
      CONFIRMED: { label: "Confirmado", variant: "default" },
      RECEIVED: { label: "Recebido", variant: "default" },
      OVERDUE: { label: "Vencido", variant: "destructive" },
    };

    const config = statusMap[status] || { label: status, variant: "secondary" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPaymentMethodLabel = (method: string) => {
    const methodMap: Record<string, string> = {
      CREDIT_CARD: "Cartão de Crédito",
      PIX: "PIX",
    };
    return methodMap[method] || method;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <AppMenu user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Minha Assinatura</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura Premium e histórico de pagamentos
            </p>
          </div>

          {subscription ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Plano Premium</CardTitle>
                    {getStatusBadge(subscription.status)}
                  </div>
                  <CardDescription>
                    Assinado em {format(new Date(subscription.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Método de Pagamento</p>
                        <p className="text-sm text-muted-foreground">
                          {getPaymentMethodLabel(subscription.payment_method)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <DollarSign className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Valor Mensal</p>
                        <p className="text-sm text-muted-foreground">
                          R$ {subscription.value.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Próximo Vencimento</p>
                        <p className="text-sm text-muted-foreground">
                          {subscription.next_due_date
                            ? format(new Date(subscription.next_due_date), "dd/MM/yyyy")
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" disabled={canceling}>
                          {canceling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Cancelar Assinatura
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Sua assinatura será cancelada, mas você continuará com acesso Premium até o
                            fim do período já pago ({subscription.next_due_date
                              ? format(new Date(subscription.next_due_date), "dd/MM/yyyy")
                              : "data não disponível"}).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancelSubscription}>
                            Confirmar Cancelamento
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Pagamentos</CardTitle>
                  <CardDescription>Seus últimos 10 pagamentos</CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum pagamento encontrado
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {payments.map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium">
                                R$ {payment.value.toFixed(2)} - {getPaymentMethodLabel(payment.payment_method)}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Vencimento: {format(new Date(payment.due_date), "dd/MM/yyyy")}
                                {payment.payment_date && (
                                  <> • Pago em: {format(new Date(payment.payment_date), "dd/MM/yyyy")}</>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusBadge(payment.status)}
                            {payment.invoice_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.open(payment.invoice_url!, "_blank")}
                              >
                                Ver Fatura
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Você não possui uma assinatura ativa no momento.
                </p>
                <Button onClick={() => navigate("/plans")}>
                  Assinar Premium
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Subscription;
