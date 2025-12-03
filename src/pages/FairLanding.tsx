import { useState } from "react";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import SpinWheel from "@/components/fair/SpinWheel";
import PrizeModal from "@/components/fair/PrizeModal";
import { Sparkles, Users, TrendingUp, Shield } from "lucide-react";
const formSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  acceptTerms: z.boolean().refine(val => val === true, {
    message: "Você deve aceitar os termos"
  })
});
type FormData = z.infer<typeof formSchema>;

// Mapeamento de prêmios para tipos de desconto
const prizeToDiscountType: Record<string, string> = {
  "1 mês grátis": "free_months_1",
  "2 meses grátis": "free_months_2",
  "3 meses grátis": "free_months_3",
  "30% off 6 meses": "percent_30_6m",
  "50% off 6 meses": "percent_50_6m"
};
const FairLanding = () => {
  const [step, setStep] = useState<"form" | "wheel" | "done">("form");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [wonPrize, setWonPrize] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [userData, setUserData] = useState<FormData | null>(null);
  const {
    toast
  } = useToast();
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      acceptTerms: false
    }
  });
  const generateCoupon = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const randomPart = Array.from({
      length: 6
    }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    return `FEIRA-${randomPart}`;
  };
  const checkEmailExists = async (email: string) => {
    const {
      data,
      error
    } = await supabase.from("fair_leads").select("id").eq("email", email).maybeSingle();
    if (error && error.code !== "PGRST116") {
      console.error("Error checking email:", error);
      return false;
    }
    return !!data;
  };
  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const emailExists = await checkEmailExists(data.email);
      if (emailExists) {
        toast({
          title: "Email já cadastrado",
          description: "Este email já participou da promoção.",
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }
      setUserData(data);
      setStep("wheel");
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSpinEnd = async (prize: {
    label: string;
  }) => {
    if (!userData) return;
    const newCoupon = generateCoupon();
    setCouponCode(newCoupon);
    setWonPrize(prize.label);

    // Determinar o tipo de desconto
    const discountType = prizeToDiscountType[prize.label] || "unknown";
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const {
        error
      } = await supabase.from("fair_leads").insert({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || null,
        prize_won: prize.label,
        coupon_code: newCoupon,
        discount_type: discountType,
        utm_source: urlParams.get("utm_source"),
        utm_campaign: urlParams.get("utm_campaign") || "feira_empreendedorismo"
      });
      if (error) throw error;
      setShowPrizeModal(true);
      setStep("done");
    } catch (error) {
      console.error("Error saving lead:", error);
      toast({
        title: "Erro ao salvar",
        description: "Seu prêmio é válido! Anote o código: " + newCoupon,
        variant: "destructive"
      });
      setShowPrizeModal(true);
      setStep("done");
    }
  };
  return <>
      <Helmet>
        <title>Gire a Roleta - FinaManage na Feira de Empreendedorismo</title>
        <meta name="description" content="Ganhe até 3 meses grátis no FinaManage! Gire a roleta e garanta seu prêmio exclusivo na Feira de Empreendedorismo." />
        <meta property="og:title" content="Gire a Roleta - FinaManage na Feira de Empreendedorismo" />
        <meta property="og:description" content="Ganhe até 3 meses grátis no FinaManage! Gire a roleta e garanta seu prêmio exclusivo." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <header className="border-b border-border bg-background/80 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex justify-center">
            <Logo />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 md:py-12">
          {/* Hero Section */}
          <div className="text-center mb-8 md:mb-12 animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">
                Feira de Empreendedorismo 2025
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
              Gire a Roleta e Ganhe
              <span className="text-primary block mt-2">Prêmios Exclusivos!</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre-se agora e concorra a até{" "}
              <strong className="text-foreground">3 meses grátis</strong> do
              FinaManage, o app que vai revolucionar suas finanças!
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-5xl mx-auto">
            {/* Left: Form or Wheel */}
            <div className="order-2 md:order-1">
              {step === "form" && <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg animate-scale-in">
                  <h2 className="text-xl font-semibold mb-6 text-center">
                    Preencha seus dados para girar
                  </h2>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField control={form.control} name="name" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Nome completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Seu nome" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="email" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>Email *</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="seu@email.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="phone" render={({
                    field
                  }) => <FormItem>
                            <FormLabel>WhatsApp (opcional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(00) 00000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>} />

                      <FormField control={form.control} name="acceptTerms" render={({
                    field
                  }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel className="text-sm font-normal">
                                Aceito receber comunicações do FinaManage e
                                concordo com a{" "}
                                <a href="/politica-de-privacidade" target="_blank" className="text-primary hover:underline">
                                  Política de Privacidade
                                </a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>} />

                      <Button type="submit" size="lg" className="w-full text-lg" disabled={isSubmitting}>
                        {isSubmitting ? "Verificando..." : "🎰 Liberar a Roleta!"}
                      </Button>
                    </form>
                  </Form>
                </div>}

              {(step === "wheel" || step === "done") && <div className="flex justify-center animate-scale-in">
                  <SpinWheel onSpinEnd={handleSpinEnd} disabled={step === "done"} />
                </div>}
            </div>

            {/* Right: Benefits */}
            <div className="order-1 md:order-2 space-y-6">
              <div className="bg-card/50 border border-border rounded-xl p-6">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Prêmios disponíveis
                </h3>
                <ul className="space-y-3">
                  {[{
                  prize: "1 mês grátis",
                  chance: "50%"
                }, {
                  prize: "2 meses grátis",
                  chance: "20%"
                }, {
                  prize: "3 meses grátis",
                  chance: "5%"
                }, {
                  prize: "30% off por 6 meses",
                  chance: "17%"
                }, {
                  prize: "50% off por 6 meses",
                  chance: "8%"
                }].map(item => <li key={item.prize} className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.prize}</span>
                      <span className="text-muted-foreground bg-muted px-2 py-1 rounded">
                        {item.chance}
                      </span>
                    </li>)}
                </ul>
              </div>

              <div className="grid grid-cols-3 gap-4">
                
                
                
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border mt-12 py-6">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            <p>© 2025 FinaManage. Todos os direitos reservados.</p>
            <p className="mt-2">
              <a href="/politica-de-privacidade" className="hover:underline">
                Política de Privacidade
              </a>
              {" • "}
              <a href="/" className="hover:underline">
                Voltar ao site
              </a>
            </p>
          </div>
        </footer>
      </div>

      <PrizeModal open={showPrizeModal} onClose={() => setShowPrizeModal(false)} prize={wonPrize} couponCode={couponCode} />
    </>;
};
export default FairLanding;