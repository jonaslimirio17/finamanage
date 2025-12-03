import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Loader2, Gift } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
  holderName: z.string().min(3, "Nome do titular é obrigatório"),
  number: z.string().regex(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/, "Número do cartão inválido"),
  expiryMonth: z.string().regex(/^\d{2}$/, "Mês inválido"),
  expiryYear: z.string().regex(/^\d{2}$/, "Ano inválido"),
  ccv: z.string().regex(/^\d{3,4}$/, "CVV inválido"),
});

type FormData = z.infer<typeof formSchema>;

interface CreditCardFormProps {
  onSuccess: () => void;
  planType: 'monthly' | 'semiannual' | 'annual';
  couponCode?: string;
  discountType?: string;
}

const planDetails = {
  monthly: { value: 19.90, label: 'R$ 19,90/mês', cycle: 'MONTHLY' },
  semiannual: { value: 89.90, label: 'R$ 89,90/semestre', cycle: 'SEMIANNUAL' },
  annual: { value: 149.90, label: 'R$ 149,90/ano', cycle: 'YEARLY' },
};

const getDiscountLabel = (discountType: string): string => {
  const labels: Record<string, string> = {
    free_months_1: '🎁 1 mês grátis aplicado',
    free_months_2: '🎁 2 meses grátis aplicado',
    free_months_3: '🎁 3 meses grátis aplicado',
    percent_30_6m: '🏷️ 30% off por 6 meses',
    percent_50_6m: '🏷️ 50% off por 6 meses',
  };
  return labels[discountType] || '';
};

export const CreditCardForm = ({ onSuccess, planType, couponCode, discountType }: CreditCardFormProps) => {
  const plan = planDetails[planType];
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
      holderName: "",
      number: "",
      expiryMonth: "",
      expiryYear: "",
      ccv: "",
    },
  });

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4,5})(\d{4})/, "$1-$2");
  };

  const formatCardNumber = (value: string) => {
    return value
      .replace(/\D/g, "")
      .replace(/(\d{4})(?=\d)/g, "$1 ")
      .trim();
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: {
          payment_method: 'CREDIT_CARD',
          cycle: plan.cycle,
          value: plan.value,
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          creditCard: {
            holderName: data.holderName,
            number: data.number.replace(/\s/g, ''),
            expiryMonth: data.expiryMonth,
            expiryYear: data.expiryYear,
            ccv: data.ccv,
          },
          couponCode,
          discountType,
        },
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Sucesso!",
        description: couponCode 
          ? "Sua assinatura Premium foi ativada com o cupom aplicado." 
          : "Sua assinatura Premium foi ativada.",
      });

      onSuccess();
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao processar pagamento. Verifique os dados do cartão.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Coupon Badge */}
        {discountType && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Gift className="h-5 w-5 text-green-500" />
            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
              {getDiscountLabel(discountType)}
            </Badge>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="João Silva" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input
                    placeholder="000.000.000-00"
                    {...field}
                    onChange={(e) => field.onChange(formatCPF(e.target.value))}
                    maxLength={14}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="(11) 98765-4321"
                    {...field}
                    onChange={(e) => field.onChange(formatPhone(e.target.value))}
                    maxLength={15}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="seu@email.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4 mt-4">
          <h3 className="font-semibold mb-4">Dados do Cartão</h3>

          <FormField
            control={form.control}
            name="holderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome no Cartão</FormLabel>
                <FormControl>
                  <Input placeholder="JOÃO SILVA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Número do Cartão</FormLabel>
                <FormControl>
                  <Input
                    placeholder="0000 0000 0000 0000"
                    {...field}
                    onChange={(e) => field.onChange(formatCardNumber(e.target.value))}
                    maxLength={19}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4 mt-4">
            <FormField
              control={form.control}
              name="expiryMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês</FormLabel>
                  <FormControl>
                    <Input placeholder="12" {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiryYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl>
                    <Input placeholder="25" {...field} maxLength={2} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ccv"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CVV</FormLabel>
                  <FormControl>
                    <Input placeholder="123" {...field} maxLength={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Assinar {plan.label}
        </Button>
      </form>
    </Form>
  );
};
