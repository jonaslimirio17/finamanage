import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Loader2 } from "lucide-react";

interface AddContributionDialogProps {
  goal: {
    id: string;
    title: string;
    current_amount: number;
    target_amount: number;
  };
  profileId: string;
  onSuccess?: () => void;
}

export const AddContributionDialog = ({ goal, profileId, onSuccess }: AddContributionDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const { toast } = useToast();

  const remaining = Number(goal.target_amount) - Number(goal.current_amount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Informe um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const contributionValue = parseFloat(amount);
      const newAmount = Number(goal.current_amount) + contributionValue;

      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goal.id);

      if (error) throw error;

      await supabase.from('events_logs').insert({
        profile_id: profileId,
        event_type: 'goal_contribution',
        payload: { 
          goal_id: goal.id, 
          title: goal.title,
          contribution: contributionValue,
          new_total: newAmount,
        },
      });

      const progress = (newAmount / Number(goal.target_amount)) * 100;

      toast({
        title: "Aporte registrado!",
        description: progress >= 100 
          ? `Parabéns! Você atingiu sua meta "${goal.title}"!`
          : `Progresso atualizado para ${progress.toFixed(0)}%.`,
      });

      setAmount("");
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding contribution:', error);
      toast({
        title: "Erro ao registrar",
        description: error.message || "Não foi possível registrar o aporte.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" title="Adicionar aporte">
          <PlusCircle className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar Aporte</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="font-medium">{goal.title}</p>
            <p className="text-sm text-muted-foreground">
              Faltam {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(remaining)} para a meta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor do Aporte (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount((remaining * 0.1).toFixed(2))}
            >
              10%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount((remaining * 0.25).toFixed(2))}
            >
              25%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount((remaining * 0.5).toFixed(2))}
            >
              50%
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setAmount(remaining.toFixed(2))}
            >
              100%
            </Button>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Registrar Aporte"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
