import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Home, HelpCircle, Target, LogIn, LogOut, Shield, User, Moon, Sun, GraduationCap, MessageSquare, CreditCard, Settings } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface AppMenuProps {
  user?: any;
}

import { Logo } from "@/components/Logo";

export const AppMenu = ({ user }: AppMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpen(false);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      toast({
        title: "Erro ao sair",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      navigate("/");
      setOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { title: "Início", path: "/", icon: Home, show: true },
    { title: "Recursos", path: "/features", icon: Target, show: true },
    { title: "Planos", path: "/plans", icon: Target, show: true },
    { title: "Sobre Nós", path: "/about", icon: User, show: true },
    { title: "Blog", path: "/blog", icon: HelpCircle, show: true },
    { title: "Dashboard", path: "/dashboard", icon: User, show: !!user },
    { title: "Metas", path: "/goals", icon: Target, show: !!user },
    { title: "Minha Assinatura 👑", path: "/subscription", icon: CreditCard, show: !!user },
    { title: "WhatsApp Bot", path: "/whatsapp", icon: MessageSquare, show: !!user },
    { title: "Educação Financeira 👑", path: "/education", icon: GraduationCap, show: !!user },
    { title: "Configurações", path: "/settings", icon: Settings, show: !!user },
    { title: "Segurança", path: "/security", icon: Shield, show: !!user },
    { title: "Ajuda", path: "/help", icon: HelpCircle, show: true },
    { title: "Política de Privacidade", path: "/privacy-policy", icon: Shield, show: true },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[400px] flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-center">
            <Logo className="h-10" />
          </SheetTitle>
        </SheetHeader>
        
        <ScrollArea className="flex-1 mt-4 -mx-6 px-6">
          <div className="flex flex-col gap-2 pb-20">
            {user && (
              <>
                <div className="px-3 py-2 mb-2">
                  <p className="text-sm text-muted-foreground">Conectado como:</p>
                  <p className="font-medium truncate">{user.email}</p>
                </div>
                <Separator className="my-2" />
              </>
            )}

            <nav className="flex flex-col gap-1">
              {menuItems.map((item) => 
                item.show ? (
                  <Button
                    key={item.path}
                    variant={isActive(item.path) ? "secondary" : "ghost"}
                    className="justify-start gap-3"
                    onClick={() => handleNavigation(item.path)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </Button>
                ) : null
              )}
            </nav>

            <Separator className="my-4" />

            <Button
              variant="ghost"
              className="justify-start gap-3"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-5 w-5" />
                  <span>Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-5 w-5" />
                  <span>Modo Escuro</span>
                </>
              )}
            </Button>

            <Separator className="my-4" />

            {user ? (
              <Button
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Sair</span>
              </Button>
            ) : (
              <Button
                variant="default"
                className="justify-start gap-3"
                onClick={() => handleNavigation("/auth")}
              >
                <LogIn className="h-5 w-5" />
                <span>Entrar / Criar conta</span>
              </Button>
            )}
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 FinaManage. Todos os direitos reservados.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
