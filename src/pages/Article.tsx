import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import DOMPurify from "dompurify";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Eye } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  views: number;
  updated_at: string;
}

const Article = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from('support_articles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        setArticle(data);

        // Increment view count using secure RPC function
        await supabase.rpc('increment_article_view', { article_id: id });

        // Log article view event (only for authenticated users)
        if (user?.id) {
          await supabase.from('events_logs').insert({
            profile_id: user.id,
            event_type: 'kb_article_view',
            payload: { article_id: id }
          });
        }
      } catch (error) {
        console.error('Error fetching article:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Carregando artigo...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="pt-6">
            <p>Artigo não encontrado.</p>
            <Button onClick={() => navigate('/help')} className="mt-4">
              Voltar para Ajuda
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{article.title} | FinaManage</title>
        <meta name="description" content={article.summary} />
      </Helmet>

      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate('/help')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Ajuda
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{article.views} visualizações</span>
                  <span>•</span>
                  <span>
                    Atualizado em{' '}
                    {new Date(article.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <CardTitle className="text-3xl">{article.title}</CardTitle>
                <p className="text-lg text-muted-foreground">{article.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.body) }}
              />
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Article;