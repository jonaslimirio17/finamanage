import React, { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChatWindow } from "./ChatWindow";
import { cn } from "@/lib/utils";

export const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <ChatWindow onClose={() => setIsOpen(false)} />
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg",
            "bg-primary hover:bg-primary/90",
            "transition-transform hover:scale-110"
          )}
          aria-label="Abrir chat de suporte"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
};
