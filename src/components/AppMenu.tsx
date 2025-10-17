import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Home, HelpCircle, Target, LogIn, LogOut, Shield, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppMenuProps {
  user?: any;
}

export const AppMenu = ({ user }: AppMenuProps) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

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
    { title: "Dashboard", path: "/dashboard", icon: User, show: !!user },
    { title: "Metas", path: "/goals", icon: Target, show: !!user },
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
      <SheetContent side="right" className="w-[300px] sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold text-primary">FinManage</SheetTitle>
        </SheetHeader>
        
        <div className="mt-8 flex flex-col gap-2">
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

          {user ? (
            <Button
              variant="outline"
              className="justify-start gap-3"
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

        <div className="absolute bottom-6 left-6 right-6">
          <p className="text-xs text-muted-foreground text-center">
            © 2025 FinManage. Todos os direitos reservados.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
};
