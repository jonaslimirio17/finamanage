import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, Clock } from "lucide-react";
import { AddDebtDialog } from "./AddDebtDialog";

interface Debt {
  id: string;
  creditor: string;
  principal: number;
  due_date: string;
  status: string;
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

export const UpcomingDebts = ({ profileId }: { profileId: string }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDebts = async () => {
    const today = new Date();
    today.setDate(today.getDate() - 1); // Include overdue by 1 day
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
      setDebts(data);
    }
    setLoading(false);
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
              
              return (
                <div 
                  key={debt.id} 
                  className={`flex justify-between items-center p-3 rounded-lg border ${
                    urgency.level === 'overdue' || urgency.level === 'critical' 
                      ? 'border-destructive/50 bg-destructive/5' 
                      : urgency.level === 'warning'
                      ? 'border-orange-500/50 bg-orange-500/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <UrgencyIcon className={`h-4 w-4 ${
                      urgency.level === 'overdue' || urgency.level === 'critical' 
                        ? 'text-destructive' 
                        : urgency.level === 'warning'
                        ? 'text-orange-500'
                        : 'text-muted-foreground'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{debt.creditor}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={urgency.color}>
                      {urgency.label}
                    </Badge>
                    <span className="font-bold text-sm">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(Number(debt.principal))}
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
