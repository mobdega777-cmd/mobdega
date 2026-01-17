import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Receipt,
  Download,
  BarChart3,
  PieChart,
  Target,
  Activity,
  Percent,
  Package,
  ShoppingCart,
  CreditCard,
  Wallet,
  TrendingDown as TrendingDownIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceFinancialProps {
  commerceId: string;
}

interface Invoice {
  id: string;
  type: string;
  amount: number;
  status: string;
  reference_month: string;
  due_date: string;
  paid_at: string | null;
  notes: string | null;
}

interface FinancialStats {
  monthlyRevenue: number;
  monthlyCost: number;
  monthlyProfit: number;
  profitMargin: number;
  pendingPayments: number;
  overduePayments: number;
  totalOrders: number;
  avgTicket: number;
  stockCostValue: number;
  stockSaleValue: number;
  potentialProfit: number;
  bestSellingCategory: string;
  worstSellingCategory: string;
  projectedRevenue: number;
  growthRate: number;
}

const CommerceFinancial = ({ commerceId }: CommerceFinancialProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FinancialStats>({
    monthlyRevenue: 0,
    monthlyCost: 0,
    monthlyProfit: 0,
    profitMargin: 0,
    pendingPayments: 0,
    overduePayments: 0,
    totalOrders: 0,
    avgTicket: 0,
    stockCostValue: 0,
    stockSaleValue: 0,
    potentialProfit: 0,
    bestSellingCategory: "-",
    worstSellingCategory: "-",
    projectedRevenue: 0,
    growthRate: 0,
  });
  const { toast } = useToast();

  const fetchData = async () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
    
    // Fetch orders for revenue (current month)
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, created_at')
      .eq('commerce_id', commerceId)
      .eq('status', 'delivered')
      .gte('created_at', firstDayOfMonth);

    const monthlyRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const totalOrders = orders?.length || 0;
    const avgTicket = totalOrders > 0 ? monthlyRevenue / totalOrders : 0;

    // Fetch last month orders for comparison
    const { data: lastMonthOrders } = await supabase
      .from('orders')
      .select('total, status')
      .eq('commerce_id', commerceId)
      .eq('status', 'delivered')
      .gte('created_at', lastMonth)
      .lte('created_at', lastMonthEnd);

    const lastMonthRevenue = lastMonthOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const growthRate = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Fetch products for cost/stock calculations
    const { data: products } = await supabase
      .from('products')
      .select('price, promotional_price, stock, category_id')
      .eq('commerce_id', commerceId);

    let stockCostValue = 0;
    let stockSaleValue = 0;
    products?.forEach(p => {
      const stock = p.stock || 0;
      stockCostValue += (p.price || 0) * stock;
      stockSaleValue += (p.promotional_price || 0) * stock;
    });

    const potentialProfit = stockSaleValue - stockCostValue;

    // Estimate monthly cost (simplified: based on products sold)
    const monthlyCost = monthlyRevenue * 0.6; // Estimativa: 60% do faturamento é custo
    const monthlyProfit = monthlyRevenue - monthlyCost;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    // Project next month revenue based on current growth
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const projectedRevenue = dayOfMonth > 0 ? (monthlyRevenue / dayOfMonth) * daysInMonth : 0;

    // Fetch invoices
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('due_date', { ascending: false });

    const pendingPayments = invoicesData?.filter(i => 
      i.type === 'payable' && i.status === 'pending'
    ).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    const overduePayments = invoicesData?.filter(i => 
      i.status === 'overdue'
    ).reduce((sum, i) => sum + Number(i.amount), 0) || 0;

    setStats({
      monthlyRevenue,
      monthlyCost,
      monthlyProfit,
      profitMargin,
      pendingPayments,
      overduePayments,
      totalOrders,
      avgTicket,
      stockCostValue,
      stockSaleValue,
      potentialProfit,
      bestSellingCategory: "Bebidas", // Placeholder - would need order_items analysis
      worstSellingCategory: "Outros", // Placeholder
      projectedRevenue,
      growthRate,
    });
    setInvoices(invoicesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [commerceId]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Pago", color: "bg-green-500/20 text-green-500" },
      overdue: { label: "Vencido", color: "bg-red-500/20 text-red-500" },
      cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-500" },
    };
    return config[status] || config.pending;
  };

  const handleExportReport = (type: string) => {
    toast({ title: `Relatório de ${type} será gerado em breve!` });
    // TODO: Implementar exportação real
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Financeiro</h1>
          <p className="text-muted-foreground">Dashboard financeiro e insights do seu comércio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExportReport("vendas")}>
            <Download className="w-4 h-4 mr-2" />
            Relatório de Vendas
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExportReport("estoque")}>
            <Download className="w-4 h-4 mr-2" />
            Relatório de Estoque
          </Button>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento do Mês</p>
                <p className="text-2xl font-bold text-green-500">
                  R$ {stats.monthlyRevenue.toFixed(2)}
                </p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {stats.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stats.growthRate.toFixed(1)}% vs mês anterior
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/10">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                <p className="text-2xl font-bold text-blue-500">
                  R$ {stats.monthlyProfit.toFixed(2)}
                </p>
                <p className="text-xs mt-1 text-muted-foreground">
                  Margem: {stats.profitMargin.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/10">
                <Wallet className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">A Pagar (Pendente)</p>
                <p className="text-2xl font-bold text-yellow-500">
                  R$ {stats.pendingPayments.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/10">
                <ArrowDownCircle className="w-6 h-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-500">
                  R$ {stats.overduePayments.toFixed(2)}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/10">
                <TrendingDownIcon className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pedidos no Mês</p>
                <p className="text-lg font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <CreditCard className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ticket Médio</p>
                <p className="text-lg font-bold">R$ {stats.avgTicket.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <Target className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Projeção Mensal</p>
                <p className="text-lg font-bold">R$ {stats.projectedRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10">
                <Activity className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de Crescimento</p>
                <p className={`text-lg font-bold ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estoque e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estoque */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Valor em Estoque
            </CardTitle>
            <CardDescription>Análise do capital em estoque</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                <p className="text-sm text-muted-foreground">Valor de Custo</p>
                <p className="text-xl font-bold text-blue-500">
                  R$ {stats.stockCostValue.toFixed(2)}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Valor de Venda</p>
                <p className="text-xl font-bold text-green-500">
                  R$ {stats.stockSaleValue.toFixed(2)}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Potencial em Estoque</p>
                  <p className="text-2xl font-bold text-purple-500">
                    R$ {stats.potentialProfit.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Insights BI */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Insights Inteligentes
            </CardTitle>
            <CardDescription>Análise de performance e tendências</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="font-medium">Melhor Categoria</span>
              </div>
              <p className="text-lg font-bold">{stats.bestSellingCategory}</p>
              <p className="text-xs text-muted-foreground">Maior volume de vendas</p>
            </div>

            <div className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="w-5 h-5 text-red-500" />
                <span className="font-medium">Atenção Necessária</span>
              </div>
              <p className="text-lg font-bold">{stats.worstSellingCategory}</p>
              <p className="text-xs text-muted-foreground">Menor volume de vendas</p>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <span className="font-medium">Sazonalidade</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.growthRate >= 0 
                  ? "Período de alta nas vendas. Considere aumentar o estoque."
                  : "Período de baixa nas vendas. Avalie promoções para impulsionar."}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Faturas e Cobranças
            </CardTitle>
            <CardDescription>Histórico de faturas e pagamentos</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleExportReport("faturas")}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhuma fatura encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Referência</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = getStatusBadge(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {invoice.type === 'receivable' ? (
                            <ArrowUpCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          )}
                          <span>
                            {invoice.type === 'receivable' ? 'A Receber' : 'A Pagar'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.reference_month}</TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(invoice.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {new Date(invoice.due_date).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceFinancial;