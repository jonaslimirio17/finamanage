import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface SupportEscalationFormProps {
  conversationHistory: Message[];
  onBack: () => void;
}

export const SupportEscalationForm = ({
  conversationHistory,
  onBack,
}: SupportEscalationFormProps) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // TODO: Replace with actual N8N webhook URL for support escalation
      const N8N_SUPPORT_WEBHOOK_URL = "https://your-n8n-instance.com/webhook/support-escalation";
      
      const response = await fetch(N8N_SUPPORT_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          conversationHistory: conversationHistory.map(m => ({
            sender: m.sender,
            text: m.text,
            timestamp: m.timestamp,
          })),
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar solicitação");
      }

      toast({
        title: "Solicitação enviada!",
        description: "Nossa equipe entrará em contato em breve.",
      });

      setFormData({ name: "", email: "", message: "" });
      onBack();
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast({
        title: "Erro ao enviar",
        description: "Por favor, tente novamente ou envie um email para suporte@finmanage.com",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 p-4 overflow-auto">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao chat
      </Button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome completo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Seu nome"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="seu@email.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">Descreva seu problema</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Por favor, descreva em detalhes o problema que está enfrentando..."
            className="min-h-[120px]"
            required
          />
        </div>

        <div className="bg-muted p-3 rounded-lg text-sm text-muted-foreground">
          <p>
            O histórico da sua conversa com o chatbot será incluído automaticamente
            para ajudar nossa equipe a entender melhor sua situação.
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Enviando..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Enviar solicitação
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
