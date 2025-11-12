import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, Zap, Target, Shield, CheckCircle2, HelpCircle } from "lucide-react";
import appMockup from "@/assets/app-mockup.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppMenu } from "@/components/AppMenu";

const Index = () => {
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleScrollToDemo = () => {
    document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    trackEvent("cta_demo_click");
  };

  const trackEvent = (eventType: string) => {
    if (typeof window !== "undefined" && (window as any).dataLayer) {
      (window as any).dataLayer.push({
        event: eventType,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handlePreSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Consentimento necessário",
        description: "Por favor, aceite a Política de Privacidade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    trackEvent("pre_signup_submitted");

    try {
      // Salvar lead em pre_signups (será criado via migration)
      const { error } = await supabase.from("pre_signups").insert({
        email,
        source_page: "landing",
        utm_source: new URLSearchParams(window.location.search).get("utm_source"),
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign"),
      });

      if (error) throw error;

      toast({
        title: "Checamos seu e-mail!",
        description: "Verifique sua caixa de entrada para continuar.",
      });

      setEmail("");
      setAgreedToTerms(false);
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro ao processar",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Menu */}
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">FinManage</h1>
          <AppMenu user={user} />
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Domine suas finanças. Viva o presente.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              O FinManage transforma o controle do seu dinheiro em algo simples, rápido e que cabe no seu ritmo de vida universitário. Sem planilhas confusas. Sem burocracia. Só clareza e liberdade.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base"
                onClick={() => {
                  trackEvent("cta_scroll_to_form");
                  const form = document.getElementById('pre-signup-form');
                  form?.scrollIntoView({ behavior: 'smooth' });
                }}
                aria-label="Quero ser avisado do lançamento"
              >
                Quero ser avisado do lançamento
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-base"
                onClick={handleScrollToDemo}
                aria-label="Ver como funciona"
              >
                Ver como funciona
              </Button>
            </div>
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-sm font-semibold">Lançamento em breve • Vagas limitadas</span>
            </div>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Sem cartões. Sem taxas. Só você e seus planos.
            </p>
          </div>
          <div className="relative">
            <img 
              src={appMockup} 
              alt="Mockup da tela do FinManage mostrando dashboard"
              className="w-full h-auto rounded-lg shadow-2xl"
              width="1280"
              height="720"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Por que escolher o FinManage</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            A vida financeira não precisa ser um enigma. O FinManage mostra o caminho.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="text-3xl mb-4">💡</div>
              <h3 className="text-xl font-semibold mb-2">Visual claro e moderno</h3>
              <p className="text-muted-foreground">
                Nada de planilhas complicadas.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="text-3xl mb-4">🧭</div>
              <h3 className="text-xl font-semibold mb-2">Metas reais</h3>
              <p className="text-muted-foreground">
                Economize para a viagem, o curso ou o intercâmbio.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Insights automáticos</h3>
              <p className="text-muted-foreground">
                Veja onde otimizar seus gastos sem precisar pensar demais.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Segurança total</h3>
              <p className="text-muted-foreground">
                Criptografia bancária e proteção de dados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Como funciona</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            É como um coach financeiro no seu bolso — só que sem julgamentos.
          </p>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Crie sua conta</h3>
              <p className="text-muted-foreground">Em menos de 2 minutos.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Adicione seus gastos</h3>
              <p className="text-muted-foreground">Ou conecte sua conta bancária.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3️⃣</span>
              </div>
              <h3 className="text-xl font-semibold">Acompanhe suas metas</h3>
              <p className="text-muted-foreground">E veja seu progresso crescer.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Depoimentos</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-card p-6 rounded-lg border border-border">
              <p className="text-muted-foreground mb-4 italic">
                "Antes eu nunca sabia para onde meu dinheiro ia. Agora, consigo juntar para o que realmente importa."
              </p>
              <p className="font-semibold">— Letícia, 21 anos, UFG</p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <p className="text-muted-foreground mb-4 italic">
                "FinManage virou parte da minha rotina. É leve, direto e faz sentido."
              </p>
              <p className="font-semibold">— Pedro, 23 anos, Engenharia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Está pronto para ter controle sem perder a leveza?</h2>
          <Button size="lg" onClick={() => {
            trackEvent("cta_create_account_click");
            navigate("/auth");
          }}>
            Comece grátis agora
          </Button>
          <p className="text-muted-foreground">
            Sem cartões. Sem taxas. Só você e seus planos.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Perguntas frequentes</h2>
          <div className="space-y-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">O app é gratuito?</h3>
                  <p className="text-muted-foreground">
                    Sim! Você pode começar pelo plano Free sem pagar nada.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Posso cancelar quando quiser?</h3>
                  <p className="text-muted-foreground">
                    Claro! Sem fidelidade, sem pegadinhas.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">É seguro conectar minha conta bancária?</h3>
                  <p className="text-muted-foreground">
                    Sim. Usamos criptografia bancária — seus dados permanecem 100% protegidos.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Preciso entender de finanças?</h3>
                  <p className="text-muted-foreground">
                    Não! O FinManage foi feito exatamente para quem está começando.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-signup Form */}
      <section id="pre-signup-form" className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Seja um dos Primeiros</h2>
            <p className="text-lg text-muted-foreground">
              Cadastre-se agora e receba <span className="text-primary font-semibold">acesso antecipado</span> quando lançarmos.
              Primeiros usuários terão benefícios exclusivos! 🎁
            </p>
          </div>
          
          <div className="bg-card p-8 rounded-lg shadow-lg border border-border">
            <form onSubmit={handlePreSignup} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email-signup" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email-signup"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-base"
                  aria-label="Digite seu e-mail"
                />
              </div>
              
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms"
                  checked={agreedToTerms}
                  onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  required
                  aria-label="Aceitar política de privacidade"
                />
                <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight cursor-pointer">
                  Concordo em receber atualizações sobre o lançamento e aceito a{" "}
                  <span className="text-primary underline cursor-pointer">
                    Política de Privacidade (LGPD)
                  </span>
                </label>
              </div>
              
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Processando..." : "Garantir meu acesso antecipado"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                <Shield className="w-3 h-3" />
                Seus dados estão seguros. Nunca compartilhamos com terceiros.
              </p>
            </form>
            
            <div className="mt-6 pt-6 border-t grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">+500</div>
                <div className="text-xs text-muted-foreground">Já cadastrados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Gratuito</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">OCR</div>
                <div className="text-xs text-muted-foreground">Automático</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-bold text-primary">FinManage</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Transforme sua relação com o dinheiro. Gestão financeira inteligente para universitários.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2025 FinManage. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
