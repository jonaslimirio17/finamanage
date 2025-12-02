import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { CheckoutModal } from "@/components/subscription/CheckoutModal";

export type PlanType = 'monthly' | 'semiannual' | 'annual';

const Plans = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const freePlan = [
    "Controle básico de gastos",
    "Criação de metas",
    "Relatórios simples",
    "Comece sem cartão de crédito"
  ];

  const premiumPlan = [
    "Tudo do plano Free",
    "🎓 Acesso à Educação Financeira Premium",
    "📚 E-books, artigos e vídeos exclusivos",
    "Alertas e dicas automáticas",
    "Relatórios avançados",
    "Conexão com bancos e suporte VIP"
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <AppMenu user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Um plano para cada fase da sua jornada.
          </h1>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
          {/* Free Plan */}
          <div className="bg-card p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">💸 Gratuito</h2>
              <p className="text-2xl font-bold text-primary">R$ 0</p>
            </div>
            
            <ul className="space-y-3 mb-6 min-h-[200px]">
              {freePlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full"
              variant="outline"
              onClick={() => navigate("/auth")}
            >
              Usar grátis
            </Button>
          </div>

          {/* Monthly Plan */}
          <div className="bg-card p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">🚀 Mensal</h2>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">R$ 19,90</p>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6 min-h-[200px]">
              {premiumPlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full"
              onClick={() => {
                if (user) {
                  setSelectedPlan('monthly');
                  setCheckoutOpen(true);
                } else {
                  navigate("/auth");
                }
              }}
            >
              Assinar
            </Button>
          </div>

          {/* Annual Plan - RECOMMENDED (HIGHLIGHTED) */}
          <div className="bg-card p-6 rounded-lg border-2 border-primary hover:border-primary/80 transition-all scale-105 shadow-xl z-10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-lg">
              🏆 Recomendado
            </div>
            
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">💎 Anual</h2>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground line-through">
                  R$ 238,80 se pago mensalmente
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-primary">R$ 149,90</p>
                  <span className="text-muted-foreground text-sm">/ano</span>
                </div>
                <p className="text-sm font-bold text-green-600 dark:text-green-400">
                  💰 Economize R$ 88,90 por ano
                </p>
              </div>
            </div>
            
            <ul className="space-y-3 mb-6 min-h-[200px]">
              {premiumPlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              onClick={() => {
                if (user) {
                  setSelectedPlan('annual');
                  setCheckoutOpen(true);
                } else {
                  navigate("/auth");
                }
              }}
            >
              Economizar 37% agora
            </Button>
          </div>

          {/* Semiannual Plan */}
          <div className="bg-card p-6 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">⚡ Semestral</h2>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-primary">R$ 14,98</p>
                <span className="text-muted-foreground text-sm">/mês</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                R$ 89,90 a cada 6 meses
              </p>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mt-1">
                Economize 25%
              </p>
            </div>
            
            <ul className="space-y-3 mb-6 min-h-[200px]">
              {premiumPlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full"
              onClick={() => {
                if (user) {
                  setSelectedPlan('semiannual');
                  setCheckoutOpen(true);
                } else {
                  navigate("/auth");
                }
              }}
            >
              Assinar
            </Button>
          </div>
        </div>

        {/* Trust Elements */}
        <div className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>✅ Garantia de 7 dias</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>🔒 Pagamento 100% seguro</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span>⚡ Acesso imediato</span>
            </div>
          </div>
          
          <p className="text-muted-foreground">
            Todos os planos são sem fidelidade.
            <br />
            <span className="font-semibold">Porque liberdade financeira também é liberdade de escolha.</span>
          </p>
        </div>
      </main>

      <CheckoutModal 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen}
        planType={selectedPlan}
      />

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 FinaManage. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Plans;
