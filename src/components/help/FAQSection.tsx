import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  order_position: number;
}

interface FAQSectionProps {
  searchQuery: string;
  selectedCategory: string | null;
  userId: string | null;
}

export const FAQSection = ({ searchQuery, selectedCategory, userId }: FAQSectionProps) => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        let query = supabase
          .from('faqs')
          .select('*')
          .order('order_position', { ascending: true });

        const { data, error } = await query;

        if (error) throw error;

        let filteredData = data || [];

        // Filter by search query
        if (searchQuery) {
          filteredData = filteredData.filter(faq =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
          );
        }

        // Filter by category (map to tags)
        if (selectedCategory) {
          const categoryMap: Record<string, string[]> = {
            "Conta e Login": ["conta", "login"],
            "Conexão e Open Finance": ["open finance", "conexão"],
            "Importar CSV": ["importação", "csv"],
            "Privacidade e LGPD": ["privacidade", "lgpd"],
            "Pagamentos e Dívidas": ["pagamento", "dívida"],
            "Metas e Investimentos": ["meta", "investimento"],
          };

          const categoryTags = categoryMap[selectedCategory] || [];
          filteredData = filteredData.filter(faq =>
            faq.tags.some((tag: string) =>
              categoryTags.some(catTag => tag.toLowerCase().includes(catTag.toLowerCase()))
            )
          );
        }

        setFaqs(filteredData);
      } catch (error) {
        console.error('Error fetching FAQs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, [searchQuery, selectedCategory]);

  const handleFAQExpand = async (faqId: string) => {
    // Log FAQ expand event
    await supabase.from('events_logs').insert({
      profile_id: userId,
      event_type: 'faq_expand',
      payload: { faq_id: faqId }
    });
  };

  if (loading) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (faqs.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhuma pergunta encontrada para os critérios selecionados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Perguntas Frequentes</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger onClick={() => handleFAQExpand(faq.id)}>
                {faq.question}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{faq.answer}</p>
                {faq.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {faq.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};