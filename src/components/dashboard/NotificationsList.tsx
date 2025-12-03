import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, Target, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: string;
  title: string;
  summary: string;
  cta: string | null;
  is_read: boolean;
  created_at: string;
}

export const NotificationsList = ({ profileId }: { profileId: string }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("profile_id", profileId)
        .eq("is_read", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`
        },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const handleDismiss = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      toast({
        title: "Notificação marcada como lida",
      });
    } catch (error: any) {
      console.error("Error dismissing notification:", error);
      toast({
        title: "Erro ao marcar notificação",
        variant: "destructive",
      });
    }
  };

  const handleCTA = (notification: Notification) => {
    // Handle different CTAs based on notification type
    if (notification.type === "debt_alert") {
      // Navigate to debts/plan page
      window.location.href = "/dashboard#debts";
    } else if (notification.type === "goal_risk") {
      // Navigate to goals simulation
      window.location.href = "/goals";
    } else if (notification.type === "high_spending") {
      // Show tips or navigate to insights
      window.location.href = "/dashboard#insights";
    }
    
    handleDismiss(notification.id);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "debt_alert":
        return <AlertCircle className="h-5 w-5" />;
      case "goal_risk":
        return <Target className="h-5 w-5" />;
      case "high_spending":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <AlertCircle className="h-5 w-5" />;
    }
  };

  const getVariant = (type: string): "default" | "destructive" => {
    return type === "debt_alert" ? "destructive" : "default";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma notificação no momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notificações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {notifications.map((notification) => (
          <Alert key={notification.id} variant={getVariant(notification.type)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex gap-3 flex-1">
                {getIcon(notification.type)}
                <div className="flex-1 space-y-1">
                  <AlertTitle className="text-sm font-semibold">
                    {notification.title}
                  </AlertTitle>
                  <AlertDescription className="text-sm">
                    {notification.summary}
                  </AlertDescription>
                  {notification.cta && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => handleCTA(notification)}
                    >
                      {notification.cta}
                    </Button>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0"
                onClick={() => handleDismiss(notification.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
};
