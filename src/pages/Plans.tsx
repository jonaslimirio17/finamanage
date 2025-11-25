import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

import { Logo } from "@/components/Logo";

const Plans = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

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

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-12">
          {/* Free Plan */}
          <div className="bg-card p-8 rounded-lg border-2 border-border hover:border-primary/50 transition-colors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">💸 Gratuito para começar</h2>
              <p className="text-3xl font-bold text-primary">R$ 0</p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {freePlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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

          {/* Premium Plan */}
          <div className="bg-card p-8 rounded-lg border-2 border-primary hover:border-primary/80 transition-colors relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Popular
            </div>
            
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">🚀 Premium</h2>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-primary">R$ 14,90</p>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Menos que um café por semana!
              </p>
            </div>
            
            <ul className="space-y-4 mb-8">
              {premiumPlan.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <Button 
              className="w-full"
              onClick={() => navigate("/auth")}
            >
              Quero o Premium
            </Button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-muted-foreground">
            Todos os planos são sem fidelidade.
            <br />
            <span className="font-semibold">Porque liberdade financeira também é liberdade de escolha.</span>
          </p>
        </div>
      </main>

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
