import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Debt {
  id: string;
  creditor: string;
  principal: number;
  due_date: string;
  status: string;
}

export const UpcomingDebts = ({ profileId }: { profileId: string }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDebts = async () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('profile_id', profileId)
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Próximas Dívidas (30 dias)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Carregando...</div>
        ) : debts.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma dívida próxima</p>
        ) : (
          <div className="space-y-3">
            {debts.map((debt) => (
              <div key={debt.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{debt.creditor}</p>
                  <p className="text-sm text-muted-foreground">
                    Vencimento: {new Date(debt.due_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <p className="font-bold">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(Number(debt.principal))}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
