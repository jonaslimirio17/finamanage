import { useState, useEffect } from "react";
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
import { Loader2, Copy, Check, Gift } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(3, "Nome completo é obrigatório"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
  email: z.string().email("Email inválido"),
  phone: z.string().regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
});

type FormData = z.infer<typeof formSchema>;

interface PixPaymentProps {
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

export const PixPayment = ({ onSuccess, planType, couponCode, discountType }: PixPaymentProps) => {
  const plan = planDetails[planType];
  const [loading, setLoading] = useState(false);
  const [pixData, setPixData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [polling, setPolling] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      cpf: "",
      email: "",
      phone: "",
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

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: {
          payment_method: 'PIX',
          cycle: plan.cycle,
          value: plan.value,
          name: data.name,
          cpf: data.cpf,
          email: data.email,
          phone: data.phone,
          couponCode,
          discountType,
        },
      });

      if (error) throw error;

      if (result.error) {
        throw new Error(result.error);
      }

      setPixData(result.pix);
      setPolling(true);

      toast({
        title: "PIX gerado!",
        description: couponCode 
          ? "Escaneie o QR Code. Cupom aplicado!" 
          : "Escaneie o QR Code ou copie o código para pagar.",
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar PIX. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (pixData?.copy_paste) {
      navigator.clipboard.writeText(pixData.copy_paste);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copiado!",
        description: "Código PIX copiado para a área de transferência.",
      });
    }
  };

  // Polling para verificar pagamento
  useEffect(() => {
    if (!polling || !pixData?.payment_id) return;

    const interval = setInterval(async () => {
      try {
        const { data: status, error } = await supabase.functions.invoke('asaas-get-payment-status', {
          body: { payment_id: pixData.payment_id },
        });

        if (error) throw error;

        if (status.status === 'CONFIRMED' || status.status === 'RECEIVED') {
          setPolling(false);
          toast({
            title: "Pagamento confirmado!",
            description: "Sua assinatura Premium foi ativada.",
          });
          onSuccess();
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => clearInterval(interval);
  }, [polling, pixData, onSuccess, navigate, toast]);

  if (pixData) {
    return (
      <div className="space-y-6">
        {/* Coupon Badge */}
        {discountType && (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <Gift className="h-5 w-5 text-green-500" />
            <Badge variant="secondary" className="bg-green-500/20 text-green-600">
              {getDiscountLabel(discountType)}
            </Badge>
          </div>
        )}

        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Escaneie o QR Code</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Ou copie o código PIX abaixo
          </p>
        </div>

        {pixData.qrcode && (
          <div className="flex justify-center">
            <img
              src={`data:image/png;base64,${pixData.qrcode}`}
              alt="QR Code PIX"
              className="w-64 h-64"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Código Copia e Cola</label>
          <div className="flex gap-2">
            <Input
              value={pixData.copy_paste}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {polling && (
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aguardando confirmação do pagamento...
          </div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <p>Após o pagamento, sua assinatura será ativada automaticamente.</p>
        </div>
      </div>
    );
  }

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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Gerar PIX {plan.label}
        </Button>
      </form>
    </Form>
  );
};
