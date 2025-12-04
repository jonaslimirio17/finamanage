import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Clock, RefreshCw, Check, Loader2 } from "lucide-react";
import { AddDebtDialog } from "./AddDebtDialog";
import { useToast } from "@/hooks/use-toast";

interface Debt {
  id: string;
  creditor: string;
  principal: number;
  due_date: string;
  status: string;
  recurrence: string | null;
  interest_rate: number | null;
}

const getUrgencyInfo = (dueDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue <= 0) {
    return { level: 'overdue', label: 'Vencida', color: 'bg-destructive text-destructive-foreground', icon: AlertCircle };
  } else if (daysUntilDue <= 3) {
    return { level: 'critical', label: `${daysUntilDue}d`, color: 'bg-destructive text-destructive-foreground', icon: AlertCircle };
  } else if (daysUntilDue <= 7) {
    return { level: 'warning', label: `${daysUntilDue}d`, color: 'bg-orange-500 text-white', icon: AlertTriangle };
  } else {
    return { level: 'normal', label: `${daysUntilDue}d`, color: 'bg-muted text-muted-foreground', icon: Clock };
  }
};

const getRecurrenceLabel = (recurrence: string | null) => {
  switch (recurrence) {
    case 'weekly': return 'Semanal';
    case 'monthly': return 'Mensal';
    case 'yearly': return 'Anual';
    default: return null;
  }
};

const getNextDueDate = (currentDueDate: string, recurrence: string): string => {
  const date = new Date(currentDueDate);
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

export const UpcomingDebts = ({ profileId }: { profileId: string }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchDebts = async () => {
    const today = new Date();
    today.setDate(today.getDate() - 1);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('profile_id', profileId)
      .eq('status', 'active')
      .gte('due_date', today.toISOString().split('T')[0])
      .lte('due_date', thirtyDaysFromNow.toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (!error && data) {
      setDebts(data as Debt[]);
    }
    setLoading(false);
  };

  const handleMarkAsPaid = async (debt: Debt) => {
    setMarkingPaid(debt.id);

    try {
      // Mark current debt as paid
      const { error: updateError } = await supabase
        .from('debts')
        .update({ status: 'paid' })
        .eq('id', debt.id);

      if (updateError) throw updateError;

      // If recurring, create next debt
      if (debt.recurrence && debt.due_date) {
        const nextDueDate = getNextDueDate(debt.due_date, debt.recurrence);
        
        const { error: insertError } = await supabase
          .from('debts')
          .insert({
            profile_id: profileId,
            creditor: debt.creditor,
            principal: debt.principal,
            interest_rate: debt.interest_rate,
            due_date: nextDueDate,
            recurrence: debt.recurrence,
            status: 'active',
          });

        if (insertError) throw insertError;

        toast({
          title: "Dívida paga!",
          description: `Próximo vencimento criado para ${new Date(nextDueDate).toLocaleDateString('pt-BR')}.`,
        });
      } else {
        toast({
          title: "Dívida paga!",
          description: "A dívida foi marcada como paga.",
        });
      }
    } catch (error: any) {
      console.error('Error marking debt as paid:', error);
      toast({
        title: "Erro",
        description: "Não foi possível marcar a dívida como paga.",
        variant: "destructive",
      });
    } finally {
      setMarkingPaid(null);
    }
  };

  useEffect(() => {
    fetchDebts();

    const channel = supabase
      .channel('debts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'debts',
          filter: `profile_id=eq.${profileId}`
        },
        () => fetchDebts()
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
          <AlertCircle className="h-5 w-5" />
          Próximas Dívidas
        </CardTitle>
        <AddDebtDialog profileId={profileId} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground">Carregando...</div>
        ) : debts.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma dívida próxima</p>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => {
              const urgency = getUrgencyInfo(debt.due_date);
              const UrgencyIcon = urgency.icon;
              const recurrenceLabel = getRecurrenceLabel(debt.recurrence);
              
              return (
                <div 
                  key={debt.id} 
                  className={`p-3 rounded-lg border ${
                    urgency.level === 'overdue' || urgency.level === 'critical' 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : urgency.level === 'warning'
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <UrgencyIcon className={`h-4 w-4 mt-0.5 shrink-0 ${
                        urgency.level === 'overdue' || urgency.level === 'critical' 
                          ? 'text-destructive' 
                          : urgency.level === 'warning'
                          ? 'text-orange-500'
                          : 'text-muted-foreground'
                      }`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{debt.creditor}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <p className="text-xs text-muted-foreground">
                            {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                          </p>
                          {recurrenceLabel && (
                            <Badge variant="outline" className="text-[10px] gap-0.5 h-4 px-1">
                              <RefreshCw className="h-2.5 w-2.5" />
                              {recurrenceLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="secondary" className={`${urgency.color} text-xs px-1.5`}>
                        {urgency.label}
                      </Badge>
                      <span className="font-bold text-sm whitespace-nowrap">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(debt.principal))}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleMarkAsPaid(debt)}
                        disabled={markingPaid === debt.id}
                        title="Marcar como paga"
                      >
                        {markingPaid === debt.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        )}
                      </Button>
                    </div>
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
