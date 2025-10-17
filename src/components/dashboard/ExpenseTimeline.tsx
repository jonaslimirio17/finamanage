import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TimelineData {
  date: string;
  amount: number;
}

export const ExpenseTimeline = ({ profileId }: { profileId: string }) => {
  const [data, setData] = useState<TimelineData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('profile_id', profileId)
        .eq('type', 'expense')
        .gte('date', ninetyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (!error && transactions) {
        const grouped = transactions.reduce((acc, txn) => {
          const date = txn.date;
          acc[date] = (acc[date] || 0) + Math.abs(Number(txn.amount));
          return acc;
        }, {} as Record<string, number>);

        const chartData = Object.entries(grouped).map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          amount
        }));

        setData(chartData);
      }
      setLoading(false);
    };

    fetchData();
  }, [profileId]);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Despesas Diárias (90 dias)</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[300px] flex items-center justify-center">Carregando...</div>
        ) : data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip
                formatter={(value: number) =>
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(value)
                }
              />
              <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
