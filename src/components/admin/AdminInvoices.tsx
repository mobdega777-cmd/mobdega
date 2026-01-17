import { useEffect, useState } from "react";
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Send
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
  plans: { price: number } | null;
}

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    commerce_id: '',
    type: 'receivable' as InvoiceType,
    reference_month: new Date().toISOString().slice(0, 7),
    amount: '',
    due_date: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInvoices();
    fetchCommerces();
  }, []);

  const fetchInvoices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('invoices')
      .select('*, commerces(fantasy_name)')
      .order('payment_confirmed_by_commerce', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invoices:', error);
    } else {
      setInvoices(data || []);
    }
    setIsLoading(false);
  };

  const fetchCommerces = async () => {
    const { data } = await supabase
      .from('commerces')
      .select('id, fantasy_name, plans(price)')
      .eq('status', 'approved');
    
    setCommerces(data || []);
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

  const handleGenerateBulkInvoices = async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dueDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 10).toISOString().split('T')[0];

    const approvedCommerces = commerces.filter(c => c.plans?.price);
    
    if (approvedCommerces.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Nenhum comércio com plano ativo',
      });
      return;
    }

    const invoicesToCreate = approvedCommerces.map(commerce => ({
      commerce_id: commerce.id,
      type: 'receivable' as InvoiceType,
      reference_month: currentMonth,
      amount: commerce.plans?.price || 0,
      due_date: dueDate,
      status: 'pending' as InvoiceStatus,
    }));

    const { error } = await supabase
      .from('invoices')
      .insert(invoicesToCreate);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar faturas',
        description: error.message,
      });
    } else {
      toast({ title: `${invoicesToCreate.length} faturas geradas!` });
      fetchInvoices();
    }
  };

  const updateInvoiceStatus = async (invoiceId: string, status: InvoiceStatus) => {
    const updateData: any = { 
      status,
      payment_confirmed_by_commerce: false // Reset confirmation when admin marks as paid
    };
    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', invoiceId);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar',
        description: error.message,
      });
    } else {
      toast({ title: 'Status atualizado!' });
      fetchInvoices();
    }
  };

  const pendingConfirmations = invoices.filter(
    i => i.payment_confirmed_by_commerce && i.status === 'pending'
  ).length;

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.commerces?.fantasy_name
      ?.toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: InvoiceStatus) => {
    const config = {
      pending: { label: "Pendente", variant: "warning" as const, icon: Clock },
      paid: { label: "Pago", variant: "success" as const, icon: CheckCircle },
      overdue: { label: "Atrasado", variant: "destructive" as const, icon: AlertCircle },
      cancelled: { label: "Cancelado", variant: "secondary" as const, icon: XCircle },
    };
    const { label, variant, icon: Icon } = config[status];
    return (
      <Badge variant={variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
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
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleGenerateBulkInvoices}>
            <Send className="w-4 h-4" />
            Gerar Faturas do Mês
          </Button>
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por comércio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="paid">Pagos</SelectItem>
                <SelectItem value="overdue">Atrasados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-primary" />
            {filteredInvoices.length} faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comércio</TableHead>
                    <TableHead>Referência</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow 
                      key={invoice.id}
                      className={invoice.payment_confirmed_by_commerce && invoice.status === 'pending' 
                        ? 'bg-yellow-500/10 border-l-4 border-l-yellow-500' 
                        : ''
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {invoice.commerces?.fantasy_name || '-'}
                          {invoice.payment_confirmed_by_commerce && invoice.status === 'pending' && (
                            <Badge variant="warning" className="text-xs">
                              Pagamento Informado
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invoice.reference_month}</TableCell>
                      <TableCell>
                        R$ {Number(invoice.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            >
                              Marcar Pago
                            </Button>
                          )}
                          {invoice.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInvoiceStatus(invoice.id, 'cancelled')}
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
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
