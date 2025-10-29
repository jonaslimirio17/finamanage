import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AppMenu } from "@/components/AppMenu";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, MessageCircle, Rocket, Users } from "lucide-react";

const About = () => {
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

  const values = [
    {
      icon: Sparkles,
      title: "Transparência",
      description: "Você sempre saberá o que está acontecendo com seu dinheiro"
    },
    {
      icon: MessageCircle,
      title: "Simplicidade",
      description: "Sem termos complicados, só clareza e objetividade"
    },
    {
      icon: Rocket,
      title: "Liberdade",
      description: "Ferramentas que te ajudam a conquistar seus sonhos"
    },
    {
      icon: Users,
      title: "Comunidade",
      description: "Crescemos juntos, aprendendo e compartilhando"
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Cuidar do dinheiro não precisa ser chato.
            </h1>
            <div className="space-y-4 text-lg text-muted-foreground">
              <p>
                Somos jovens como você. Já passamos por boletos, estágio, faculdade e aquela dúvida eterna de "onde foi parar meu dinheiro?".
              </p>
              <p>
                Criamos o FinManage para descomplicar o controle financeiro e mostrar que entender o próprio dinheiro é o primeiro passo para conquistar o que você quer.
              </p>
            </div>
          </div>

          <div className="bg-muted/30 p-8 rounded-lg mb-16">
            <h2 className="text-2xl font-bold mb-4 text-center">Nossa Missão</h2>
            <p className="text-lg text-center text-muted-foreground">
              Transformar a relação dos jovens com o dinheiro, tornando finanças algo leve, acessível e inspirador.
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">Nossos Valores</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="bg-card p-6 rounded-lg border border-border"
                >
                  <value.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-16">
            <Button 
              size="lg"
              onClick={() => navigate("/auth")}
            >
              Conheça o app
            </Button>
          </div>
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

export default About;
