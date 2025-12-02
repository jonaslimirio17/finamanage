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
  monthly: { value: 14.90, label: 'R$ 14,90/mês', cycle: 'MONTHLY' },
  semiannual: { value: 77.40, label: 'R$ 77,40 a cada 6 meses (R$ 12,90/mês)', cycle: 'SEMIANNUAL' },
  annual: { value: 130.80, label: 'R$ 130,80 por ano (R$ 10,90/mês)', cycle: 'YEARLY' },
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
