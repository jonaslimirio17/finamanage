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

interface AddDebtDialogProps {
  profileId: string;
}

export const AddDebtDialog = ({ profileId }: AddDebtDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [form, setForm] = useState({
    creditor: "",
    principal: "",
    interest_rate: "",
    due_date: "",
    recurrence: "none",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.creditor || !form.principal) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o credor e o valor.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('debts').insert({
        profile_id: profileId,
        creditor: form.creditor,
        principal: parseFloat(form.principal),
        interest_rate: form.interest_rate ? parseFloat(form.interest_rate) : null,
        due_date: form.due_date || null,
        recurrence: form.recurrence === "none" ? null : form.recurrence,
        status: 'active',
      });

      if (error) throw error;

      const recurrenceMessage = form.recurrence !== "none" 
        ? ` Esta dívida se repete ${form.recurrence === 'monthly' ? 'mensalmente' : form.recurrence === 'weekly' ? 'semanalmente' : 'anualmente'}.`
        : "";

      toast({
        title: "Dívida cadastrada!",
        description: form.due_date 
          ? `Você será notificado uma semana antes do vencimento.${recurrenceMessage}`
          : `Dívida adicionada com sucesso.${recurrenceMessage}`,
      });

      setForm({ creditor: "", principal: "", interest_rate: "", due_date: "", recurrence: "none" });
      setOpen(false);
    } catch (error: any) {
      console.error('Error adding debt:', error);
      toast({
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível cadastrar a dívida.",
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
          Adicionar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova Dívida</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="creditor">Credor *</Label>
            <Input
              id="creditor"
              placeholder="Ex: Banco, Cartão, Empréstimo..."
              value={form.creditor}
              onChange={(e) => setForm(prev => ({ ...prev, creditor: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="principal">Valor (R$) *</Label>
              <Input
                id="principal"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.principal}
                onChange={(e) => setForm(prev => ({ ...prev, principal: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interest_rate">Juros (% ao mês)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.interest_rate}
                onChange={(e) => setForm(prev => ({ ...prev, interest_rate: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Vencimento</Label>
              <Input
                id="due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => setForm(prev => ({ ...prev, due_date: e.target.value }))}
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
            Você será notificado 7 dias antes do vencimento. Dívidas recorrentes geram nova cobrança automaticamente ao serem pagas.
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
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
