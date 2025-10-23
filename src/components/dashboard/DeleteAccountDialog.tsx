import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2 } from "lucide-react";

export function DeleteAccountDialog() {
  const [password, setPassword] = useState("");
  const [reason, setReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleDeleteAccount = async () => {
    if (!password) {
      toast({
        title: "Senha obrigatória",
        description: "Por favor, insira sua senha para confirmar a exclusão.",
        variant: "destructive",
      });
      return;
    }

    setIsDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: { 
          password,
          reason: reason || undefined
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) {
        console.error('Error deleting account:', error);
        toast({
          title: "Erro ao deletar conta",
          description: error.message || "Ocorreu um erro ao tentar deletar sua conta.",
          variant: "destructive",
        });
        return;
      }

      if (data?.error) {
        toast({
          title: "Erro ao deletar conta",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast({
        title: "Conta deletada com sucesso",
        description: "Sua conta e todos os dados associados foram removidos.",
      });

      navigate("/");
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setOpen(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Deletar Conta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-destructive">
            Deletar Conta Permanentemente
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p className="font-semibold text-foreground">
              Esta ação é irreversível. Todos os seus dados serão permanentemente removidos:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Perfil e informações pessoais</li>
              <li>Contas bancárias conectadas</li>
              <li>Histórico de transações</li>
              <li>Metas financeiras</li>
              <li>Notificações e logs</li>
            </ul>
            <p className="text-muted-foreground text-sm">
              Para confirmar, digite sua senha abaixo:
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="password">Senha *</Label>
            <PasswordInput
              id="password"
              placeholder="Digite sua senha"
              value={password}
              onChange={setPassword}
              disabled={isDeleting}
              showRequirements={false}
              showStrengthBar={false}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Nos ajude a melhorar: por que você está deletando sua conta?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isDeleting}
              rows={3}
            />
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDeleteAccount();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deletando..." : "Confirmar Exclusão"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
