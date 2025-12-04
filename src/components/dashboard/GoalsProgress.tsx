import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, RefreshCw, Check, Loader2, TrendingUp, Calendar } from "lucide-react";
import { AddGoalDialog } from "./AddGoalDialog";
import { AddContributionDialog } from "./AddContributionDialog";
import { useToast } from "@/hooks/use-toast";

interface Goal {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  target_date: string | null;
  recurrence: string | null;
  created_at: string;
}

interface GoalPrediction {
  avgMonthlyContribution: number;
  estimatedCompletionDate: Date | null;
  monthsRemaining: number | null;
  requiredMonthlyToMeetTarget: number | null;
}

const getRecurrenceLabel = (recurrence: string | null) => {
  switch (recurrence) {
    case 'weekly': return 'Semanal';
    case 'monthly': return 'Mensal';
    case 'yearly': return 'Anual';
    default: return null;
  }
};

const getNextTargetDate = (currentDate: string | null, recurrence: string): string | null => {
  if (!currentDate) return null;
  const date = new Date(currentDate);
  switch (recurrence) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
  }
  return date.toISOString().split('T')[0];
};

const calculatePrediction = (goal: Goal): GoalPrediction => {
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  const createdAt = new Date(goal.created_at);
  const now = new Date();
  
  // Calculate months since goal creation
  const monthsSinceCreation = Math.max(
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30),
    0.5 // Minimum half month to avoid division issues
  );
  
  // Average monthly contribution based on current progress
  const avgMonthlyContribution = Number(goal.current_amount) / monthsSinceCreation;
  
  let estimatedCompletionDate: Date | null = null;
  let monthsRemaining: number | null = null;
  let requiredMonthlyToMeetTarget: number | null = null;
  
  // Calculate estimated completion date if there are contributions
  if (avgMonthlyContribution > 0 && remaining > 0) {
    monthsRemaining = remaining / avgMonthlyContribution;
    estimatedCompletionDate = new Date();
    estimatedCompletionDate.setMonth(estimatedCompletionDate.getMonth() + Math.ceil(monthsRemaining));
  }
  
  // Calculate required monthly to meet target date
  if (goal.target_date && remaining > 0) {
    const targetDate = new Date(goal.target_date);
    const monthsToTarget = Math.max(
      (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30),
      0.1
    );
    requiredMonthlyToMeetTarget = remaining / monthsToTarget;
  }
  
  return {
    avgMonthlyContribution,
    estimatedCompletionDate,
    monthsRemaining,
    requiredMonthlyToMeetTarget,
  };
};

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export const GoalsProgress = ({ profileId }: { profileId: string }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingGoal, setCompletingGoal] = useState<string | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchGoals = async () => {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .order('target_date', { ascending: true });

    if (!error && data) {
      setGoals(data as Goal[]);
    }
    setLoading(false);
  };

  const handleCompleteGoal = async (goal: Goal) => {
    setCompletingGoal(goal.id);

    try {
      const { error: updateError } = await supabase
        .from('goals')
        .update({ status: 'completed' })
        .eq('id', goal.id);

      if (updateError) throw updateError;

      await supabase.from('events_logs').insert({
        profile_id: profileId,
        event_type: 'goal_completed',
        payload: { 
          goal_id: goal.id, 
          title: goal.title,
          target_amount: goal.target_amount,
        },
      });

      if (goal.recurrence) {
        const nextTargetDate = getNextTargetDate(goal.target_date, goal.recurrence);
        
        const { error: insertError } = await supabase
          .from('goals')
          .insert({
            profile_id: profileId,
            title: goal.title,
            target_amount: goal.target_amount,
            current_amount: 0,
            target_date: nextTargetDate,
            recurrence: goal.recurrence,
            status: 'active',
          });

        if (insertError) throw insertError;

        toast({
          title: "Meta concluída!",
          description: `Nova meta "${goal.title}" criada para o próximo período.`,
        });
      } else {
        toast({
          title: "Parabéns!",
          description: `Você concluiu a meta "${goal.title}"!`,
        });
      }
    } catch (error: any) {
      console.error('Error completing goal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível concluir a meta.",
        variant: "destructive",
      });
    } finally {
      setCompletingGoal(null);
    }
  };

  useEffect(() => {
    fetchGoals();

    const channel = supabase
      .channel('goals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'goals',
          filter: `profile_id=eq.${profileId}`
        },
        () => fetchGoals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5" />
          Progresso de Metas
        </CardTitle>
        <AddGoalDialog profileId={profileId} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : goals.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma meta ativa</p>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {goals.map((goal) => {
              const progress = Math.min((Number(goal.current_amount) / Number(goal.target_amount)) * 100, 100);
              const isComplete = progress >= 100;
              const recurrenceLabel = getRecurrenceLabel(goal.recurrence);
              const prediction = calculatePrediction(goal);
              const isExpanded = expandedGoal === goal.id;
              
              return (
                <div 
                  key={goal.id} 
                  className="space-y-2 p-2 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">{goal.title}</p>
                        {recurrenceLabel && (
                          <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1">
                            <RefreshCw className="h-2.5 w-2.5" />
                            {recurrenceLabel}
                          </Badge>
                        )}
                      </div>
                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground">
                          Até {new Date(goal.target_date).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : ''}`}>
                        {progress.toFixed(0)}%
                      </span>
                      <AddContributionDialog goal={goal} profileId={profileId} />
                      {isComplete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleCompleteGoal(goal)}
                          disabled={completingGoal === goal.id}
                          title="Concluir meta"
                        >
                          {completingGoal === goal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <Progress 
                    value={progress} 
                    className={`h-2 ${isComplete ? '[&>div]:bg-green-600' : ''}`} 
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(Number(goal.current_amount))}</span>
                    <span>Meta: {formatCurrency(Number(goal.target_amount))}</span>
                  </div>

                  {/* Prediction Section - Always visible but compact */}
                  {!isComplete && Number(goal.current_amount) > 0 && (
                    <div className={`mt-2 pt-2 border-t border-border/50 space-y-1 ${isExpanded ? '' : 'hidden sm:block'}`}>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        <span>Média mensal: {formatCurrency(prediction.avgMonthlyContribution)}</span>
                      </div>
                      
                      {prediction.estimatedCompletionDate && prediction.monthsRemaining && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            Previsão: {prediction.estimatedCompletionDate.toLocaleDateString('pt-BR')} 
                            <span className="text-muted-foreground/70"> (~{Math.ceil(prediction.monthsRemaining)} {prediction.monthsRemaining <= 1 ? 'mês' : 'meses'})</span>
                          </span>
                        </div>
                      )}
                      
                      {isExpanded && goal.target_date && prediction.requiredMonthlyToMeetTarget && (
                        <div className="text-xs p-2 mt-1 bg-muted/50 rounded">
                          <p className="text-muted-foreground">
                            Para atingir até {new Date(goal.target_date).toLocaleDateString('pt-BR')}, 
                            você precisa aportar <span className="font-medium text-foreground">{formatCurrency(prediction.requiredMonthlyToMeetTarget)}/mês</span>
                          </p>
                          {prediction.avgMonthlyContribution < prediction.requiredMonthlyToMeetTarget && (
                            <p className="text-orange-600 mt-1">
                              ⚠️ Aporte atual está abaixo do necessário
                            </p>
                          )}
                          {prediction.avgMonthlyContribution >= prediction.requiredMonthlyToMeetTarget && (
                            <p className="text-green-600 mt-1">
                              ✓ No ritmo atual, você atingirá a meta no prazo
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Tap to expand hint on mobile */}
                  {!isComplete && Number(goal.current_amount) > 0 && !isExpanded && (
                    <p className="text-[10px] text-muted-foreground/50 text-center sm:hidden">
                      Toque para ver previsão
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
