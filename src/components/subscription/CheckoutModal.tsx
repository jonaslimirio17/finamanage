import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCardForm } from "./CreditCardForm";
import { PixPayment } from "./PixPayment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag, CheckCircle, XCircle } from "lucide-react";
import type { PlanType } from "@/pages/Plans";

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planType: PlanType;
}

interface CouponData {
  valid: boolean;
  prize?: string;
  discountType?: string;
  message: string;
  expiresIn?: number;
}

const planDetails = {
  monthly: { value: 19.90, label: 'R$ 19,90/mês', cycle: 'MONTHLY' },
  semiannual: { value: 89.90, label: 'R$ 89,90 a cada 6 meses (R$ 14,98/mês)', cycle: 'SEMIANNUAL' },
  annual: { value: 149.90, label: 'R$ 149,90 por ano (R$ 12,49/mês)', cycle: 'YEARLY' },
};

const getDiscountDescription = (discountType: string): string => {
  const descriptions: Record<string, string> = {
    free_months_1: '1 mês grátis - Primeira cobrança em 30 dias',
    free_months_2: '2 meses grátis - Primeira cobrança em 60 dias',
    free_months_3: '3 meses grátis - Primeira cobrança em 90 dias',
    percent_30_6m: '30% de desconto nos primeiros 6 meses',
    percent_50_6m: '50% de desconto nos primeiros 6 meses',
  };
  return descriptions[discountType] || discountType;
};

export const CheckoutModal = ({ open, onOpenChange, planType }: CheckoutModalProps) => {
  const [activeTab, setActiveTab] = useState<string>("credit_card");
  const [couponCode, setCouponCode] = useState("");
  const [couponData, setCouponData] = useState<CouponData | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const { toast } = useToast();
  const plan = planDetails[planType];

  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Código vazio",
        description: "Digite o código do cupom",
        variant: "destructive",
      });
      return;
    }

    setValidatingCoupon(true);
    setCouponData(null);

    try {
      const { data, error } = await supabase.functions.invoke('validate-coupon', {
        body: { couponCode: couponCode.trim() },
      });

      if (error) throw error;

      setCouponData(data);

      if (data.valid) {
        toast({
          title: "Cupom aplicado!",
          description: data.message,
        });
      } else {
        toast({
          title: "Cupom inválido",
          description: data.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating coupon:", error);
      toast({
        title: "Erro",
        description: "Erro ao validar cupom. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode("");
    setCouponData(null);
  };

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

        {/* Coupon Input */}
        <div className="space-y-3 mb-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Tag className="h-4 w-4" />
            Tem um cupom de desconto?
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código (ex: FEIRA-ABC123)"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              disabled={couponData?.valid}
              className="uppercase"
            />
            {couponData?.valid ? (
              <Button variant="outline" onClick={removeCoupon}>
                Remover
              </Button>
            ) : (
              <Button onClick={validateCoupon} disabled={validatingCoupon}>
                {validatingCoupon ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Aplicar"
                )}
              </Button>
            )}
          </div>

          {/* Coupon Status */}
          {couponData && (
            <div className={`flex items-start gap-2 p-3 rounded-md ${
              couponData.valid 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-destructive/10 border border-destructive/20'
            }`}>
              {couponData.valid ? (
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`font-medium ${couponData.valid ? 'text-green-600' : 'text-destructive'}`}>
                  {couponData.message}
                </p>
                {couponData.valid && couponData.discountType && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {getDiscountDescription(couponData.discountType)}
                  </p>
                )}
                {couponData.valid && couponData.expiresIn && (
                  <Badge variant="secondary" className="mt-2">
                    Expira em {couponData.expiresIn} dias
                  </Badge>
                )}
              </div>
            </div>
          )}
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
              couponCode={couponData?.valid ? couponCode : undefined}
              discountType={couponData?.valid ? couponData.discountType : undefined}
            />
          </TabsContent>

          <TabsContent value="pix" className="mt-6">
            <PixPayment 
              onSuccess={() => onOpenChange(false)}
              planType={planType}
              couponCode={couponData?.valid ? couponCode : undefined}
              discountType={couponData?.valid ? couponData.discountType : undefined}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
