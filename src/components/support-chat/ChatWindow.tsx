import React, { useState, useRef, useEffect } from "react";
import { X, Send, HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { SupportEscalationForm } from "./SupportEscalationForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface ChatWindowProps {
  onClose: () => void;
}

export const ChatWindow = ({ onClose }: ChatWindowProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "Olá! Como posso ajudá-lo hoje? Estou aqui para responder suas dúvidas sobre a plataforma.",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showEscalation, setShowEscalation] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    try {
      let sessionId = sessionStorage.getItem("chatSessionId");
      if (!sessionId) {
        sessionId = crypto.randomUUID();
        sessionStorage.setItem("chatSessionId", sessionId);
      }

      const { data, error } = await supabase.functions.invoke('chatbot', {
        body: {
          message: userMessage,
          sessionId,
          conversationHistory: messages.map(m => ({
            role: m.sender === "user" ? "user" : "assistant",
            content: m.text,
          })),
        },
      });

      if (error) {
        console.error("Error calling chatbot function:", error);
        throw error;
      }

      return data?.response || "Desculpe, não consegui processar sua mensagem.";
    } catch (error) {
      console.error("Error sending message:", error);
      return "Desculpe, estou com dificuldades técnicas. Por favor, tente novamente ou entre em contato com nosso suporte.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    // Get bot response from Lovable AI
    const botResponse = await sendMessage(inputValue);

    const botMessage: Message = {
      id: crypto.randomUUID(),
      text: botResponse,
      sender: "bot",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (showEscalation) {
    return (
      <Card className="w-[380px] h-[600px] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
          <h3 className="font-semibold">Falar com Suporte</h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowEscalation(false)}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <SupportEscalationForm
          conversationHistory={messages}
          onBack={() => setShowEscalation(false)}
        />
      </Card>
    );
  }

  return (
    <Card className="w-[380px] h-[600px] shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <h3 className="font-semibold">Suporte Técnico</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="text-primary-foreground hover:bg-primary/90"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 max-w-[80%]">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-2">
        {messages.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEscalation(true)}
            className="w-full"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            Falar com atendente humano
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
