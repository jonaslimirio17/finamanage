import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search, FileText, Camera, PenLine, MessageSquare, Pencil, Trash2, Download, RefreshCw, X, Filter } from "lucide-react";
import { EditTransactionDialog } from "./EditTransactionDialog";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";

interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: string;
  category: string | null;
  subcategory: string | null;
  merchant: string | null;
  raw_description: string | null;
  imported_from: string;
  tags: string[] | null;
  profile_id?: string;
}

interface TransactionFilters {
  search: string;
  period: string;
  category: string;
  type: string;
  origin: string;
}

const ITEMS_PER_PAGE = 15;

const getOriginIcon = (origin: string) => {
  if (origin.startsWith('csv')) return <FileText className="h-4 w-4 text-blue-500" />;
  if (origin === 'receipt_photo' || origin === 'photo') return <Camera className="h-4 w-4 text-purple-500" />;
  if (origin === 'manual') return <PenLine className="h-4 w-4 text-green-500" />;
  if (origin === 'whatsapp') return <MessageSquare className="h-4 w-4 text-emerald-500" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
};

const getOriginLabel = (origin: string) => {
  if (origin.startsWith('csv')) return 'CSV';
  if (origin === 'receipt_photo' || origin === 'photo') return 'Foto';
  if (origin === 'manual') return 'Manual';
  if (origin === 'whatsapp') return 'WhatsApp';
  return origin;
};

export const TransactionHistory = ({ profileId }: { profileId: string }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [showNewIndicator, setShowNewIndicator] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  const [filters, setFilters] = useState<TransactionFilters>({
    search: '',
    period: '30',
    category: 'all',
    type: 'all',
    origin: 'all'
  });

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('date', { ascending: false });

    if (!error && data) {
      setTransactions(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();

    const channel = supabase
      .channel('transaction-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `profile_id=eq.${profileId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setShowNewIndicator(true);
            setTimeout(() => setShowNewIndicator(false), 3000);
          }
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId]);

  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Period filter
    if (filters.period !== 'all') {
      const days = parseInt(filters.period);
      const startDate = startOfDay(subDays(new Date(), days));
      filtered = filtered.filter(t => new Date(t.date) >= startDate);
    }

    // Search filter
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(t =>
        (t.merchant?.toLowerCase().includes(search)) ||
        (t.raw_description?.toLowerCase().includes(search)) ||
        (t.category?.toLowerCase().includes(search))
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(t => t.category === filters.category);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(t => t.type === filters.type);
    }

    // Origin filter
    if (filters.origin !== 'all') {
      filtered = filtered.filter(t => {
        if (filters.origin === 'csv') return t.imported_from.startsWith('csv');
        if (filters.origin === 'photo') return t.imported_from === 'receipt_photo' || t.imported_from === 'photo';
        return t.imported_from === filters.origin;
      });
    }

    return filtered;
  }, [transactions, filters]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedTransactions.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const handleDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    const { error } = await supabase
      .from('transactions')
      .delete()
      .in('id', idsToDelete);

    if (error) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Transações excluídas",
        description: `${idsToDelete.length} transação(ões) removida(s).`,
      });
      setSelectedIds(new Set());
    }
    setShowDeleteDialog(false);
  };

  const handleExportCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Valor', 'Tipo', 'Origem'];
    const rows = filteredTransactions.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.merchant || t.raw_description || '-',
      t.category || '-',
      t.amount.toFixed(2),
      t.type === 'credit' ? 'Entrada' : 'Saída',
      getOriginLabel(t.imported_from)
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: `${filteredTransactions.length} transações exportadas.`,
    });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      period: '30',
      category: 'all',
      type: 'all',
      origin: 'all'
    });
    setCurrentPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <CardTitle className="text-xl font-semibold">Histórico de Transações</CardTitle>
          {showNewIndicator && (
            <Badge variant="secondary" className="animate-pulse bg-green-500/20 text-green-600">
              Nova transação
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filtros</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Exportar</span>
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Excluir ({selectedIds.size})
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 bg-muted/50 rounded-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9"
              />
            </div>

            <Select value={filters.period} onValueChange={(v) => setFilters({ ...filters, period: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.category} onValueChange={(v) => setFilters({ ...filters, category: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos tipos</SelectItem>
                <SelectItem value="credit">Entradas</SelectItem>
                <SelectItem value="debit">Saídas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.origin} onValueChange={(v) => setFilters({ ...filters, origin: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas origens</SelectItem>
                <SelectItem value="csv">📄 CSV</SelectItem>
                <SelectItem value="photo">📷 Foto</SelectItem>
                <SelectItem value="manual">✏️ Manual</SelectItem>
                <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={clearFilters} className="col-span-1 sm:col-span-2 lg:col-span-5">
              <X className="h-4 w-4 mr-2" />
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>{filteredTransactions.length} transação(ões) encontrada(s)</span>
          {filteredTransactions.length > 0 && (
            <span>
              Total: {' '}
              <span className="text-green-600 font-medium">
                +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredTransactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
              {' / '}
              <span className="text-red-600 font-medium">
                -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  filteredTransactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0)
                )}
              </span>
            </span>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma transação encontrada.</div>
        ) : (
          <>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paginatedTransactions.length > 0 && paginatedTransactions.every(t => selectedIds.has(t.id))}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden md:table-cell">Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="hidden sm:table-cell w-16">Origem</TableHead>
                    <TableHead className="w-20">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(transaction.id)}
                          onCheckedChange={(checked) => handleSelectOne(transaction.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {transaction.merchant || transaction.raw_description || '-'}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.category ? (
                          <Badge variant="outline">{transaction.category}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-right font-medium whitespace-nowrap ${
                        transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'credit' ? '+' : '-'}
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.amount)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1" title={getOriginLabel(transaction.imported_from)}>
                          {getOriginIcon(transaction.imported_from)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditingTransaction(transaction)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => {
                              setSelectedIds(new Set([transaction.id]));
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page = i + 1;
                    if (totalPages > 5) {
                      if (currentPage <= 3) page = i + 1;
                      else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                      else page = currentPage - 2 + i;
                    }
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <EditTransactionDialog
        transaction={editingTransaction ? { ...editingTransaction, profile_id: profileId } : null}
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
        onSuccess={() => {
          setEditingTransaction(null);
        }}
      />

      {/* Delete Dialog */}
      <DeleteTransactionDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        count={selectedIds.size}
        onConfirm={handleDelete}
      />
    </Card>
  );
};
