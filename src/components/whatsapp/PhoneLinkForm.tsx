import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PhoneLinkFormProps {
  userId: string;
}

export const PhoneLinkForm = ({ userId }: PhoneLinkFormProps) => {
  const [phone, setPhone] = useState("");
  const [currentPhone, setCurrentPhone] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loadUserData = async () => {
    // Get phone from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .single();

    if (profile?.phone) {
      setCurrentPhone(profile.phone);
      setPhone(profile.phone);

      // Check if has active WhatsApp session
      const { data: session } = await supabase
        .from('whatsapp_sessions')
        .select('id')
        .eq('profile_id', userId)
        .maybeSingle();

      setHasSession(!!session);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const numbers = value.replace(/\D/g, '');
    
    // Format: +55 (11) 98765-4321
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2)}`;
    } else if (numbers.length <= 6) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4)}`;
    } else if (numbers.length <= 11) {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9)}`;
    } else {
      return `+${numbers.slice(0, 2)} (${numbers.slice(2, 4)}) ${numbers.slice(4, 9)}-${numbers.slice(9, 13)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSavePhone = async () => {
    if (!phone || phone.length < 10) {
      toast({
        title: "Número inválido",
        description: "Por favor, insira um número de telefone válido",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Update profile with phone number
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phone.replace(/\D/g, '') })
        .eq('id', userId);

      if (error) throw error;

      setCurrentPhone(phone);

      toast({
        title: "Número salvo!",
        description: "Agora você pode enviar mensagens para nosso WhatsApp",
      });

      await loadUserData();
    } catch (error) {
      console.error('Error saving phone:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o número de telefone",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemovePhone = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: null })
        .eq('id', userId);

      if (error) throw error;

      // Delete WhatsApp session
      await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('profile_id', userId);

      setPhone("");
      setCurrentPhone(null);
      setHasSession(false);

      toast({
        title: "Número removido",
        description: "Sua integração com WhatsApp foi desvinculada",
      });
    } catch (error) {
      console.error('Error removing phone:', error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o número de telefone",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {hasSession && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            WhatsApp conectado e ativo! Envie mensagens para começar.
          </AlertDescription>
        </Alert>
      )}

      {currentPhone && !hasSession && (
        <Alert className="border-yellow-500/50 bg-yellow-500/10">
          <Phone className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-700 dark:text-yellow-400">
            Número cadastrado. Envie uma mensagem para o nosso WhatsApp para ativar a integração.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Número de Telefone (WhatsApp)</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+55 (11) 98765-4321"
                value={phone}
                onChange={handlePhoneChange}
                className="pl-10"
                maxLength={20}
              />
            </div>
            <Button
              onClick={handleSavePhone}
              disabled={isLoading || phone === currentPhone}
            >
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Use o mesmo número cadastrado no WhatsApp
          </p>
        </div>

        {currentPhone && (
          <div className="pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleRemovePhone}
              disabled={isLoading}
            >
              <XCircle className="h-4 w-4 mr-2" />
              Desvincular WhatsApp
            </Button>
          </div>
        )}
      </div>

      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <h4 className="font-semibold text-sm">📱 Número do FinManage:</h4>
        <p className="text-sm font-mono">+55 11 99999-9999</p>
        <p className="text-xs text-muted-foreground">
          Salve este número nos seus contatos e envie "Olá" para começar
        </p>
      </div>
    </div>
  );
};