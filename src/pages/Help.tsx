import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FAQSection } from "@/components/help/FAQSection";
import { SupportTicketForm } from "@/components/help/SupportTicketForm";
import { UserTicketsList } from "@/components/help/UserTicketsList";
import { ArticlesList } from "@/components/help/ArticlesList";
import { AppMenu } from "@/components/AppMenu";
import { jsPDF } from "jspdf";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Conta e Login",
  "Conexão e Open Finance",
  "Importar Extrato",
  "Privacidade e LGPD",
  "Pagamentos e Dívidas",
  "Metas e Investimentos",
  "Outros"
];

import { Logo } from "@/components/Logo";

const Help = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const exportFAQToPDF = async () => {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Por favor, aguarde.",
      });

      // Fetch all FAQs
      const { data: faqs, error } = await supabase
        .from('faqs')
        .select('*')
        .order('order_position', { ascending: true });

      if (error) throw error;

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;
      let yPosition = 20;

      // Header with logo text
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("FinaManage", margin, yPosition);
      
      yPosition += 10;
      doc.setFontSize(18);
      doc.text("Perguntas Frequentes (FAQ)", margin, yPosition);
      
      yPosition += 5;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, yPosition);
      
      // Add line separator
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      
      yPosition += 15;
      doc.setTextColor(0, 0, 0);

      // Add FAQs
      faqs?.forEach((faq, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Question number and text
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(101, 198, 244); // Brand color
        const questionText = `${index + 1}. ${faq.question}`;
        const questionLines = doc.splitTextToSize(questionText, maxWidth);
        doc.text(questionLines, margin, yPosition);
        yPosition += questionLines.length * 7;

        // Answer
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(0, 0, 0);
        const answerLines = doc.splitTextToSize(faq.answer, maxWidth);
        doc.text(answerLines, margin, yPosition);
        yPosition += answerLines.length * 5 + 3;

        // Tags
        if (faq.tags && faq.tags.length > 0) {
          doc.setFontSize(8);
          doc.setTextColor(100, 100, 100);
          doc.text(`Tags: ${faq.tags.join(', ')}`, margin, yPosition);
          yPosition += 5;
        }

        yPosition += 8;
      });

      // Footer on last page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          `Página ${i} de ${totalPages} | FinaManage © ${new Date().getFullYear()}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Save the PDF
      doc.save(`FinaManage-FAQ-${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado para seu dispositivo.",
      });

      // Log export event
      await supabase.from('events_logs').insert({
        profile_id: user?.id || null,
        event_type: 'export_faq_pdf',
        payload: { faq_count: faqs?.length || 0 }
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao gerar o documento. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Helmet>
        <title>Ajuda | FinaManage — FAQ e Suporte</title>
        <meta 
          name="description" 
          content="Perguntas frequentes, base de conhecimento e formulário rápido para abrir um chamado ao suporte." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Logo />
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
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Perguntas Frequentes</h2>
              <Button onClick={exportFAQToPDF} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Exportar FAQ (PDF)
              </Button>
            </div>
            <FAQSection 
              searchQuery={searchQuery} 
              selectedCategory={selectedCategory}
              userId={user?.id}
            />
          </div>

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