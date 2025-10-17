import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export const BalanceCard = ({ profileId }: { profileId: string }) => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalance = async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('balance')
        .eq('profile_id', profileId);

      if (!error && data) {
        const total = data.reduce((sum, account) => sum + Number(account.balance), 0);
        setBalance(total);
      }
      setLoading(false);
    };

    fetchBalance();
  }, [profileId]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Saldo Consolidado</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold">Carregando...</div>
        ) : (
          <div className="text-2xl font-bold">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(balance)}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
