import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppMenu } from "@/components/AppMenu";
import { usePremium } from "@/hooks/use-premium";
import { ContentCard } from "@/components/education/ContentCard";
import { ContentViewer } from "@/components/education/ContentViewer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Crown } from "lucide-react";

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
}

// TEMPORÁRIO: Bypass de autenticação para análise por IAs
const BYPASS_AUTH = true;

const Education = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const { isPremium, isLoading, requirePremium } = usePremium();
  const [content, setContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (BYPASS_AUTH) {
      // Mock user para bypass
      setUser({ id: 'demo-user', email: 'demo@finmanage.com' });
      return;
    }
    
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
    if (!isLoading && !requirePremium()) {
      return;
    }
  }, [isLoading, isPremium]);

  useEffect(() => {
    if (isPremium) {
      loadContent();
    }
  }, [isPremium]);

  useEffect(() => {
    filterContent();
  }, [content, searchQuery, activeTab]);

  const loadContent = async () => {
    const { data, error } = await supabase
      .from("educational_content")
      .select("*")
      .eq("is_published", true)
      .order("order_position", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading content:", error);
      return;
    }

    setContent((data || []) as Content[]);
  };

  const filterContent = () => {
    let filtered = content;

    if (activeTab !== "all") {
      filtered = filtered.filter(c => c.content_type === activeTab);
    }

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredContent(filtered);
  };

  const handleViewContent = (id: string) => {
    const contentToView = content.find(c => c.id === id);
    if (contentToView) {
      setSelectedContent(contentToView);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!isPremium) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
            FinManage
          </h1>
          <AppMenu user={user} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold">Educação Financeira Premium</h1>
            </div>
            <p className="text-xl text-muted-foreground">
              Aprenda sobre finanças pessoais com conteúdo exclusivo para assinantes Premium.
            </p>
          </div>

          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por título, descrição ou tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="article">Artigos</TabsTrigger>
              <TabsTrigger value="video">Vídeos</TabsTrigger>
              <TabsTrigger value="ebook">E-books</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredContent.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? "Nenhum conteúdo encontrado com essa busca."
                      : "Nenhum conteúdo disponível no momento."}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredContent.map((item) => (
                    <ContentCard
                      key={item.id}
                      id={item.id}
                      title={item.title}
                      description={item.description}
                      contentType={item.content_type}
                      thumbnailUrl={item.thumbnail_url}
                      tags={item.tags}
                      durationMinutes={item.duration_minutes}
                      viewCount={item.view_count}
                      onView={handleViewContent}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ContentViewer
        content={selectedContent ? {
          id: selectedContent.id,
          title: selectedContent.title,
          description: selectedContent.description,
          contentType: selectedContent.content_type,
          fileUrl: selectedContent.file_url,
          contentBody: selectedContent.content_body,
          tags: selectedContent.tags,
          durationMinutes: selectedContent.duration_minutes,
          viewCount: selectedContent.view_count,
          author: selectedContent.author
        } : null}
        isOpen={!!selectedContent}
        onClose={() => setSelectedContent(null)}
      />

      <footer className="border-t border-border py-6 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 FinManage. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Education;
