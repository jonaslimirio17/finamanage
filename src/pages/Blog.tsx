import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppMenu } from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, ArrowRight } from "lucide-react";

const Blog = () => {
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

  const articles = [
    {
      title: "5 jeitos de economizar na faculdade sem virar o chato do grupo",
      excerpt: "Descubra como guardar dinheiro sem abrir mão de viver a vida universitária.",
      category: "Economia"
    },
    {
      title: "Como sair do vermelho mesmo com estágio",
      excerpt: "Estratégias práticas para equilibrar contas quando a renda ainda é limitada.",
      category: "Finanças"
    },
    {
      title: "Investir é coisa de jovem, sim!",
      excerpt: "Desmistificando o mundo dos investimentos para quem está começando.",
      category: "Investimentos"
    },
    {
      title: "O que aprendi ao controlar meus gastos por 30 dias",
      excerpt: "Uma experiência real sobre os desafios e vitórias do controle financeiro.",
      category: "Experiência"
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
            Finanças com leveza: aprenda, pratique e evolua.
          </h1>
          <p className="text-xl text-muted-foreground">
            O blog do FinManage traz conteúdos práticos e inspiradores para quem quer entender o próprio dinheiro sem complicar.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {articles.map((article, index) => (
            <div 
              key={index}
              className="bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <BookOpen className="w-8 h-8 text-primary flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-primary">{article.category}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-muted-foreground mb-4">{article.excerpt}</p>
                  <div className="flex items-center gap-2 text-primary font-medium">
                    <span>Ler artigo</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg"
            variant="outline"
            onClick={() => navigate("/help")}
          >
            Ver mais artigos
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

export default Blog;
