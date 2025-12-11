import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useMerchantCategories } from "@/hooks/use-merchant-categories";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  category: string | null;
  subcategory: string | null;
  merchant: string | null;
  raw_description: string | null;
  profile_id?: string;
}

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Educação",
  "Lazer",
  "Vestuário",
  "Serviços",
  "Investimentos",
  "Salário",
  "Freelance",
  "Vendas",
  "Outros"
];

export const EditTransactionDialog = ({
  transaction,
  open,
  onOpenChange,
  onSuccess
}: EditTransactionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();
  
  const { saveMerchantMapping } = useMerchantCategories(transaction?.profile_id || null);

  useEffect(() => {
    if (transaction) {
      setDate(new Date(transaction.date));
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category || "");
      setSubcategory(transaction.subcategory || "");
      setMerchant(transaction.merchant || "");
      setDescription(transaction.raw_description || "");
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !date || !amount) return;

    setLoading(true);

    const { error } = await supabase
      .from('transactions')
      .update({
        date: format(date, 'yyyy-MM-dd'),
        amount: parseFloat(amount),
        type,
        category: category || null,
        subcategory: subcategory || null,
        merchant: merchant || null,
        raw_description: description || null
      })
      .eq('id', transaction.id);

    // Save merchant → category mapping for future auto-categorization
    if (!error && merchant && category) {
      await saveMerchantMapping(merchant, category, subcategory);
    }

    setLoading(false);

    if (error) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transação atualizada",
        description: merchant && category 
          ? `Categoria "${category}" será usada automaticamente para "${merchant}".`
          : "Alterações salvas com sucesso.",
      });
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecione"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Valor *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit">Entrada (Crédito)</SelectItem>
                <SelectItem value="debit">Saída (Débito)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Estabelecimento</Label>
            <Input
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="Nome do estabelecimento"
            />
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição da transação"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Input
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="Ex: Delivery"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !date || !amount}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
