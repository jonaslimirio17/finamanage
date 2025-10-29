import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BarChart3, Brain, Target, Bell, Link2, BookOpen } from "lucide-react";
import { AppMenu } from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const Features = () => {
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

  const features = [
    {
      icon: BarChart3,
      title: "Dashboard Inteligente",
      description: "Visualize seu dinheiro com clareza."
    },
    {
      icon: Brain,
      title: "Análise de Hábitos",
      description: "Entenda seus padrões e veja onde melhorar."
    },
    {
      icon: Target,
      title: "Metas Personalizadas",
      description: "Defina objetivos e acompanhe seu progresso."
    },
    {
      icon: Bell,
      title: "Notificações Inteligentes",
      description: "Lembretes sutis para manter o foco."
    },
    {
      icon: Link2,
      title: "Integração Bancária",
      description: "Conecte contas e veja tudo em um só lugar."
    },
    {
      icon: BookOpen,
      title: "Conteúdos Financeiros",
      description: "Dicas simples e rápidas para aprender finanças de verdade."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
            FinManage
          </h1>
          <AppMenu user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Tudo o que você precisa para dominar suas finanças.
          </h1>
          <p className="text-xl text-muted-foreground">
            Organize, acompanhe e melhore suas finanças pessoais sem complicação — feito especialmente para quem está começando.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="bg-card p-8 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <feature.icon className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => navigate("/auth")}
          >
            Explorar o FinManage
          </Button>
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 FinManage. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Features;
