import { useEffect, useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  BarChart3,
  Calendar,
  Plus,
  Filter,
  Target
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DateFilter from "@/components/commerce/DateFilter";
import { formatCurrency } from "@/lib/formatCurrency";
import { fetchAllRows } from "@/lib/supabaseHelper";

interface FinancialStats {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  pendingReceivables: number;
  paidInvoices: number;
  overdueInvoices: number;
  projectedRevenue: number;
}

interface Transaction {
  id: string;
  type: string;
  category: string;
  description: string;
  amount: number;
  transaction_date: string;
  created_at: string;
}

const AdminFinancial = () => {
  const [stats, setStats] = useState<FinancialStats>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    pendingReceivables: 0,
    paidInvoices: 0,
    overdueInvoices: 0,
    projectedRevenue: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(() => {
    // Usa data local para evitar problemas de fuso horário UTC
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - 29);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  });

  // Helper para data local
  const getLocalDateString = () => {
    const now = new Date();
    const local = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    return local.toISOString().split('T')[0];
  };

  const [newTransaction, setNewTransaction] = useState({
    type: 'income',
    category: '',
    description: '',
    amount: '',
    transaction_date: getLocalDateString(),
  });
  const { toast } = useToast();

  const handleDateChange = (start: Date, end: Date) => {
    setDateFilter({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
    setFilterDialogOpen(false);
  };

  const fetchData = async () => {
    setIsLoading(true);

    const startISO = dateFilter.start;
    const endISO = dateFilter.end;

    const [transactionsRes, invoicesRes, commercesRes] = await Promise.all([
      supabase
        .from('financial_transactions')
        .select('*')
        .gte('transaction_date', startISO)
        .lte('transaction_date', endISO)
        .order('transaction_date', { ascending: false }),
      supabase
        .from('invoices')
        .select('amount, status, type, created_at')
        .gte('created_at', `${startISO}T00:00:00.000Z`)
        .lte('created_at', `${endISO}T23:59:59.999Z`),
      // Fetch all active commerces with their plan prices for projected revenue
      supabase
        .from('commerces')
        .select('id, plan_id, plans!commerces_plan_id_fkey(price)')
        .eq('status', 'approved'),
    ]);

    if (transactionsRes.error) {
      console.error('Error fetching financial_transactions:', transactionsRes.error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar transações',
        description: transactionsRes.error.message,
      });
    }

    if (invoicesRes.error) {
      console.error('Error fetching invoices:', invoicesRes.error);
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar faturas',
        description: invoicesRes.error.message,
      });
    }

    const transactionsData = transactionsRes.data || [];
    const invoicesData = invoicesRes.data || [];
    const commercesData = commercesRes.data || [];

    setTransactions(transactionsData);

    const incomeFromTransactions = transactionsData
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expenseFromTransactions = transactionsData
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Important: even if there are no manual transactions, the financial cards must reflect invoices
    const pendingReceivables = invoicesData
      .filter((i) => i.type === 'receivable' && i.status === 'pending')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const paidInvoices = invoicesData
      .filter((i) => i.type === 'receivable' && i.status === 'paid')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const overdueInvoices = invoicesData
      .filter((i) => i.type === 'receivable' && i.status === 'overdue')
      .reduce((sum, i) => sum + Number(i.amount), 0);

    const totalIncome = incomeFromTransactions + paidInvoices;
    const totalExpense = expenseFromTransactions;

    // Calculate projected monthly revenue from all approved commerces
    const projectedRevenue = commercesData.reduce((sum, c) => {
      const planPrice = (c.plans as any)?.price || 0;
      return sum + Number(planPrice);
    }, 0);

    setStats({
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      pendingReceivables,
      paidInvoices,
      overdueInvoices,
      projectedRevenue,
    });

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter.start, dateFilter.end]);

  useEffect(() => {
    // Real-time refresh for zero-delay dashboards
    const channel = supabase
      .channel('admin-financial-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'financial_transactions' },
        () => fetchData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddTransaction = async () => {
    if (!newTransaction.category || !newTransaction.description || !newTransaction.amount) {
      toast({
        variant: 'destructive',
        title: 'Preencha todos os campos',
      });
      return;
    }

    const { error } = await supabase
      .from('financial_transactions')
      .insert({
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description,
        amount: parseFloat(newTransaction.amount),
        transaction_date: newTransaction.transaction_date,
      });

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao adicionar',
        description: error.message,
      });
    } else {
      toast({ title: 'Transação adicionada!' });
      setAddDialogOpen(false);
      setNewTransaction({
        type: 'income',
        category: '',
        description: '',
        amount: '',
        transaction_date: getLocalDateString(),
      });
      fetchData();
    }
  };

  const statCards = [
    {
      title: "Receitas",
      value: stats.totalIncome,
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Despesas",
      value: stats.totalExpense,
      icon: TrendingDown,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
    },
    {
      title: "Saldo",
      value: stats.balance,
      icon: DollarSign,
      color: stats.balance >= 0 ? "text-green-500" : "text-red-500",
      bgColor: stats.balance >= 0 ? "bg-green-500/10" : "bg-red-500/10",
    },
    {
      title: "A Receber",
      value: stats.pendingReceivables,
      icon: ArrowUpRight,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Previsão Mensal",
      value: stats.projectedRevenue,
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      tooltip: "Soma dos valores dos planos de todos os comércios aprovados",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Financeiro
          </h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Controle financeiro completo do sistema
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 text-sm"
            onClick={() => setFilterDialogOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filtrar
          </Button>
          <Button size="sm" className="gap-2 text-sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline">Nova</span> Transação
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-2xl font-bold ${stat.color}`}>
                    {formatCurrency(stat.value)}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {stat.title}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-500/20">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Faturas Pagas</p>
                <h3 className="text-xl font-bold text-green-500">
                  {formatCurrency(stats.paidInvoices)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-500/20">
                <Calendar className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <h3 className="text-xl font-bold text-yellow-500">
                  {formatCurrency(stats.pendingReceivables)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-red-500/20">
                <ArrowDownRight className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Atraso</p>
                <h3 className="text-xl font-bold text-red-500">
                  {formatCurrency(stats.overdueInvoices)}
                </h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <PieChart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação registrada</p>
              <Button className="mt-4" onClick={() => setAddDialogOpen(true)}>
                Adicionar primeira transação
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 10).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      transaction.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">{transaction.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(transaction.transaction_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onOpenChange={setFilterDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Filtrar por período</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <DateFilter onDateChange={handleDateChange} defaultValue="30days" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFilterDialogOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={newTransaction.type}
                onValueChange={(v) => setNewTransaction({ ...newTransaction, type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Input
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                placeholder="Ex: Mensalidade, Operacional..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                placeholder="Descreva a transação..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={newTransaction.transaction_date}
                  onChange={(e) => setNewTransaction({ ...newTransaction, transaction_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddTransaction}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancial;
