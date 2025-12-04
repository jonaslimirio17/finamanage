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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";

interface AddGoalDialogProps {
  profileId: string;
}

export const AddGoalDialog = ({ profileId }: AddGoalDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    title: "",
    target_amount: "",
    current_amount: "",
    target_date: "",
    recurrence: "none",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title || !form.target_amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e o valor alvo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('goals').insert({
        profile_id: profileId,
        title: form.title,
        target_amount: parseFloat(form.target_amount),
        current_amount: form.current_amount ? parseFloat(form.current_amount) : 0,
        target_date: form.target_date || null,
        recurrence: form.recurrence === "none" ? null : form.recurrence,
        status: 'active',
      });

      if (error) throw error;

      await supabase.from('events_logs').insert({
        profile_id: profileId,
        event_type: 'goal_created',
        payload: { title: form.title },
      });

      toast({
        title: "Meta criada!",
        description: form.recurrence !== "none" 
          ? "Meta recorrente criada com sucesso."
          : "Meta criada com sucesso.",
      });

      setForm({ title: "", target_amount: "", current_amount: "", target_date: "", recurrence: "none" });
      setOpen(false);
    } catch (error: any) {
      console.error('Error adding goal:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível criar a meta.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1">
          <Plus className="h-4 w-4" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              placeholder="Ex: Viagem, Reserva de emergência..."
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_amount">Valor Alvo (R$) *</Label>
              <Input
                id="target_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.target_amount}
                onChange={(e) => setForm(prev => ({ ...prev, target_amount: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_amount">Valor Atual (R$)</Label>
              <Input
                id="current_amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.current_amount}
                onChange={(e) => setForm(prev => ({ ...prev, current_amount: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_date">Data Alvo</Label>
              <Input
                id="target_date"
                type="date"
                value={form.target_date}
                onChange={(e) => setForm(prev => ({ ...prev, target_date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recurrence">Recorrência</Label>
              <Select 
                value={form.recurrence} 
                onValueChange={(value) => setForm(prev => ({ ...prev, recurrence: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Única vez</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="yearly">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Metas recorrentes reiniciam automaticamente ao serem concluídas.
          </p>

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
                "Criar Meta"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
