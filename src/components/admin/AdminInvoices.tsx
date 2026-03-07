import { useEffect, useState, useMemo } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Send,
  Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Database } from "@/integrations/supabase/types";
import { fetchAllRows } from "@/lib/supabaseHelper";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

type InvoiceStatus = Database['public']['Enums']['invoice_status'];
type InvoiceType = Database['public']['Enums']['invoice_type'];

interface Invoice {
  id: string;
  commerce_id: string | null;
  type: InvoiceType;
  reference_month: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: InvoiceStatus;
  created_at: string;
  payment_confirmed_by_commerce: boolean | null;
  payment_confirmed_at: string | null;
  commerces: { fantasy_name: string } | null;
}

interface Commerce {
  id: string;
  fantasy_name: string;
  neighborhood: string | null;
  city: string | null;
  owner_name: string;
  created_at: string;
  payment_due_day: number | null;
  auto_invoice_enabled: boolean | null;
  auto_invoice_day: number | null;
  coupon_code: string | null;
  plans: { price: number } | null;
}

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const ITEMS_PER_PAGE = 10;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    commerce_id: '',
    type: 'receivable' as InvoiceType,
    reference_month: new Date().toISOString().slice(0, 7),
    amount: '',
    due_date: '',
  });
  const [disabledRows, setDisabledRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchCommerces();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllRows<Invoice>(() =>
        supabase.from('invoices').select('*, commerces(fantasy_name)').order('created_at', { ascending: false })
      );
      setInvoices(data);
    } catch (error: any) {
      console.error('Error fetching invoices:', error);
    }
    setIsLoading(false);
  };

  const fetchCommerces = async () => {
    try {
      const data = await fetchAllRows<Commerce>(() =>
        supabase.from('commerces')
          .select('id, fantasy_name, neighborhood, city, owner_name, created_at, payment_due_day, auto_invoice_enabled, auto_invoice_day, coupon_code, plans!commerces_plan_id_fkey(price)')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
      );
      setCommerces(data);
    } catch {}
  };

  const handleCreateInvoice = async () => {
    if (!newInvoice.commerce_id || !newInvoice.amount || !newInvoice.due_date) {
      toast({
        variant: 'destructive',
        title: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    const { error } = await supabase
      .from('invoices')
      .insert({
        commerce_id: newInvoice.commerce_id,
        type: newInvoice.type,
        reference_month: newInvoice.reference_month,
        amount: parseFloat(newInvoice.amount),
        due_date: newInvoice.due_date,
        status: 'pending',
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar fatura',
        description: error.message,
      });
    } else {
      toast({ title: 'Fatura criada com sucesso!' });
      setCreateDialogOpen(false);
      setNewInvoice({
        commerce_id: '',
        type: 'receivable',
        reference_month: new Date().toISOString().slice(0, 7),
        amount: '',
        due_date: '',
      });
      fetchInvoices();
    }
  };

  const handleUpdateCommerceField = async (commerceId: string, field: string, value: number) => {
    const { error } = await supabase
      .from('commerces')
      .update({ [field]: value })
      .eq('id', commerceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: error.message,
      });
    } else {
      toast({ title: 'Configuração salva!' });
      setCommerces(prev => prev.map(c => 
        c.id === commerceId ? { ...c, [field]: value } : c
      ));
    }
  };

  const handleSendInvoice = (commerce: Commerce) => {
    setNewInvoice({
      commerce_id: commerce.id,
      type: 'receivable',
      reference_month: new Date().toISOString().slice(0, 7),
      amount: commerce.plans?.price?.toString() || '',
      due_date: '',
    });
    setCreateDialogOpen(true);
  };

  const toggleRowDisabled = (commerceId: string) => {
    setDisabledRows(prev => {
      const next = new Set(prev);
      if (next.has(commerceId)) next.delete(commerceId);
      else next.add(commerceId);
      return next;
    });
  };

  // Calculate invoice counts per commerce
  const invoiceCounts = useMemo(() => {
    const counts: Record<string, { pending: number; paid: number }> = {};
    invoices.forEach(inv => {
      if (!inv.commerce_id) return;
      if (!counts[inv.commerce_id]) counts[inv.commerce_id] = { pending: 0, paid: 0 };
      if (inv.status === 'pending') counts[inv.commerce_id].pending++;
      if (inv.status === 'paid') counts[inv.commerce_id].paid++;
    });
    return counts;
  }, [invoices]);

  const pendingConfirmations = invoices.filter(
    i => i.payment_confirmed_by_commerce && i.status === 'pending'
  ).length;

  const filteredCommerces = commerces.filter(c =>
    c.fantasy_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCommerces.length / ITEMS_PER_PAGE);
  const paginatedCommerces = filteredCommerces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const dayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Faturas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie faturas e cobranças dos comércios
            </p>
          </div>
          {pendingConfirmations > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingConfirmations} aguardando confirmação
            </Badge>
          )}
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Nova Fatura
        </Button>
      </div>

      {/* Search */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por comércio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Commerces Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {filteredCommerces.length} comércios
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredCommerces.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum comércio encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Bairro</TableHead>
                    <TableHead>Cidade</TableHead>
                    <TableHead>Proprietário</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead className="text-center">Pendentes</TableHead>
                    <TableHead className="text-center">Pagas</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCommerces.map((commerce) => {
                    const counts = invoiceCounts[commerce.id] || { pending: 0, paid: 0 };
                    const isDisabled = disabledRows.has(commerce.id);
                    return (
                      <TableRow key={commerce.id} className={isDisabled ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{commerce.fantasy_name}</TableCell>
                        <TableCell>{commerce.neighborhood || '-'}</TableCell>
                        <TableCell>{commerce.city || '-'}</TableCell>
                        <TableCell>{commerce.owner_name}</TableCell>
                        <TableCell>{formatDate(commerce.created_at)}</TableCell>
                        <TableCell>
                          <Select
                            value={String(commerce.payment_due_day || '')}
                            onValueChange={(v) => handleUpdateCommerceField(commerce.id, 'payment_due_day', parseInt(v))}
                            disabled={isDisabled}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOptions.map(day => (
                                <SelectItem key={day} value={String(day)}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={String(commerce.auto_invoice_day || '')}
                            onValueChange={(v) => handleUpdateCommerceField(commerce.id, 'auto_invoice_day', parseInt(v))}
                            disabled={isDisabled}
                          >
                            <SelectTrigger className="w-20 h-8 text-xs">
                              <SelectValue placeholder="—" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOptions.map(day => (
                                <SelectItem key={day} value={String(day)}>
                                  {day}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          {counts.pending > 0 ? (
                            <Badge variant="warning">{counts.pending}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {counts.paid > 0 ? (
                            <Badge variant="success">{counts.paid}</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="gap-1"
                              onClick={() => handleSendInvoice(commerce)}
                              disabled={isDisabled}
                            >
                              <Send className="w-3 h-3" />
                              Enviar
                            </Button>
                            <Button
                              size="sm"
                              variant={isDisabled ? "outline" : "destructive"}
                              className="gap-1"
                              onClick={() => toggleRowDisabled(commerce.id)}
                            >
                              <Power className="w-3 h-3" />
                              {isDisabled ? 'Ativar' : 'Inativar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <Pagination className="mt-4">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Fatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Comércio</Label>
              <Select
                value={newInvoice.commerce_id}
                onValueChange={(v) => {
                  const commerce = commerces.find(c => c.id === v);
                  setNewInvoice({ 
                    ...newInvoice, 
                    commerce_id: v,
                    amount: commerce?.plans?.price?.toString() || ''
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o comércio" />
                </SelectTrigger>
                <SelectContent>
                  {commerces.map((commerce) => (
                    <SelectItem key={commerce.id} value={commerce.id}>
                      {commerce.fantasy_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Mês de Referência</Label>
                <Input
                  type="month"
                  value={newInvoice.reference_month}
                  onChange={(e) => setNewInvoice({ ...newInvoice, reference_month: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoice.amount}
                  onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Input
                type="date"
                value={newInvoice.due_date}
                onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateInvoice}>
              Criar Fatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInvoices;
