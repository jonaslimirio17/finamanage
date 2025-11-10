import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, FileText, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface WhatsAppStatsProps {
  userId: string;
}

export const WhatsAppStats = ({ userId }: WhatsAppStatsProps) => {
  const [stats, setStats] = useState({
    totalReceipts: 0,
    confirmedReceipts: 0,
    pendingReceipts: 0,
    totalMessages: 0,
    confirmationRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      // Get receipt stats
      const { data: receipts, error: receiptsError } = await supabase
        .from('receipt_uploads')
        .select('status')
        .eq('profile_id', userId);

      if (receiptsError) throw receiptsError;

      const totalReceipts = receipts?.length || 0;
      const confirmedReceipts = receipts?.filter(r => r.status === 'confirmed').length || 0;
      const pendingReceipts = receipts?.filter(r => r.status === 'pending_confirmation').length || 0;
      const confirmationRate = totalReceipts > 0 ? Math.round((confirmedReceipts / totalReceipts) * 100) : 0;

      // Get session stats (messages count)
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('context')
        .eq('profile_id', userId)
        .maybeSingle();

      const totalMessages = (session?.context as any)?.messageCount || 0;

      setStats({
        totalReceipts,
        confirmedReceipts,
        pendingReceipts,
        totalMessages,
        confirmationRate,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total de Comprovantes",
      value: stats.totalReceipts,
      icon: FileText,
      description: "Enviados via WhatsApp",
      color: "text-blue-500",
    },
    {
      title: "Comprovantes Confirmados",
      value: stats.confirmedReceipts,
      icon: CheckCircle,
      description: "Transações registradas",
      color: "text-green-500",
    },
    {
      title: "Aguardando Confirmação",
      value: stats.pendingReceipts,
      icon: Clock,
      description: "Necessitam ação",
      color: "text-yellow-500",
    },
    {
      title: "Taxa de Confirmação",
      value: `${stats.confirmationRate}%`,
      icon: TrendingUp,
      description: "Comprovantes aceitos",
      color: "text-purple-500",
    },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Carregando estatísticas...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Dicas para Melhorar</CardTitle>
          <CardDescription>
            Otimize o uso do bot WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Tire fotos nítidas</p>
              <p className="text-xs text-muted-foreground">
                Comprovantes com boa qualidade têm maior precisão no OCR
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <CheckCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Confirme rapidamente</p>
              <p className="text-xs text-muted-foreground">
                Responda aos pedidos de confirmação logo após enviar comprovantes
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Use comandos regularmente</p>
              <p className="text-xs text-muted-foreground">
                Acompanhe seu saldo e gastos pelo WhatsApp com os comandos disponíveis
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};