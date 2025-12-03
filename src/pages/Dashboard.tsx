import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Upload, MessageSquare } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { IncomePieChart } from "@/components/dashboard/IncomePieChart";
import { ExpenseTimeline } from "@/components/dashboard/ExpenseTimeline";
import { IncomeTimeline } from "@/components/dashboard/IncomeTimeline";
import { TransactionHistory } from "@/components/dashboard/TransactionHistory";
import { UpcomingDebts } from "@/components/dashboard/UpcomingDebts";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { LastSyncInfo } from "@/components/dashboard/LastSyncInfo";
import { NotificationsList } from "@/components/dashboard/NotificationsList";
import { AppMenu } from "@/components/AppMenu";
import { Logo } from "@/components/Logo";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Bem-vindo de volta, {user.email?.split('@')[0]}! 👋</h2>
              <p className="text-muted-foreground">
                Hoje é um ótimo dia para dar mais um passo na sua liberdade financeira. Você está no caminho certo. Continue avançando. 🌱
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <Button onClick={() => navigate('/whatsapp')} variant="outline" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
              <Button onClick={() => navigate('/importar-extrato')} variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importar Extrato</span>
              </Button>
              <LastSyncInfo profileId={user.id} />
            </div>
          </div>

          {/* Notifications */}
          <NotificationsList profileId={user.id} />

          {/* Balance Card */}
          <div className="grid md:grid-cols-3 gap-6">
            <BalanceCard profileId={user.id} />
            <UpcomingDebts profileId={user.id} />
            <GoalsProgress profileId={user.id} />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            <CategoryPieChart profileId={user.id} />
            <IncomePieChart profileId={user.id} />
          </div>
          
          <ExpenseTimeline profileId={user.id} />
          <IncomeTimeline profileId={user.id} />
          
          {/* Transaction History */}
          <TransactionHistory profileId={user.id} />
        </div>
      </main>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-2">
            <button
              onClick={() => navigate("/privacy-policy")}
              className="text-sm text-primary hover:underline"
            >
              Política de Privacidade
            </button>
            <span className="hidden md:inline text-muted-foreground">•</span>
            <button
              onClick={() => navigate("/help")}
              className="text-sm text-primary hover:underline"
            >
              Ajuda e Suporte
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 FinaManage. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;
