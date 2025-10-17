import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Conta e Login",
  "Conexão e Open Finance",
  "Importar CSV",
  "Privacidade e LGPD",
  "Pagamentos e Dívidas",
  "Metas e Investimentos",
  "Outros"
];

const PRIORITIES = ["Low", "Normal", "High"];

interface SupportTicketFormProps {
  user: any;
}

export const SupportTicketForm = ({ user }: SupportTicketFormProps) => {
  const [formData, setFormData] = useState({
    name: user?.email?.split('@')[0] || '',
    email: user?.email || '',
    subject: '',
    category: '',
    priority: 'Normal',
    description: '',
  });
  const [consentChecked, setConsentChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentChecked) {
      toast({
        title: "Consentimento necessário",
        description: "Você precisa autorizar o uso dos dados para abrir um chamado.",
        variant: "destructive"
      });
      return;
    }

    if (formData.description.length < 20) {
      toast({
        title: "Descrição muito curta",
        description: "A descrição deve ter pelo menos 20 caracteres.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-support-ticket', {
        body: {
          ...formData,
          profile_id: user?.id || null,
        }
      });

      if (error) throw error;

      toast({
        title: "Chamado criado com sucesso!",
        description: `Chamado #${data.ticket_number} criado. Responderemos em breve.`
      });

      // Reset form
      setFormData({
        name: user?.email?.split('@')[0] || '',
        email: user?.email || '',
        subject: '',
        category: '',
        priority: 'Normal',
        description: '',
      });
      setConsentChecked(false);

    } catch (error: any) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Erro ao criar chamado",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Abrir Chamado de Suporte</CardTitle>
        <CardDescription>
          Preencha o formulário abaixo e nossa equipe entrará em contato
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
              placeholder="Resumo do problema"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição * (mínimo 20 caracteres)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={6}
              placeholder="Descreva detalhadamente o problema ou dúvida"
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length} caracteres
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="consent"
              checked={consentChecked}
              onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
            />
            <label
              htmlFor="consent"
              className="text-sm leading-relaxed cursor-pointer"
            >
              Autorizo o uso dos dados fornecidos para análise deste chamado. *
            </label>
          </div>

          <Button type="submit" disabled={loading || !consentChecked}>
            {loading ? "Enviando..." : "Abrir chamado"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};