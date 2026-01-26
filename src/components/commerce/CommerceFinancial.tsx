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
import { Badge } from "@/components/ui/badge";
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
  Package,
  ShoppingCart,
  CreditCard,
  Wallet,
  TrendingDown as TrendingDownIcon,
  Bell,
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DateFilter from "./DateFilter";
import InvoicePaymentModal from "./InvoicePaymentModal";
import CommerceExpenses from "./CommerceExpenses";
import SalesEvolutionChart from "./SalesEvolutionChart";
import { startOfDay, endOfDay, subDays, startOfMonth, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatPercentage } from "@/lib/formatCurrency";
import HelpTooltip from "@/components/ui/help-tooltip";
import { generateSalesReportPDF, generateStockReportPDF } from "@/lib/pdfReportGenerator";

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
  productCostSold: number;
}

interface Commerce {
  fantasy_name: string;
  logo_url: string | null;
}

const CommerceFinancial = ({ commerceId }: CommerceFinancialProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState({ 
    start: startOfMonth(new Date()), 
    end: endOfDay(new Date()) 
  });
  const [operatorFees, setOperatorFees] = useState(0);
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
    productCostSold: 0,
  });
  const { toast } = useToast();

  // Using centralized formatCurrency from @/lib/formatCurrency

  const handleDateChange = (start: Date, end: Date) => {
    setDateFilter({ start, end });
  };

  const fetchData = async () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
    
    // Fetch commerce info
    const { data: commerceData } = await supabase
      .from('commerces')
      .select('fantasy_name, logo_url')
      .eq('id', commerceId)
      .single();
    
    if (commerceData) {
      setCommerce(commerceData);
    }
    
    // Fetch orders for revenue (filtered by date)
    const { data: orders } = await supabase
      .from('orders')
      .select('total, status, created_at, payment_method')
      .eq('commerce_id', commerceId)
      .eq('status', 'delivered')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());

    // Fetch cash movements (POS sales)
    const { data: cashMovements } = await supabase
      .from('cash_movements')
      .select('amount, type, created_at, payment_method')
      .eq('commerce_id', commerceId)
      .eq('type', 'sale')
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString());

    // Fetch payment methods for fee calculation
    const { data: paymentMethods } = await supabase
      .from('payment_methods')
      .select('type, fee_percentage, fee_fixed')
      .eq('commerce_id', commerceId)
      .eq('is_active', true);

    // Use 'type' as key for matching with order.payment_method (e.g., 'cash', 'credit', 'debit', 'pix')
    const feeMap = new Map(paymentMethods?.map(pm => [pm.type, { pct: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]) || []);

    const ordersRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const movementsRevenue = cashMovements?.reduce((sum, m) => sum + Number(m.amount), 0) || 0;
    const monthlyRevenue = ordersRevenue + movementsRevenue;
    const totalOrders = (orders?.length || 0) + (cashMovements?.length || 0);
    const avgTicket = totalOrders > 0 ? monthlyRevenue / totalOrders : 0;

    // Calculate operator fees
    let calculatedFees = 0;
    orders?.forEach(order => {
      const fee = feeMap.get(order.payment_method || '');
      if (fee) {
        calculatedFees += Number(order.total) * (fee.pct / 100) + fee.fixed;
      }
    });
    cashMovements?.forEach(movement => {
      const fee = feeMap.get(movement.payment_method || '');
      if (fee) {
        calculatedFees += Number(movement.amount) * (fee.pct / 100) + fee.fixed;
      }
    });
    setOperatorFees(calculatedFees);

    // Fetch last month orders for comparison
    const { data: lastMonthOrders } = await supabase
      .from('orders')
      .select('total, status')
      .eq('commerce_id', commerceId)
      .eq('status', 'delivered')
      .gte('created_at', lastMonth)
      .lte('created_at', lastMonthEnd);

    const { data: lastMonthMovements } = await supabase
      .from('cash_movements')
      .select('amount')
      .eq('commerce_id', commerceId)
      .eq('type', 'sale')
      .gte('created_at', lastMonth)
      .lte('created_at', lastMonthEnd);

    const lastMonthRevenue = (lastMonthOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0) +
      (lastMonthMovements?.reduce((sum, m) => sum + Number(m.amount), 0) || 0);
    const growthRate = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Fetch products for cost/stock calculations with category info
    const { data: products } = await supabase
      .from('products')
      .select('price, promotional_price, stock, category_id')
      .eq('commerce_id', commerceId);

    let stockCostValue = 0;
    let stockSaleValue = 0;
    products?.forEach(p => {
      const stock = p.stock || 0;
      stockCostValue += (p.price || 0) * stock;
      stockSaleValue += (p.promotional_price || p.price || 0) * stock;
    });

    // Calcular categorias com base em vendas reais - FILTERED BY DATE
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(`
        quantity,
        total_price,
        product_id,
        orders!inner(commerce_id, status, created_at)
      `)
      .eq('orders.commerce_id', commerceId)
      .eq('orders.status', 'delivered')
      .gte('orders.created_at', dateFilter.start.toISOString())
      .lte('orders.created_at', dateFilter.end.toISOString());

    // Buscar produtos com suas categorias
    const { data: productsWithCategories } = await supabase
      .from('products')
      .select('id, category_id')
      .eq('commerce_id', commerceId);

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name')
      .eq('commerce_id', commerceId);

    // Mapear vendas por categoria
    const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);
    const productCategoryMap = new Map(productsWithCategories?.map(p => [p.id, p.category_id]) || []);
    
    const salesByCategory: Record<string, number> = {};
    let productCostSold = 0;
    
    orderItems?.forEach(item => {
      const categoryId = productCategoryMap.get(item.product_id || '');
      const categoryName = categoryId ? categoryMap.get(categoryId) : 'Sem categoria';
      const name = categoryName || 'Sem categoria';
      salesByCategory[name] = (salesByCategory[name] || 0) + Number(item.total_price);
      
      // Estimate cost as 60% of sale price (can be improved with actual cost data)
      productCostSold += Number(item.total_price) * 0.6;
    });

    // Ordenar categorias por vendas
    const sortedCategories = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]);
    const bestCategory = sortedCategories.length > 0 ? sortedCategories[0][0] : "Nenhuma venda";
    const worstCategory = sortedCategories.length > 1 
      ? sortedCategories[sortedCategories.length - 1][0] 
      : sortedCategories.length === 1 ? sortedCategories[0][0] : "Nenhuma venda";

    const potentialProfit = stockSaleValue - stockCostValue;
    const monthlyCost = monthlyRevenue * 0.6;
    const monthlyProfit = monthlyRevenue - monthlyCost;
    const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0;

    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dayOfMonth = today.getDate();
    const projectedRevenue = dayOfMonth > 0 ? (monthlyRevenue / dayOfMonth) * daysInMonth : 0;

    // Fetch invoices (A Pagar for merchant)
    const { data: invoicesData } = await supabase
      .from('invoices')
      .select('*')
      .eq('commerce_id', commerceId)
      .order('due_date', { ascending: false });

    const pendingCount = invoicesData?.filter(i => i.status === 'pending').length || 0;
    setPendingInvoicesCount(pendingCount);

    const pendingPayments = invoicesData?.filter(i => 
      i.status === 'pending'
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
      bestSellingCategory: bestCategory,
      worstSellingCategory: worstCategory,
      projectedRevenue,
      growthRate,
      productCostSold,
    });
    setInvoices(invoicesData || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [commerceId, dateFilter]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500" },
      paid: { label: "Pago", color: "bg-green-500/20 text-green-500" },
      overdue: { label: "Vencido", color: "bg-red-500/20 text-red-500" },
      cancelled: { label: "Cancelado", color: "bg-gray-500/20 text-gray-500" },
    };
    return config[status] || config.pending;
  };

  const handleGenerateSalesReport = async () => {
    if (!commerce) return;
    setGeneratingPdf('vendas');
    
    try {
      // Fetch detailed data for the report
      const { data: orders } = await supabase
        .from('orders')
        .select('total, status, created_at, payment_method')
        .eq('commerce_id', commerceId)
        .eq('status', 'delivered')
        .gte('created_at', dateFilter.start.toISOString())
        .lte('created_at', dateFilter.end.toISOString());

      const { data: cashMovements } = await supabase
        .from('cash_movements')
        .select('amount, payment_method, created_at')
        .eq('commerce_id', commerceId)
        .eq('type', 'sale')
        .gte('created_at', dateFilter.start.toISOString())
        .lte('created_at', dateFilter.end.toISOString());

      // Payment method breakdown
      const paymentMap = new Map<string, { total: number; count: number }>();
      orders?.forEach(o => {
        const method = o.payment_method || 'Não informado';
        const existing = paymentMap.get(method) || { total: 0, count: 0 };
        paymentMap.set(method, { total: existing.total + Number(o.total), count: existing.count + 1 });
      });
      cashMovements?.forEach(m => {
        const method = m.payment_method || 'Dinheiro';
        const existing = paymentMap.get(method) || { total: 0, count: 0 };
        paymentMap.set(method, { total: existing.total + Number(m.amount), count: existing.count + 1 });
      });

      // Daily sales
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      orders?.forEach(o => {
        const date = format(new Date(o.created_at), 'dd/MM/yyyy');
        const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
        dailyMap.set(date, { revenue: existing.revenue + Number(o.total), orders: existing.orders + 1 });
      });
      cashMovements?.forEach(m => {
        const date = format(new Date(m.created_at), 'dd/MM/yyyy');
        const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
        dailyMap.set(date, { revenue: existing.revenue + Number(m.amount), orders: existing.orders + 1 });
      });

      // Fetch categories with sales
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('total_price, product_id, orders!inner(commerce_id, status, created_at)')
        .eq('orders.commerce_id', commerceId)
        .eq('orders.status', 'delivered')
        .gte('orders.created_at', dateFilter.start.toISOString())
        .lte('orders.created_at', dateFilter.end.toISOString());

      const { data: productsWithCategories } = await supabase
        .from('products')
        .select('id, category_id')
        .eq('commerce_id', commerceId);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('commerce_id', commerceId);

      const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);
      const productCategoryMap = new Map(productsWithCategories?.map(p => [p.id, p.category_id]) || []);
      
      const salesByCategory: Record<string, number> = {};
      orderItems?.forEach(item => {
        const categoryId = productCategoryMap.get(item.product_id || '');
        const categoryName = categoryId ? categoryMap.get(categoryId) : 'Sem categoria';
        const name = categoryName || 'Sem categoria';
        salesByCategory[name] = (salesByCategory[name] || 0) + Number(item.total_price);
      });

      const topCategories = Object.entries(salesByCategory)
        .sort((a, b) => b[1] - a[1])
        .map(([name, revenue]) => ({ name, revenue }));

      // Prepare daily sales
      const dailySalesArray = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        orders: data.orders
      })).sort((a, b) => {
        const [dA, mA, yA] = a.date.split('/').map(Number);
        const [dB, mB, yB] = b.date.split('/').map(Number);
        return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
      });

      // Calculate weekly sales
      const weeklyMap = new Map<number, { revenue: number; orders: number }>();
      dailySalesArray.forEach((day, index) => {
        const weekIndex = Math.floor(index / 7);
        const existing = weeklyMap.get(weekIndex) || { revenue: 0, orders: 0 };
        weeklyMap.set(weekIndex, {
          revenue: existing.revenue + day.revenue,
          orders: existing.orders + day.orders
        });
      });

      const weeklySalesArray = Array.from(weeklyMap.entries()).map(([weekNum, data]) => ({
        week: `Semana ${weekNum + 1}`,
        revenue: data.revenue,
        orders: data.orders
      }));

      await generateSalesReportPDF({
        commerceName: commerce.fantasy_name,
        logoUrl: commerce.logo_url,
        period: `${format(dateFilter.start, 'dd/MM/yyyy')} a ${format(dateFilter.end, 'dd/MM/yyyy')}`,
        totalRevenue: stats.monthlyRevenue,
        totalOrders: stats.totalOrders,
        avgTicket: stats.avgTicket,
        profitMargin: stats.profitMargin,
        growthRate: stats.growthRate,
        topCategories,
        paymentMethodBreakdown: Array.from(paymentMap.entries()).map(([method, data]) => ({
          method,
          total: data.total,
          count: data.count
        })),
        dailySales: dailySalesArray,
        weeklySales: weeklySalesArray
      });

      toast({ title: "Relatório de Vendas gerado com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar relatório" });
    }
    
    setGeneratingPdf(null);
  };

  const handleGenerateStockReport = async () => {
    if (!commerce) return;
    setGeneratingPdf('estoque');
    
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, price, stock, category_id')
        .eq('commerce_id', commerceId)
        .eq('is_active', true);

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('id, name')
        .eq('commerce_id', commerceId);

      const categoryMap = new Map(categoriesData?.map(c => [c.id, c.name]) || []);

      const productsWithValue = (products || []).map(p => ({
        name: p.name,
        category: categoryMap.get(p.category_id || '') || 'Sem categoria',
        stock: p.stock || 0,
        price: p.price,
        value: (p.stock || 0) * p.price
      }));

      const lowStockProducts = productsWithValue
        .filter(p => p.stock <= 5 && p.stock > 0)
        .map(p => ({ name: p.name, stock: p.stock, minStock: 5 }));

      // Group by category
      const categoryStats: Record<string, { productCount: number; totalValue: number }> = {};
      productsWithValue.forEach(p => {
        if (!categoryStats[p.category]) {
          categoryStats[p.category] = { productCount: 0, totalValue: 0 };
        }
        categoryStats[p.category].productCount += 1;
        categoryStats[p.category].totalValue += p.value;
      });

      await generateStockReportPDF({
        commerceName: commerce.fantasy_name,
        logoUrl: commerce.logo_url,
        period: format(new Date(), 'dd/MM/yyyy'),
        totalProducts: products?.length || 0,
        stockValue: stats.stockCostValue,
        potentialRevenue: stats.stockSaleValue,
        lowStockProducts,
        products: productsWithValue,
        categories: Object.entries(categoryStats).map(([name, data]) => ({
          name,
          productCount: data.productCount,
          totalValue: data.totalValue
        }))
      });

      toast({ title: "Relatório de Estoque gerado com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar relatório" });
    }
    
    setGeneratingPdf(null);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
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
        <div className="flex items-center gap-2">
          <DateFilter onDateChange={handleDateChange} defaultValue="30days" />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateSalesReport}
            disabled={!!generatingPdf}
          >
            {generatingPdf === 'vendas' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Relatório de Vendas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateStockReport}
            disabled={!!generatingPdf}
          >
            {generatingPdf === 'estoque' ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Faturamento do Período</p>
                  <HelpTooltip content="Total de vendas realizadas no período selecionado, incluindo pedidos de delivery, mesa e vendas do PDV." />
                </div>
                <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.monthlyRevenue)}</p>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Lucro Estimado</p>
                  <HelpTooltip content="Lucro estimado com base em uma margem média de 40%. Para maior precisão, cadastre o custo de cada produto." />
                </div>
                <p className="text-2xl font-bold text-blue-500">{formatCurrency(stats.monthlyProfit)}</p>
                <p className="text-xs mt-1 text-muted-foreground">Margem: {stats.profitMargin.toFixed(1)}%</p>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">A Pagar (Pendente)</p>
                  <HelpTooltip content="Valor total de faturas pendentes como mensalidades e outras cobranças que você ainda precisa pagar." />
                </div>
                <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pendingPayments)}</p>
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
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Vencidos</p>
                  <HelpTooltip content="Faturas que já passaram da data de vencimento e precisam ser regularizadas para evitar suspensão." />
                </div>
                <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.overduePayments)}</p>
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Pedidos no Período</p>
                  <HelpTooltip content="Quantidade total de pedidos finalizados no período, incluindo todas as modalidades." />
                </div>
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <HelpTooltip content="Valor médio gasto por pedido. Calculado dividindo o faturamento total pelo número de pedidos." />
                </div>
                <p className="text-lg font-bold">{formatCurrency(stats.avgTicket)}</p>
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Projeção Mensal</p>
                  <HelpTooltip content="Estimativa de faturamento até o fim do mês, baseada na média diária de vendas até agora." />
                </div>
                <p className="text-lg font-bold">{formatCurrency(stats.projectedRevenue)}</p>
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
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Taxa de Crescimento</p>
                  <HelpTooltip content="Comparativo do faturamento atual com o mês anterior. Verde indica crescimento, vermelho indica queda." />
                </div>
                <p className={`text-lg font-bold ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Evolution Chart */}
      <SalesEvolutionChart commerceId={commerceId} dateFilter={dateFilter} />

      {/* Estoque e Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <p className="text-xl font-bold text-blue-500">{formatCurrency(stats.stockCostValue)}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                <p className="text-sm text-muted-foreground">Valor de Venda</p>
                <p className="text-xl font-bold text-green-500">{formatCurrency(stats.stockSaleValue)}</p>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lucro Potencial em Estoque</p>
                  <p className="text-2xl font-bold text-purple-500">{formatCurrency(stats.potentialProfit)}</p>
                </div>
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <BarChart3 className="w-6 h-6 text-purple-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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

      {/* Expenses Management Section */}
      <CommerceExpenses 
        commerceId={commerceId} 
        monthlyRevenue={stats.monthlyRevenue}
        operatorFees={operatorFees}
        productCost={stats.productCostSold}
      />

      {/* Invoices Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                Faturas e Cobranças
              </CardTitle>
              <CardDescription>Histórico de faturas e pagamentos</CardDescription>
            </div>
            {pendingInvoicesCount > 0 && (
              <Badge className="bg-red-500 text-white gap-1">
                <Bell className="w-3 h-3" />
                {pendingInvoicesCount} pendente{pendingInvoicesCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={() => toast({ title: "Exportando faturas..." })}>
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
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => {
                  const status = getStatusBadge(invoice.status);
                  return (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <ArrowDownCircle className="w-4 h-4 text-red-500" />
                          <span>A Pagar</span>
                        </div>
                      </TableCell>
                      <TableCell>{invoice.reference_month}</TableCell>
                      <TableCell className="font-medium">R$ {Number(invoice.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {/* Parse date correctly to avoid timezone issues with DATE fields */}
                          {invoice.due_date.includes('T') 
                            ? new Date(invoice.due_date).toLocaleDateString('pt-BR')
                            : new Date(invoice.due_date + 'T12:00:00').toLocaleDateString('pt-BR')
                          }
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => handlePayInvoice(invoice)}
                            className="gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            Pagar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <InvoicePaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoice}
        commerceStats={{
          totalOrders: stats.totalOrders,
          totalRevenue: stats.monthlyRevenue,
          avgTicket: stats.avgTicket,
          totalProducts: 0,
        }}
      />
    </div>
  );
};

export default CommerceFinancial;
