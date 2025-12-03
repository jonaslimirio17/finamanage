import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Gift, Copy, Check, PartyPopper } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrizeModalProps {
  open: boolean;
  onClose: () => void;
  prize: string;
  couponCode: string;
}

const PrizeModal = ({ open, onClose, prize, couponCode }: PrizeModalProps) => {
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(couponCode);
      setCopied(true);
      toast({
        title: "Cupom copiado!",
        description: "Cole o código na hora de ativar sua conta.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Erro ao copiar",
        description: "Por favor, copie o código manualmente.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                <PartyPopper
                  className="text-primary"
                  style={{
                    transform: `rotate(${Math.random() * 360}deg)`,
                    opacity: 0.7,
                  }}
                />
              </div>
            ))}
          </div>
        )}

        <DialogHeader>
          <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
            <Gift className="h-12 w-12 text-primary animate-bounce" />
          </div>
          <DialogTitle className="text-2xl">🎉 Parabéns!</DialogTitle>
          <DialogDescription className="text-lg">
            Você ganhou:
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="text-3xl font-bold text-primary mb-4 animate-pulse">
            {prize}
          </div>

          <div className="bg-muted rounded-lg p-4 mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Seu código de cupom:
            </p>
            <div className="flex items-center justify-center gap-2">
              <code className="text-xl font-mono font-bold text-foreground bg-background px-4 py-2 rounded border">
                {couponCode}
              </code>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            Use este código ao criar sua conta no FinaManage para ativar seu
            prêmio. Válido por 30 dias.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg">
            <a href="/auth">Criar Minha Conta Agora</a>
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrizeModal;
