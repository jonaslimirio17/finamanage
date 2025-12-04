import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  Menu, Home, HelpCircle, Target, LogIn, LogOut, Shield, 
  Moon, Sun, GraduationCap, MessageSquare, CreditCard, 
  Settings, LayoutDashboard, Sparkles, Users, FileText,
  Upload, Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Logo } from "@/components/Logo";

interface AppMenuProps {
  user?: any;
}

export const AppMenu = ({ user }: AppMenuProps) => {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  // Fetch and subscribe to unread notifications count
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('profile_id', user.id)
        .eq('is_read', false);

      if (!error && count !== null) {
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('notifications-badge')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${user.id}`
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

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

  // Itens públicos (visíveis para todos)
  const publicItems = [
    { title: "Início", path: "/", icon: Home },
    { title: "Recursos", path: "/features", icon: Sparkles },
    { title: "Planos", path: "/plans", icon: CreditCard },
    { title: "Sobre Nós", path: "/about", icon: Users },
  ];

  // Itens principais do app (apenas logados)
  const appItems = [
    { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { title: "Metas", path: "/goals", icon: Target },
    { title: "Importar Extrato", path: "/importar-extrato", icon: Upload },
    { title: "WhatsApp Bot", path: "/whatsapp", icon: MessageSquare },
    { title: "Educação Financeira 👑", path: "/education", icon: GraduationCap },
  ];

  // Conta e configurações (apenas logados)
  const accountItems = [
    { title: "Minha Assinatura 👑", path: "/subscription", icon: CreditCard },
    { title: "Configurações", path: "/settings", icon: Settings },
    { title: "Segurança", path: "/security", icon: Shield },
  ];

  // Suporte e informações (visíveis para todos)
  const supportItems = [
    { title: "Ajuda", path: "/help", icon: HelpCircle },
    { title: "Política de Privacidade", path: "/privacy-policy", icon: FileText },
  ];

  const renderMenuSection = (items: typeof publicItems, label?: string) => (
    <>
      {label && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-3 py-2">
          {label}
        </p>
      )}
      {items.map((item) => (
        <Button
          key={item.path}
          variant={isActive(item.path) ? "secondary" : "ghost"}
          className="justify-start gap-3 h-10"
          onClick={() => handleNavigation(item.path)}
        >
          <item.icon className="h-4 w-4" />
          <span className="text-sm">{item.title}</span>
        </Button>
      ))}
    </>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Menu className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
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
          <div className="flex flex-col gap-1 pb-20">
            {/* Usuário conectado */}
            {user && (
              <>
                <div className="px-3 py-3 mb-2 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">Conectado como:</p>
                  <p className="font-medium text-sm truncate">{user.email}</p>
                </div>
              </>
            )}

            {/* Botão de login (não logado) - posição destacada */}
            {!user && (
              <>
                <Button
                  variant="default"
                  className="justify-start gap-3 h-11 mb-3"
                  onClick={() => handleNavigation("/auth")}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Entrar / Criar conta</span>
                </Button>
                <Separator className="my-2" />
              </>
            )}

            {/* Navegação pública */}
            <nav className="flex flex-col gap-1">
              {renderMenuSection(publicItems)}
            </nav>

            {/* Funcionalidades do App (logados) */}
            {user && (
              <>
                <Separator className="my-3" />
                <nav className="flex flex-col gap-1">
                  {renderMenuSection(appItems, "Meu App")}
                </nav>
              </>
            )}

            {/* Conta (logados) */}
            {user && (
              <>
                <Separator className="my-3" />
                <nav className="flex flex-col gap-1">
                  {renderMenuSection(accountItems, "Conta")}
                </nav>
              </>
            )}

            {/* Suporte */}
            <Separator className="my-3" />
            <nav className="flex flex-col gap-1">
              {renderMenuSection(supportItems, "Suporte")}
            </nav>

            {/* Tema */}
            <Separator className="my-3" />
            <Button
              variant="ghost"
              className="justify-start gap-3 h-10"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">Modo Escuro</span>
                </>
              )}
            </Button>

            {/* Logout (logados) */}
            {user && (
              <>
                <Separator className="my-3" />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-10 text-destructive hover:text-destructive"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">Sair</span>
                </Button>
              </>
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