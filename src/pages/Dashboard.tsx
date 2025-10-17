import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { BalanceCard } from "@/components/dashboard/BalanceCard";
import { CategoryPieChart } from "@/components/dashboard/CategoryPieChart";
import { IncomePieChart } from "@/components/dashboard/IncomePieChart";
import { ExpenseTimeline } from "@/components/dashboard/ExpenseTimeline";
import { IncomeTimeline } from "@/components/dashboard/IncomeTimeline";
import { UpcomingDebts } from "@/components/dashboard/UpcomingDebts";
import { GoalsProgress } from "@/components/dashboard/GoalsProgress";
import { LastSyncInfo } from "@/components/dashboard/LastSyncInfo";

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
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">FinManage</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">
                Bem-vindo ao seu painel financeiro, {user.email}!
              </p>
            </div>
            <LastSyncInfo profileId={user.id} />
          </div>

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
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
