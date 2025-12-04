import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/use-admin";
import { useToast } from "@/hooks/use-toast";
import { AppMenu } from "@/components/AppMenu";
import { Logo } from "@/components/Logo";
import { AddEducationalContentDialog } from "@/components/admin/AddEducationalContentDialog";
import { EditEducationalContentDialog } from "@/components/admin/EditEducationalContentDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Eye, FileText, Video, BookOpen, ShieldAlert } from "lucide-react";

interface Content {
  id: string;
  title: string;
  description: string;
  content_type: "ebook" | "article" | "video";
  file_url?: string;
  thumbnail_url?: string;
  content_body?: string;
  tags?: string[];
  duration_minutes?: number;
  view_count?: number;
  author?: string;
  is_published: boolean;
  created_at: string;
}

const AdminEducation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, isLoading: isAdminLoading } = useAdmin();
  const [user, setUser] = useState<any>(null);
  const [content, setContent] = useState<Content[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingContent, setEditingContent] = useState<Content | null>(null);
  const [deletingContent, setDeletingContent] = useState<Content | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });
      navigate("/dashboard");
    }
  }, [isAdminLoading, isAdmin, navigate, toast]);

  useEffect(() => {
    if (isAdmin) {
      loadContent();
    }
  }, [isAdmin]);

  const loadContent = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("educational_content")
      .select("*")
      .order("order_position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading content:", error);
      toast({
        title: "Erro",
        description: "Falha ao carregar conteúdos.",
        variant: "destructive",
      });
    } else {
      setContent((data || []) as Content[]);
    }
    setIsLoading(false);
  };

  const handleDelete = async () => {
    if (!deletingContent) return;

    const { error } = await supabase
      .from("educational_content")
      .delete()
      .eq("id", deletingContent.id);

    if (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir conteúdo.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Conteúdo excluído com sucesso!",
      });
      loadContent();
    }
    setDeletingContent(null);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article":
        return <FileText className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      case "ebook":
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "article":
        return "Artigo";
      case "video":
        return "Vídeo";
      case "ebook":
        return "E-book";
      default:
        return type;
    }
  };

  if (isAdminLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo />
          <AppMenu user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-primary" />
              <div>
                <h1 className="text-3xl font-bold">Administração de Conteúdo</h1>
                <p className="text-muted-foreground">
                  Gerencie os conteúdos educacionais da plataforma.
                </p>
              </div>
            </div>
            <AddEducationalContentDialog onContentAdded={loadContent} />
          </div>

          {content.length === 0 ? (
            <div className="text-center py-12 border rounded-lg">
              <p className="text-muted-foreground">
                Nenhum conteúdo educacional cadastrado.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Views</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {content.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {item.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeIcon(item.content_type)}
                          {getTypeLabel(item.content_type)}
                        </div>
                      </TableCell>
                      <TableCell>{item.author || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={item.is_published ? "default" : "secondary"}>
                          {item.is_published ? "Publicado" : "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          {item.view_count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingContent(item)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeletingContent(item)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <EditEducationalContentDialog
        content={editingContent}
        open={!!editingContent}
        onOpenChange={(open) => !open && setEditingContent(null)}
        onContentUpdated={loadContent}
      />

      <AlertDialog open={!!deletingContent} onOpenChange={(open) => !open && setDeletingContent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingContent?.title}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 FinaManage. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AdminEducation;
