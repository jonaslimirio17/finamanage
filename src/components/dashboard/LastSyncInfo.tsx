import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RefreshCw } from "lucide-react";

export const LastSyncInfo = ({ profileId }: { profileId: string }) => {
  const [lastSync, setLastSync] = useState<string | null>(null);

  const fetchLastSync = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('last_sync')
      .eq('profile_id', profileId)
      .order('last_sync', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data?.last_sync) {
      setLastSync(data.last_sync);
    }
  };

  useEffect(() => {
    fetchLastSync();

    const channel = supabase
      .channel('accounts-sync-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'accounts',
          filter: `profile_id=eq.${profileId}`
        },
        () => fetchLastSync()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  if (!lastSync) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <RefreshCw className="h-4 w-4" />
      <span>
        Dados atualizados em {new Date(lastSync).toLocaleString('pt-BR')}
      </span>
    </div>
  );
};
