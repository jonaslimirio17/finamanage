import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Goal {
  id: string;
  title: string;
  current_amount: number;
  target_amount: number;
  target_date: string;
}

interface GoalSimulatorProps {
  goal: Goal;
  onClose: () => void;
}

export const GoalSimulator = ({ goal, onClose }: GoalSimulatorProps) => {
  const [monthlyContribution, setMonthlyContribution] = useState("");
  
  const today = new Date();
  const targetDate = new Date(goal.target_date);
  const monthsLeft = Math.max(
    Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)),
    1
  );
  
  const remaining = Number(goal.target_amount) - Number(goal.current_amount);
  const requiredMonthly = remaining / monthsLeft;
  
  // Alternative scenario
  const contribution = parseFloat(monthlyContribution) || 0;
  const monthsToGoal = contribution > 0 ? Math.ceil(remaining / contribution) : 0;
  const alternativeDate = new Date(today);
  alternativeDate.setMonth(alternativeDate.getMonth() + monthsToGoal);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cenário Atual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Faltam:</span>
            <span className="font-medium">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(remaining)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Meses restantes:</span>
            <span className="font-medium">{monthsLeft} meses</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Aporte mensal necessário:</span>
            <span className="font-bold text-primary">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(requiredMonthly)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label htmlFor="simulation">Simular Aporte Mensal (R$)</Label>
        <Input
          id="simulation"
          type="number"
          step="0.01"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
          placeholder="Digite um valor para simular"
        />
      </div>

      {contribution > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cenário Alternativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Aporte mensal:</span>
              <span className="font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(contribution)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tempo estimado:</span>
              <span className="font-medium">{monthsToGoal} meses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nova data estimada:</span>
              <span className="font-medium">
                {alternativeDate.toLocaleDateString('pt-BR')}
              </span>
            </div>
            {contribution < requiredMonthly && (
              <p className="text-sm text-amber-600 mt-2">
                ⚠️ Este aporte não é suficiente para atingir a meta na data planejada
              </p>
            )}
            {contribution >= requiredMonthly && alternativeDate < targetDate && (
              <p className="text-sm text-green-600 mt-2">
                ✓ Com este aporte, você atingirá a meta antes da data planejada!
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose}>Fechar</Button>
      </div>
    </div>
  );
};
