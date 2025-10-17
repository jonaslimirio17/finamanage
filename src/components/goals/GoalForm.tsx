import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface GoalFormProps {
  profileId: string;
  goal?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export const GoalForm = ({ profileId, goal, onSuccess, onCancel }: GoalFormProps) => {
  const [title, setTitle] = useState(goal?.title || "");
  const [targetAmount, setTargetAmount] = useState(goal?.target_amount || "");
  const [currentAmount, setCurrentAmount] = useState(goal?.current_amount || "");
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    goal?.target_date ? new Date(goal.target_date) : undefined
  );
  const [monthlyContribution, setMonthlyContribution] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const goalData = {
        profile_id: profileId,
        title,
        target_amount: parseFloat(targetAmount),
        current_amount: parseFloat(currentAmount) || 0,
        target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
        status: "active",
      };

      if (goal) {
        // Update existing goal
        const { error } = await supabase
          .from('goals')
          .update(goalData)
          .eq('id', goal.id);

        if (error) throw error;

        // Log event
        await supabase.from('events_logs').insert({
          profile_id: profileId,
          event_type: 'goal_updated',
          payload: { goal_id: goal.id, title },
        });

        toast({
          title: "Meta atualizada",
          description: "Sua meta foi atualizada com sucesso!",
        });
      } else {
        // Create new goal
        const { error } = await supabase
          .from('goals')
          .insert(goalData);

        if (error) throw error;

        // Log event
        await supabase.from('events_logs').insert({
          profile_id: profileId,
          event_type: 'goal_created',
          payload: { title },
        });

        toast({
          title: "Meta criada",
          description: "Sua meta foi criada com sucesso!",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving goal:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar meta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Título da Meta</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Viagem para Europa"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetAmount">Valor Alvo (R$)</Label>
          <Input
            id="targetAmount"
            type="number"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <Label htmlFor="currentAmount">Valor Atual (R$)</Label>
          <Input
            id="currentAmount"
            type="number"
            step="0.01"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label>Data Alvo</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !targetDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {targetDate ? format(targetDate, "dd/MM/yyyy") : "Selecione uma data"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={targetDate}
              onSelect={setTargetDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <Label htmlFor="monthlyContribution">Aporte Mensal (Opcional - R$)</Label>
        <Input
          id="monthlyContribution"
          type="number"
          step="0.01"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          placeholder="0.00"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Este valor é apenas para simulação
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Salvando..." : goal ? "Atualizar" : "Criar Meta"}
        </Button>
      </div>
    </form>
  );
};
