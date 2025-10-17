import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, Zap, Target, Shield, CheckCircle2, HelpCircle } from "lucide-react";
import appMockup from "@/assets/app-mockup.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Comece a controlar suas finanças hoje — rápido e sem complicação.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Conecte sua conta bancária ou importe um extrato. FinManage organiza gastos, mostra metas e dá recomendações práticas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="text-base"
                onClick={() => {
                  trackEvent("cta_create_account_click");
                  navigate("/auth");
                }}
                aria-label="Criar minha conta no FinManage"
              >
                Criar minha conta
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                className="text-base"
                onClick={handleScrollToDemo}
                aria-label="Ver demonstração do FinManage"
              >
                Quero ver uma demo
              </Button>
            </div>
            <p className="text-sm text-muted-foreground flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
              Cadastro em 30s — conexão opcional em seguida.
            </p>
          </div>
          <div className="relative">
            <img 
              src={appMockup} 
              alt="Mockup da tela do FinManage mostrando dashboard"
              className="w-full h-auto rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <Zap className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conexão automática</h3>
              <p className="text-muted-foreground">
                Conecte via Open Finance e veja seu orçamento sem esforço.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <CheckCircle2 className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Recomendações práticas</h3>
              <p className="text-muted-foreground">
                Dicas personalizadas para cortar gastos e priorizar dívidas.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Metas que funcionam</h3>
              <p className="text-muted-foreground">
                Projete quanto falta para sua meta e receba um plano simples.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold">Crie sua conta</h3>
              <p className="text-muted-foreground">Cadastro rápido com e-mail.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold">Conecte ou importe</h3>
              <p className="text-muted-foreground">Abra o widget do banco ou carregue um CSV.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold">Receba insights</h3>
              <p className="text-muted-foreground">Dashboard e recomendações personalizadas.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-5 h-5" />
            Usado por beta testers — segurança e privacidade em primeiro lugar.
          </p>
        </div>
      </section>

      {/* Secondary CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">Pronto para começar?</h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => {
              trackEvent("cta_create_account_click");
              navigate("/auth");
            }}>
              Criar minha conta
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/auth")}>
              Importar extrato
            </Button>
          </div>
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
                  <h3 className="font-semibold mb-2">Quais dados vocês acessam?</h3>
                  <p className="text-muted-foreground">
                    Apenas extratos e produtos financeiros que você autorizar. Não acessamos senhas.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">É seguro?</h3>
                  <p className="text-muted-foreground">
                    Usamos criptografia TLS e só armazenamos dados necessários. Você pode revogar o acesso a qualquer momento.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <div className="flex gap-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-2">Posso usar sem conectar conta?</h3>
                  <p className="text-muted-foreground">
                    Sim — você pode importar CSV ou adicionar transações manualmente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-signup Form */}
      <section className="py-16">
        <div className="container mx-auto px-4 max-w-xl">
          <form onSubmit={handlePreSignup} className="space-y-4">
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="text-base"
              aria-label="Digite seu e-mail"
            />
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                required
                aria-label="Aceitar política de privacidade"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                Quero receber comunicações e concordo com a{" "}
                <a href="#politica" className="text-primary underline">
                  Política de Privacidade (LGPD)
                </a>
                . Entendo que precisarei autorizar o acesso às minhas contas para usar a sincronização automática.
              </label>
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Processando..." : "Continuar"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              <Shield className="w-3 h-3 inline mr-1" />
              Nunca compartilhamos seu e-mail com terceiros sem consentimento.
            </p>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            Ao prosseguir você aceita nossa{" "}
            <a href="#politica" className="text-primary underline">
              Política de Privacidade
            </a>{" "}
            — você pode solicitar exportação ou exclusão de dados a qualquer momento.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
