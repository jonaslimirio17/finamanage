import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreditCardForm } from "./CreditCardForm";
import { PixPayment } from "./PixPayment";
import type { PlanType } from "@/pages/Plans";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: PlanType;
}

const planDetails = {
  monthly: { value: 19.90, label: 'R$ 19,90/mês', cycle: 'MONTHLY' },
  quarterly: { value: 49.90, label: 'R$ 49,90 a cada 3 meses (R$ 16,63/mês)', cycle: 'QUARTERLY' },
  semiannual: { value: 89.90, label: 'R$ 89,90 a cada 6 meses (R$ 14,98/mês)', cycle: 'SEMIANNUAL' },
  annual: { value: 149.90, label: 'R$ 149,90 por ano (R$ 12,49/mês)', cycle: 'YEARLY' },
};

export const CheckoutModal = ({ open, onOpenChange, planType }: CheckoutModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("credit_card");
  const plan = planDetails[planType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Assinar Premium</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <p className="text-muted-foreground">
            Escolha a forma de pagamento para sua assinatura: <strong>{plan.label}</strong>
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="credit_card">Cartão de Crédito</TabsTrigger>
            <TabsTrigger value="pix">PIX</TabsTrigger>
          </TabsList>

          <TabsContent value="credit_card" className="mt-6">
            <CreditCardForm 
              onSuccess={() => onOpenChange(false)}
              planType={planType}
            />
          </TabsContent>

          <TabsContent value="pix" className="mt-6">
            <PixPayment 
              onSuccess={() => onOpenChange(false)}
              planType={planType}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
