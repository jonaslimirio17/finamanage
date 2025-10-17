import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FAQSection } from "@/components/help/FAQSection";
import { SupportTicketForm } from "@/components/help/SupportTicketForm";
import { UserTicketsList } from "@/components/help/UserTicketsList";
import { ArticlesList } from "@/components/help/ArticlesList";
import { AppMenu } from "@/components/AppMenu";

const CATEGORIES = [
  "Conta e Login",
  "Conexão e Open Finance",
  "Importar CSV",
  "Privacidade e LGPD",
  "Pagamentos e Dívidas",
  "Metas e Investimentos",
  "Outros"
];

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;

    // Log search event
    await supabase.from('events_logs').insert({
      profile_id: user?.id || null,
      event_type: 'search_kb',
      payload: { query: searchQuery }
    });
  };

  return (
    <>
      <Helmet>
        <title>Ajuda | FinManage — FAQ e Suporte</title>
        <meta 
          name="description" 
          content="Perguntas frequentes, base de conhecimento e formulário rápido para abrir um chamado ao suporte." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary cursor-pointer" onClick={() => navigate("/")}>
              FinManage
            </h1>
            <AppMenu user={user} />
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Ajuda e Suporte</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Encontre respostas rápidas ou abra um chamado — estamos aqui para ajudar.
            </p>
          </div>

          {/* Search Bar */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por palavra-chave (ex: extrato, conexão, LGPD)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit">Buscar</Button>
              </form>
            </CardContent>
          </Card>

          {/* Category Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Categorias</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                Todas
              </Button>
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <FAQSection 
            searchQuery={searchQuery} 
            selectedCategory={selectedCategory}
            userId={user?.id}
          />

          {/* Knowledge Base Articles */}
          <ArticlesList 
            searchQuery={searchQuery}
            selectedCategory={selectedCategory}
            userId={user?.id}
          />

          {/* Support Ticket Form */}
          <SupportTicketForm user={user} />

          {/* User's Tickets */}
          {user && <UserTicketsList userId={user.id} />}

          {/* Contact Info & SLA */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Horários de Atendimento</h3>
                <p className="text-sm text-muted-foreground">
                  Segunda–Sexta, 9h–18h (horário local)
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Prazo de Resposta</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Alta prioridade: 24–48h úteis</li>
                  <li>• Normal: 72h úteis</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Segurança</h3>
                <p className="text-sm text-muted-foreground">
                  Se for algo crítico relacionado a segurança, envie para{" "}
                  <a href="mailto:security@finmanage.com" className="text-primary hover:underline">
                    security@finmanage.com
                  </a>
                  {" "}com o assunto "URGENTE: Segurança — [breve descrição]"
                </p>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <a href="/privacy-policy" className="text-primary hover:underline">
                    Política de Privacidade
                  </a>
                  {" • "}
                  <a href="/terms" className="text-primary hover:underline">
                    Termos de Uso
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

export default Help;