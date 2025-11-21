import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { User, Session } from "@supabase/supabase-js";
import { Plus } from "lucide-react";
import { GoalForm } from "@/components/goals/GoalForm";
import { GoalsList } from "@/components/goals/GoalsList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AppMenu } from "@/components/AppMenu";

// TEMPORÁRIO: Bypass de autenticação para análise por IAs
const BYPASS_AUTH = true;

const Goals = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Mock user para bypass
      setUser({ id: 'demo-user', email: 'demo@finmanage.com' } as User);
      return;
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      }
    });

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
      navigate("/");
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setIsFormOpen(true);
  };

  const handleEditGoal = (goal: any) => {
    setEditingGoal(goal);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingGoal(null);
    setRefreshTrigger(prev => prev + 1);
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
          <h1 className="text-2xl font-bold text-primary">FinManage</h1>
          <AppMenu user={user} />
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Metas Financeiras</h2>
              <p className="text-muted-foreground">
                Defina e acompanhe suas metas de economia
              </p>
            </div>
            <Button onClick={handleCreateGoal}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Meta
            </Button>
          </div>

          <GoalsList 
            profileId={user.id} 
            onEdit={handleEditGoal}
            refreshTrigger={refreshTrigger}
          />
        </div>
      </main>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? "Editar Meta" : "Nova Meta"}
            </DialogTitle>
          </DialogHeader>
          <GoalForm
            profileId={user.id}
            goal={editingGoal}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Goals;
