import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText } from "lucide-react";

interface Article {
  id: string;
  title: string;
  summary: string;
  tags: string[];
  views: number;
  updated_at: string;
}

interface ArticlesListProps {
  searchQuery: string;
  selectedCategory: string | null;
  userId: string | null;
}

export const ArticlesList = ({ searchQuery, selectedCategory, userId }: ArticlesListProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        let query = supabase
          .from('support_articles')
          .select('*')
          .order('views', { ascending: false })
          .limit(6);

        const { data, error } = await query;

        if (error) throw error;

        let filteredData = data || [];

        // Filter by search query
        if (searchQuery) {
          filteredData = filteredData.filter(article =>
            article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            article.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }

        // Filter by category
        if (selectedCategory) {
          const categoryMap: Record<string, string[]> = {
            "Conta e Login": ["conta", "login"],
            "Conexão e Open Finance": ["open finance", "conexão"],
            "Importar Extrato": ["importação", "csv", "extrato", "ofx"],
            "Privacidade e LGPD": ["privacidade", "lgpd"],
            "Pagamentos e Dívidas": ["pagamento", "dívida"],
            "Metas e Investimentos": ["meta", "investimento"],
          };

          const categoryTags = categoryMap[selectedCategory] || [];
          filteredData = filteredData.filter(article =>
            article.tags.some((tag: string) =>
              categoryTags.some(catTag => tag.toLowerCase().includes(catTag.toLowerCase()))
            )
          );
        }

        setArticles(filteredData);
      } catch (error) {
        console.error('Error fetching articles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [searchQuery, selectedCategory]);

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Base de Conhecimento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando artigos...</p>
        </CardContent>
      </Card>
    );
  }

  if (articles.length === 0) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Base de Conhecimento</CardTitle>
        <CardDescription>Artigos e guias detalhados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {articles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary mt-1" />
                  <div className="flex-1">
                    <CardTitle className="text-base">{article.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {article.summary}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/help/article/${article.id}`)}
                  >
                    Ver artigo
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};