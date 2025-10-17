import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";

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
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Dashboard</h2>
          <p className="text-muted-foreground mb-8">
            Bem-vindo ao seu painel financeiro, {user.email}!
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Contas conectadas</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Transações</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
            
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="font-semibold mb-2">Metas ativas</h3>
              <p className="text-3xl font-bold">0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
