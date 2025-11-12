import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Rocket, ArrowLeft, Mail, Bell } from "lucide-react";

const ComingSoon = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePreSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreedToTerms) {
      toast({
        title: "Aceite os termos",
        description: "Por favor, aceite os termos de uso e política de privacidade.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Using any to bypass TypeScript error - table exists in database
      const { error } = await (supabase as any)
        .from('pre_signup_leads')
        .insert([
          { 
            email,
            source: 'coming_soon_page'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Cadastro realizado!",
        description: "Você será notificado quando lançarmos.",
      });

      setEmail("");
      setAgreedToTerms(false);
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Erro ao cadastrar",
        description: "Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <Rocket className="h-10 w-10 text-primary" />
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-foreground">
            Estamos Quase Lá!
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-md mx-auto">
            O FinManage está sendo preparado para transformar a forma como você gerencia suas finanças.
          </p>
        </div>

        <div className="bg-card border rounded-lg p-8 shadow-lg space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Bell className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">Seja um dos Primeiros</h2>
          </div>
          
          <p className="text-muted-foreground">
            Cadastre seu email e seja notificado assim que lançarmos. 
            Usuários early bird terão <span className="font-semibold text-primary">acesso antecipado</span> e 
            <span className="font-semibold text-primary"> benefícios exclusivos</span>!
          </p>

          <form onSubmit={handlePreSignup} className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                size="lg"
              >
                <Mail className="h-4 w-4 mr-2" />
                Notificar-me
              </Button>
            </div>

            <div className="flex items-start gap-2 text-left">
              <Checkbox
                id="terms-coming-soon"
                checked={agreedToTerms}
                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              />
              <label
                htmlFor="terms-coming-soon"
                className="text-sm text-muted-foreground leading-tight cursor-pointer"
              >
                Concordo em receber atualizações e aceito os termos de uso e política de privacidade.
              </label>
            </div>
          </form>

          <div className="pt-4 border-t">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-xs text-muted-foreground">Gratuito</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">OCR</div>
                <div className="text-xs text-muted-foreground">Automático</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">IA</div>
                <div className="text-xs text-muted-foreground">Integrada</div>
              </div>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para a página inicial
        </Button>

        <p className="text-sm text-muted-foreground">
          © 2025 FinManage. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
};

export default ComingSoon;
