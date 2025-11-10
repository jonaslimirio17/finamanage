import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Eye, Trash2, CheckCircle, Clock, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface ReceiptHistoryProps {
  userId: string;
}

interface Receipt {
  id: string;
  file_path: string;
  extracted_data: any;
  status: string;
  created_at: string;
}

export const ReceiptHistory = ({ userId }: ReceiptHistoryProps) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadReceipts();
  }, [userId]);

  const loadReceipts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipt_uploads')
        .select('*')
        .eq('profile_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReceipts(data || []);
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar os comprovantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('receipt_uploads')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;

      setReceipts(receipts.filter(r => r.id !== deleteId));
      toast({
        title: "Comprovante excluído",
        description: "O comprovante foi removido com sucesso",
      });
    } catch (error) {
      console.error('Error deleting receipt:', error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o comprovante",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", variant: "secondary" as const, icon: Clock },
      pending_confirmation: { label: "Aguardando Confirmação", variant: "default" as const, icon: Clock },
      confirmed: { label: "Confirmado", variant: "default" as const, icon: CheckCircle },
      rejected: { label: "Rejeitado", variant: "destructive" as const, icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            Carregando histórico...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (receipts.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Nenhum comprovante enviado ainda
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Envie uma foto de comprovante pelo WhatsApp para começar
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Comprovantes</CardTitle>
          <CardDescription>
            {receipts.length} comprovante{receipts.length !== 1 ? 's' : ''} processado{receipts.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {receipts.map((receipt) => (
              <div
                key={receipt.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-4 flex-1">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {receipt.extracted_data?.merchant || 'Comprovante'}
                      </span>
                      {getStatusBadge(receipt.status)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground space-y-1">
                      {receipt.extracted_data?.amount && (
                        <p>Valor: R$ {receipt.extracted_data.amount}</p>
                      )}
                      {receipt.extracted_data?.date && (
                        <p>Data: {format(new Date(receipt.extracted_data.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                      )}
                      {receipt.extracted_data?.category && (
                        <p>Categoria: {receipt.extracted_data.category}</p>
                      )}
                      <p className="text-xs">
                        Enviado em {format(new Date(receipt.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteId(receipt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comprovante?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O comprovante será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};