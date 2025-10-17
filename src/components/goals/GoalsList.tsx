import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Calculator, TrendingUp } from "lucide-react";
import { GoalSimulator } from "./GoalSimulator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Goal {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  target_date: string;
  status: string;
}

interface GoalsListProps {
  profileId: string;
  onEdit: (goal: Goal) => void;
  refreshTrigger: number;
}

export const GoalsList = ({ profileId, onEdit, refreshTrigger }: GoalsListProps) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatingGoal, setSimulatingGoal] = useState<Goal | null>(null);
  const { toast } = useToast();

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setGoals(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGoals();
  }, [profileId, refreshTrigger]);

  const handleDelete = async (goalId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a meta",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Meta excluída",
        description: "A meta foi excluída com sucesso",
      });
      fetchGoals();
      
      // Log event
      await supabase.from('events_logs').insert({
        profile_id: profileId,
        event_type: 'goal_deleted',
        payload: { goal_id: goalId },
      });
    }
  };

  const handleAddContribution = async (goalId: string) => {
    const amount = prompt('Digite o valor do aporte (R$):');
    if (!amount || isNaN(parseFloat(amount))) return;

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newAmount = Number(goal.current_amount) + parseFloat(amount);

    const { error } = await supabase
      .from('goals')
      .update({ current_amount: newAmount })
      .eq('id', goalId);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o aporte",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Aporte adicionado",
        description: `R$ ${parseFloat(amount).toFixed(2)} adicionado à meta`,
      });
      fetchGoals();
      
      // Log event
      await supabase.from('events_logs').insert({
        profile_id: profileId,
        event_type: 'goal_contribution_added',
        payload: { goal_id: goalId, amount: parseFloat(amount) },
      });
    }
  };

  if (loading) {
    return <div>Carregando metas...</div>;
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Você ainda não tem metas. Crie sua primeira meta para começar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {goals.map((goal) => {
          const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
          const daysLeft = goal.target_date 
            ? Math.ceil((new Date(goal.target_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null;

          return (
            <Card key={goal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {goal.title}
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        goal.status === 'active' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      )}>
                        {goal.status === 'active' ? 'Ativa' : 'Concluída'}
                      </span>
                    </CardTitle>
                    {goal.target_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {daysLeft !== null && daysLeft > 0 
                          ? `${daysLeft} dias restantes`
                          : daysLeft === 0
                          ? 'Vence hoje'
                          : 'Vencida'
                        } • Meta: {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSimulatingGoal(goal)}
                    >
                      <Calculator className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(goal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-sm mt-2">
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(goal.current_amount))}
                    </span>
                    <span className="text-muted-foreground">
                      de {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(goal.target_amount))}
                    </span>
                  </div>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleAddContribution(goal.id)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Adicionar Aporte
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!simulatingGoal} onOpenChange={() => setSimulatingGoal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Simulador de Aportes</DialogTitle>
          </DialogHeader>
          {simulatingGoal && (
            <GoalSimulator
              goal={simulatingGoal}
              onClose={() => setSimulatingGoal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
