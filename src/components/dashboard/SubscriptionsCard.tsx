import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CreditCard, AlertCircle, Calendar } from "lucide-react";
import { format, differenceInDays, parseISO, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DetectedSubscription {
  merchant: string;
  avgAmount: number;
  frequency: 'mensal' | 'semanal' | 'quinzenal';
  lastCharge: string;
  nextEstimatedCharge: string;
  occurrences: number;
  category: string | null;
}

interface SubscriptionsCardProps {
  profileId: string;
}

export const SubscriptionsCard = ({ profileId }: SubscriptionsCardProps) => {
  const [subscriptions, setSubscriptions] = useState<DetectedSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMonthly, setTotalMonthly] = useState(0);

  useEffect(() => {
    const detectSubscriptions = async () => {
      setLoading(true);
      try {
        // Fetch transactions from the last 90 days
        const ninetyDaysAgo = subDays(new Date(), 90).toISOString().split('T')[0];
        
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('profile_id', profileId)
          .eq('type', 'debit')
          .gte('date', ninetyDaysAgo)
          .order('date', { ascending: true });

        if (error) throw error;

        // Group transactions by merchant
        const merchantGroups: Record<string, typeof transactions> = {};
        
        transactions?.forEach(tx => {
          const merchant = tx.merchant?.toLowerCase().trim() || tx.raw_description?.toLowerCase().trim();
          if (merchant) {
            if (!merchantGroups[merchant]) {
              merchantGroups[merchant] = [];
            }
            merchantGroups[merchant].push(tx);
          }
        });

        // Analyze each merchant for recurring patterns
        const detected: DetectedSubscription[] = [];

        Object.entries(merchantGroups).forEach(([merchant, txs]) => {
          if (txs.length < 2) return; // Need at least 2 transactions to detect pattern

          // Sort by date
          const sorted = txs.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          // Calculate intervals between transactions
          const intervals: number[] = [];
          for (let i = 1; i < sorted.length; i++) {
            const days = differenceInDays(
              parseISO(sorted[i].date),
              parseISO(sorted[i - 1].date)
            );
            intervals.push(days);
          }

          if (intervals.length === 0) return;

          // Calculate average interval
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

          // Determine frequency based on interval
          let frequency: 'mensal' | 'semanal' | 'quinzenal' | null = null;
          
          if (avgInterval >= 25 && avgInterval <= 35) {
            frequency = 'mensal';
          } else if (avgInterval >= 6 && avgInterval <= 8) {
            frequency = 'semanal';
          } else if (avgInterval >= 13 && avgInterval <= 17) {
            frequency = 'quinzenal';
          }

          if (!frequency) return; // Not a recognized pattern

          // Check if amounts are consistent (within 20% variance)
          const amounts = sorted.map(tx => Math.abs(tx.amount));
          const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
          const variance = amounts.every(
            amt => Math.abs(amt - avgAmount) / avgAmount <= 0.2
          );

          if (!variance) return; // Amounts too different

          // Calculate next estimated charge
          const lastCharge = sorted[sorted.length - 1].date;
          const daysToAdd = frequency === 'mensal' ? 30 : frequency === 'quinzenal' ? 15 : 7;
          const nextDate = new Date(lastCharge);
          nextDate.setDate(nextDate.getDate() + daysToAdd);

          detected.push({
            merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
            avgAmount: Math.round(avgAmount * 100) / 100,
            frequency,
            lastCharge,
            nextEstimatedCharge: nextDate.toISOString().split('T')[0],
            occurrences: sorted.length,
            category: sorted[sorted.length - 1].category
          });
        });

        // Sort by amount descending
        detected.sort((a, b) => b.avgAmount - a.avgAmount);
        
        setSubscriptions(detected);
        
        // Calculate total monthly cost
        const monthly = detected.reduce((total, sub) => {
          if (sub.frequency === 'mensal') return total + sub.avgAmount;
          if (sub.frequency === 'quinzenal') return total + (sub.avgAmount * 2);
          if (sub.frequency === 'semanal') return total + (sub.avgAmount * 4);
          return total;
        }, 0);
        setTotalMonthly(Math.round(monthly * 100) / 100);

      } catch (error) {
        console.error('Error detecting subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      detectSubscriptions();
    }

    // Subscribe to transaction changes
    const channel = supabase
      .channel('subscriptions-detection')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${profileId}`,
        },
        () => {
          detectSubscriptions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getFrequencyBadge = (frequency: string) => {
    const colors = {
      mensal: 'bg-primary/10 text-primary',
      semanal: 'bg-orange-500/10 text-orange-600',
      quinzenal: 'bg-purple-500/10 text-purple-600'
    };
    return colors[frequency as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const isUpcoming = (nextCharge: string) => {
    const days = differenceInDays(parseISO(nextCharge), new Date());
    return days >= 0 && days <= 7;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <RefreshCw className="h-5 w-5 animate-spin" />
            Detectando assinaturas...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (subscriptions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Assinaturas Recorrentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Nenhuma assinatura recorrente detectada nos últimos 90 dias.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Assinaturas Recorrentes
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {subscriptions.length} detectada{subscriptions.length > 1 ? 's' : ''}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Gasto mensal estimado: <span className="font-semibold text-foreground">{formatCurrency(totalMonthly)}</span>
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {subscriptions.map((sub, index) => (
            <div 
              key={index} 
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">{sub.merchant}</span>
                  <Badge className={`text-[10px] px-1.5 py-0 ${getFrequencyBadge(sub.frequency)}`}>
                    {sub.frequency}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{sub.occurrences} cobranças</span>
                  {sub.category && (
                    <span className="truncate">• {sub.category}</span>
                  )}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <div className="font-semibold text-destructive">
                  {formatCurrency(sub.avgAmount)}
                </div>
                {isUpcoming(sub.nextEstimatedCharge) && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>
                      {format(parseISO(sub.nextEstimatedCharge), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
                {!isUpcoming(sub.nextEstimatedCharge) && (
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>
                      {format(parseISO(sub.nextEstimatedCharge), "dd/MM", { locale: ptBR })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
