import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

interface Goal {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  target_date: string;
}

export const GoalsProgress = ({ profileId }: { profileId: string }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('profile_id', profileId)
        .eq('status', 'active')
        .order('target_date', { ascending: true });

      if (!error && data) {
        setGoals(data);
      }
      setLoading(false);
    };

    fetchGoals();
  }, [profileId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Progresso de Metas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : goals.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma meta ativa</p>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="font-medium">{goal.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {progress.toFixed(0)}%
                    </p>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(goal.current_amount))}
                    </span>
                    <span>
                      Meta: {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(goal.target_amount))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
