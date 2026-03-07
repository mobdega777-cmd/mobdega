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
  Loader2,
  Calculator
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchAllRows } from "@/lib/supabaseHelper";
import DateFilter from "./DateFilter";
import InvoicePaymentModal from "./InvoicePaymentModal";
import CommerceExpenses from "./CommerceExpenses";
import SalesEvolutionChart from "./SalesEvolutionChart";
import TaxConfigModal from "./TaxConfigModal";
import { startOfDay, endOfDay, subDays, startOfMonth, format, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatPercentage } from "@/lib/formatCurrency";
import { getSupabaseDateRange } from "@/lib/dateUtils";
import HelpTooltip from "@/components/ui/help-tooltip";
import { generateSalesReportPDF, generateStockReportPDF, generateManagementReportPDF } from "@/lib/pdfReportGenerator";
import type { ManagementReportData } from "@/lib/pdfReportGenerator";
import { Skeleton } from "@/components/ui/skeleton";

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
  taxAmount: number;
}

interface TaxConfig {
  tax_type: 'fixed' | 'percentage';
  tax_value: number;
  tax_regime: 'mei' | 'simples' | 'lucro_presumido' | 'lucro_real';
  tax_payment_day: number;
}

interface Commerce {
  fantasy_name: string;
  logo_url: string | null;
  tax_type?: string;
  tax_value?: number;
  tax_regime?: string;
  tax_payment_day?: number;
  tax_paid_current_month?: boolean;
  tax_paid_at?: string;
}

const INVOICES_PER_PAGE = 5;

const CommerceFinancial = ({ commerceId }: CommerceFinancialProps) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [pendingInvoicesCount, setPendingInvoicesCount] = useState(0);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoicesPage, setInvoicesPage] = useState(1);
  // Usa data local para evitar problemas de fuso horário UTC
  const getLocalToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  };
  
  const [dateFilter, setDateFilter] = useState({ 
    start: startOfMonth(getLocalToday()), 
    end: endOfDay(getLocalToday()) 
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
    taxAmount: 0,
  });
  const [taxConfig, setTaxConfig] = useState<TaxConfig | null>(null);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const { toast } = useToast();

  // Using centralized formatCurrency from @/lib/formatCurrency

  const handleDateChange = (start: Date, end: Date) => {
    setLoading(true); // Mostra loading IMEDIATAMENTE para evitar flash de dados antigos
    setDateFilter({ start, end });
  };

  const fetchData = async () => {
    const today = new Date();
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString();
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
    
    // Usa conversão correta de timezone para queries
    const { startISO, endISO } = getSupabaseDateRange(dateFilter.start, dateFilter.end);
    
    // Fetch commerce info including tax settings
    const { data: commerceData } = await supabase
      .from('commerces')
      .select('fantasy_name, logo_url, tax_type, tax_value, tax_regime, tax_payment_day, tax_paid_current_month, tax_paid_at')
      .eq('id', commerceId)
      .single();
    
    if (commerceData) {
      setCommerce(commerceData);
      if (commerceData.tax_type) {
        setTaxConfig({
          tax_type: commerceData.tax_type as 'fixed' | 'percentage',
          tax_value: commerceData.tax_value || 0,
          tax_regime: (commerceData.tax_regime || 'simples') as TaxConfig['tax_regime'],
          tax_payment_day: commerceData.tax_payment_day || 20,
        });
      }
    }
    
    // Fetch cash movements (POS sales) with correct timezone
    // IMPORTANTE: Usar apenas cash_movements como fonte única de faturamento
    // Os cash_movements contêm o valor final (com descontos aplicados) e evita duplicação
    const cashMovements = await fetchAllRows(() =>
      supabase.from('cash_movements')
        .select('amount, type, created_at, payment_method')
        .eq('commerce_id', commerceId)
        .eq('type', 'sale')
        .gte('created_at', startISO)
        .lte('created_at', endISO)
    );

    const paymentMethods = await fetchAllRows(() =>
      supabase.from('payment_methods')
        .select('type, fee_percentage, fee_fixed')
        .eq('commerce_id', commerceId)
        .eq('is_active', true)
    );

    // Use 'type' as key for matching with movement.payment_method
    const feeMap = new Map(paymentMethods.map(pm => [pm.type, { pct: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]));

    // Calcular faturamento usando apenas cash_movements
    const monthlyRevenue = cashMovements.reduce((sum, m) => sum + Number(m.amount), 0);
    const totalOrders = cashMovements.length;
    const avgTicket = totalOrders > 0 ? monthlyRevenue / totalOrders : 0;

    // Calculate operator fees usando apenas cash_movements
    let calculatedFees = 0;
    cashMovements.forEach(movement => {
      const fee = feeMap.get(movement.payment_method || '');
      if (fee) {
        calculatedFees += Number(movement.amount) * (fee.pct / 100) + fee.fixed;
      }
    });
    setOperatorFees(calculatedFees);

    // Fetch last month orders for comparison
    const lastMonthOrders = await fetchAllRows(() =>
      supabase.from('orders').select('total, status')
        .eq('commerce_id', commerceId).eq('status', 'delivered')
        .gte('created_at', lastMonth).lte('created_at', lastMonthEnd)
    );

    const lastMonthMovements = await fetchAllRows(() =>
      supabase.from('cash_movements').select('amount')
        .eq('commerce_id', commerceId).eq('type', 'sale')
        .gte('created_at', lastMonth).lte('created_at', lastMonthEnd)
    );

    const lastMonthRevenue = lastMonthOrders.reduce((sum, o) => sum + Number(o.total), 0) +
      lastMonthMovements.reduce((sum, m) => sum + Number(m.amount), 0);
    const growthRate = lastMonthRevenue > 0 
      ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    // Fetch products for cost/stock calculations with category info
    const products = await fetchAllRows(() =>
      supabase.from('products').select('price, promotional_price, stock, category_id').eq('commerce_id', commerceId)
    );

    let stockCostValue = 0;
    let stockSaleValue = 0;
    products.forEach(p => {
      const stock = p.stock || 0;
      stockCostValue += (p.price || 0) * stock;
      stockSaleValue += (p.promotional_price || p.price || 0) * stock;
    });

    // Calcular categorias com base em vendas reais - FILTERED BY DATE with correct timezone
    const orderItems = await fetchAllRows(() =>
      supabase.from('order_items').select(`quantity, total_price, product_id, orders!inner(commerce_id, status, created_at)`)
        .eq('orders.commerce_id', commerceId).eq('orders.status', 'delivered')
        .gte('orders.created_at', startISO).lte('orders.created_at', endISO)
    );

    // Buscar produtos com suas categorias
    const productsWithCategories = await fetchAllRows(() =>
      supabase.from('products').select('id, category_id').eq('commerce_id', commerceId)
    );

    const categoriesData = await fetchAllRows(() =>
      supabase.from('categories').select('id, name').eq('commerce_id', commerceId)
    );

    // Mapear vendas por categoria
    const categoryMap = new Map(categoriesData.map(c => [c.id, c.name]));
    const productCategoryMap = new Map(productsWithCategories.map(p => [p.id, p.category_id]));
    
    const salesByCategory: Record<string, number> = {};
    let productCostSold = 0;
    
    orderItems.forEach(item => {
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
    const invoicesData = await fetchAllRows(() =>
      supabase.from('invoices').select('*').eq('commerce_id', commerceId).order('due_date', { ascending: false })
    );

    const pendingCount = invoicesData.filter(i => i.status === 'pending').length;
    setPendingInvoicesCount(pendingCount);

    // Fetch expenses with due dates for A Pagar/Vencidos calculation
    const expensesData = await fetchAllRows(() =>
      supabase.from('expenses').select('*').eq('commerce_id', commerceId).eq('is_active', true)
    );
    
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Despesas pendentes (não pagas e não vencidas)
    const pendingExpenses = expensesData.filter(e => 
      !e.is_paid && e.due_date && e.due_date >= todayStr
    ).reduce((sum, e) => sum + Number(e.amount), 0);

    // Despesas vencidas (não pagas e já vencidas)
    const overdueExpenses = expensesData.filter(e => 
      !e.is_paid && e.due_date && e.due_date < todayStr
    ).reduce((sum, e) => sum + Number(e.amount), 0);

    // Verificar se imposto está pago neste mês
    const isTaxPaidThisMonth = () => {
      if (!commerceData?.tax_paid_at) return false;
      const paidDate = new Date(commerceData.tax_paid_at);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && 
             paidDate.getFullYear() === now.getFullYear();
    };

    const invoicePendingPayments = invoicesData.filter(i => 
      i.status === 'pending'
    ).reduce((sum, i) => sum + Number(i.amount), 0);

    const invoiceOverduePayments = invoicesData.filter(i => 
      i.status === 'overdue'
    ).reduce((sum, i) => sum + Number(i.amount), 0);

    // Calculate tax amount based on config
    let taxAmount = 0;
    if (commerceData?.tax_type === 'fixed') {
      taxAmount = commerceData.tax_value || 0;
    } else if (commerceData?.tax_type === 'percentage') {
      taxAmount = (monthlyRevenue * (commerceData.tax_value || 0)) / 100;
    }

    // Verificar se imposto está vencido
    const taxPaymentDay = commerceData?.tax_payment_day || 20;
    const currentDay = today.getDate();
    const isTaxOverdue = currentDay > taxPaymentDay && !isTaxPaidThisMonth() && taxAmount > 0;
    const isTaxPending = currentDay <= taxPaymentDay && !isTaxPaidThisMonth() && taxAmount > 0;

    // Total A Pagar = Faturas pendentes + Despesas pendentes + Imposto pendente (se antes do vencimento)
    const pendingPayments = invoicePendingPayments + pendingExpenses + (isTaxPending ? taxAmount : 0);

    // Total Vencidos = Faturas vencidas + Despesas vencidas + Imposto vencido
    const overduePayments = invoiceOverduePayments + overdueExpenses + (isTaxOverdue ? taxAmount : 0);

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
      taxAmount,
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

  const handleSaveTaxConfig = async (config: TaxConfig) => {
    const { error } = await supabase
      .from('commerces')
      .update({
        tax_type: config.tax_type,
        tax_value: config.tax_value,
        tax_regime: config.tax_regime,
        tax_payment_day: config.tax_payment_day,
      })
      .eq('id', commerceId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar configuração de impostos" });
    } else {
      setTaxConfig(config);

      // Upsert expense for tax as fixed cost
      const regimeLabel = getTaxRegimeLabel(config.tax_regime);
      const expenseName = `Imposto - ${regimeLabel}`;
      const today = new Date();
      const dueDay = Math.min(config.tax_payment_day, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate());
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Check if tax expense already exists
      const { data: existingExpense } = await supabase
        .from('expenses')
        .select('id')
        .eq('commerce_id', commerceId)
        .eq('type', 'fixed')
        .ilike('name', 'Imposto%')
        .maybeSingle();

      if (existingExpense) {
        await supabase
          .from('expenses')
          .update({ name: expenseName, amount: config.tax_value, due_date: dueDateStr })
          .eq('id', existingExpense.id);
      } else {
        await supabase
          .from('expenses')
          .insert({
            commerce_id: commerceId,
            name: expenseName,
            type: 'fixed',
            amount: config.tax_value,
            due_date: dueDateStr,
            is_active: true,
            is_paid: false,
          });
      }

      toast({ title: "Configuração de impostos salva com sucesso!" });
      fetchData();
    }
  };

  const getTaxRegimeLabel = (regime: string) => {
    const labels: Record<string, string> = {
      mei: "MEI",
      simples: "Simples Nacional",
      lucro_presumido: "Lucro Presumido",
      lucro_real: "Lucro Real",
    };
    return labels[regime] || regime;
  };

  const handleGenerateSalesReport = async () => {
    if (!commerce) return;
    setGeneratingPdf('vendas');
    
    try {
      // Usa conversão correta de timezone para queries
      const { startISO, endISO } = getSupabaseDateRange(dateFilter.start, dateFilter.end);
      
      // Fetch detailed data for the report with correct timezone
      // IMPORTANTE: Usar apenas cash_movements para faturamento real
      // Os cash_movements já contêm o valor final (com descontos aplicados)
      const cashMovements = await fetchAllRows(() =>
        supabase.from('cash_movements').select('amount, payment_method, created_at')
          .eq('commerce_id', commerceId).eq('type', 'sale')
          .gte('created_at', startISO).lte('created_at', endISO)
      );

      // Fetch expenses for the report
      const expenses = await fetchAllRows(() =>
        supabase.from('expenses').select('name, type, amount, created_at')
          .eq('commerce_id', commerceId).eq('is_active', true)
      );

      // Separate fixed expenses from stock purchases
      const fixedExpenses = expenses.filter(e => e.type !== 'stock_purchase');
      const stockPurchases = expenses.filter(e => e.type === 'stock_purchase');
      
      const totalFixedExpenses = fixedExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
      const totalStockPurchases = stockPurchases.reduce((sum, e) => sum + Number(e.amount), 0);

      // Payment method breakdown (usando apenas cash_movements)
      const paymentMap = new Map<string, { total: number; count: number }>();
      cashMovements.forEach(m => {
        const method = m.payment_method || 'Dinheiro';
        const existing = paymentMap.get(method) || { total: 0, count: 0 };
        paymentMap.set(method, { total: existing.total + Number(m.amount), count: existing.count + 1 });
      });

      // Daily sales (usando apenas cash_movements)
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      cashMovements.forEach(m => {
        const date = format(new Date(m.created_at), 'dd/MM/yyyy');
        const existing = dailyMap.get(date) || { revenue: 0, orders: 0 };
        dailyMap.set(date, { revenue: existing.revenue + Number(m.amount), orders: existing.orders + 1 });
      });

      // Fetch categories with sales (use the same startISO/endISO)
      const orderItems = await fetchAllRows(() =>
        supabase.from('order_items').select('total_price, product_id, orders!inner(commerce_id, status, created_at)')
          .eq('orders.commerce_id', commerceId).eq('orders.status', 'delivered')
          .gte('orders.created_at', startISO).lte('orders.created_at', endISO)
      );

      const productsWithCategories = await fetchAllRows(() =>
        supabase.from('products').select('id, category_id').eq('commerce_id', commerceId)
      );

      const categoriesData = await fetchAllRows(() =>
        supabase.from('categories').select('id, name').eq('commerce_id', commerceId)
      );

      const categoryMap = new Map(categoriesData.map(c => [c.id, c.name]));
      const productCategoryMap = new Map(productsWithCategories.map(p => [p.id, p.category_id]));
      
      const salesByCategory: Record<string, number> = {};
      orderItems.forEach(item => {
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

      // Calculate financial details from fetched data (não usar stats que pode estar com período diferente)
      // Calcular faturamento bruto diretamente dos cash_movements do período
      const reportGrossRevenue = cashMovements.reduce((sum, m) => sum + Number(m.amount), 0);
      const reportTotalOrders = cashMovements.length;
      const reportAvgTicket = reportTotalOrders > 0 ? reportGrossRevenue / reportTotalOrders : 0;
      
      // Fetch payment methods for fee calculation (para o período do relatório)
      const reportPaymentMethods = await fetchAllRows(() =>
        supabase.from('payment_methods').select('type, fee_percentage, fee_fixed')
          .eq('commerce_id', commerceId).eq('is_active', true)
      );

      const feeMap = new Map(reportPaymentMethods.map(pm => [pm.type, { percentage: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]));
      
      // Calcular taxas de operadoras para o período do relatório
      let reportOperatorFees = 0;
      cashMovements.forEach(m => {
        const fee = feeMap.get(m.payment_method);
        if (fee) {
          reportOperatorFees += (Number(m.amount) * fee.percentage / 100) + fee.fixed;
        }
      });
      
      // Fetch products for cost calculation
      const allProducts = await fetchAllRows(() =>
        supabase.from('products').select('id, price, stock').eq('commerce_id', commerceId)
      );
      
      // Calcular CPV (Custo dos Produtos Vendidos) para o período
      // Usar uma estimativa baseada em margem média ou preço de custo se disponível
      const reportProductCostSold = orderItems.reduce((sum, item) => {
        return sum + Number(item.total_price) * 0.6;
      }, 0);
      
      // Calcular imposto para o período do relatório
      let reportTaxAmount = 0;
      if (taxConfig) {
        if (taxConfig.tax_type === 'fixed') {
          reportTaxAmount = taxConfig.tax_value;
        } else {
          reportTaxAmount = (reportGrossRevenue * taxConfig.tax_value) / 100;
        }
      }
      
      // Calculate growth rate (comparar com período anterior de mesmo tamanho)
      const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousStart = new Date(dateFilter.start);
      previousStart.setDate(previousStart.getDate() - periodDays);
      const previousEnd = new Date(dateFilter.start);
      previousEnd.setDate(previousEnd.getDate() - 1);
      
      const { startISO: prevStartISO, endISO: prevEndISO } = getSupabaseDateRange(previousStart, previousEnd);
      const previousCashMovements = await fetchAllRows(() =>
        supabase.from('cash_movements').select('amount')
          .eq('commerce_id', commerceId).eq('type', 'sale')
          .gte('created_at', prevStartISO).lte('created_at', prevEndISO)
      );
      
      const previousRevenue = previousCashMovements.reduce((sum, m) => sum + Number(m.amount), 0);
      const reportGrowthRate = previousRevenue > 0 
        ? ((reportGrossRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      const reportNetRevenue = reportGrossRevenue - reportOperatorFees;
      const reportNetProfit = reportNetRevenue - reportProductCostSold - totalFixedExpenses - reportTaxAmount;
      
      // Business valuation: 12x monthly net profit
      const monthlyNetProfit = reportNetProfit > 0 ? reportNetProfit : 0;
      const businessValuation = monthlyNetProfit * 12;
      
      // Projeção mensal baseada no período
      const daysInPeriod = periodDays;
      const reportProjectedRevenue = daysInPeriod > 0 ? (reportGrossRevenue / daysInPeriod) * 30 : 0;
      
      // Calcular valor em estoque atual (não depende do período)
      const reportStockCostValue = allProducts?.reduce((sum, p) => sum + ((p.stock || 0) * (p.price * 0.6)), 0) || 0;
      const reportStockSaleValue = allProducts?.reduce((sum, p) => sum + ((p.stock || 0) * p.price), 0) || 0;
      const reportPotentialProfit = reportStockSaleValue - reportStockCostValue;
      
      // Calcular margem de lucro do período
      const reportProfitMargin = reportGrossRevenue > 0 ? (reportNetProfit / reportGrossRevenue) * 100 : 0;

      await generateSalesReportPDF({
        commerceName: commerce.fantasy_name,
        logoUrl: commerce.logo_url,
        period: `${format(dateFilter.start, 'dd/MM/yyyy')} a ${format(dateFilter.end, 'dd/MM/yyyy')}`,
        totalRevenue: reportGrossRevenue,
        totalOrders: reportTotalOrders,
        avgTicket: reportAvgTicket,
        profitMargin: reportProfitMargin,
        growthRate: reportGrowthRate,
        topCategories,
        paymentMethodBreakdown: Array.from(paymentMap.entries()).map(([method, data]) => ({
          method,
          total: data.total,
          count: data.count
        })),
        dailySales: dailySalesArray,
        weeklySales: weeklySalesArray,
        financialDetails: {
          grossRevenue: reportGrossRevenue,
          netRevenue: reportNetRevenue,
          operatorFees: reportOperatorFees,
          productCostSold: reportProductCostSold,
          taxAmount: reportTaxAmount,
          taxRegime: taxConfig?.tax_regime || 'simples',
          taxPaymentDay: taxConfig?.tax_payment_day || 20,
          fixedExpenses: totalFixedExpenses,
          stockPurchases: 0,
          netProfit: reportNetProfit,
          stockValue: reportStockCostValue,
          potentialStockProfit: reportPotentialProfit,
          projectedRevenue: reportProjectedRevenue,
          businessValuation,
          expenses: fixedExpenses.map(e => ({
            name: e.name,
            type: e.type,
            amount: Number(e.amount),
          })),
          stockPurchaseHistory: stockPurchases.map(e => ({
            name: e.name,
            type: e.type,
            amount: Number(e.amount),
            date: format(new Date(e.created_at), 'dd/MM/yyyy'),
          })),
        }
      });

      toast({ title: "Relatório de Vendas gerado com sucesso!" });
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao gerar relatório" });
    }
    
    setGeneratingPdf(null);
  };


  const handleGenerateManagementReport = async () => {
    if (!commerce) return;
    setGeneratingPdf('gerencial');
    
    try {
      const { startISO, endISO } = getSupabaseDateRange(dateFilter.start, dateFilter.end);
      const periodLabel = `${format(dateFilter.start, 'dd/MM/yyyy')} a ${format(dateFilter.end, 'dd/MM/yyyy')}`;

      // Parallel fetch all data
      const [
        cashMovements,
        paymentMethods,
        cashRegistersRes,
        products,
        categories,
        expenses,
        orders,
        orderItems,
        coupons,
        reviews,
        favorites,
        allOrders,
      ] = await Promise.all([
        fetchAllRows(() => supabase.from('cash_movements').select('amount, payment_method, created_at').eq('commerce_id', commerceId).eq('type', 'sale').gte('created_at', startISO).lte('created_at', endISO)),
        fetchAllRows(() => supabase.from('payment_methods').select('type, name, fee_percentage, fee_fixed').eq('commerce_id', commerceId).eq('is_active', true)),
        supabase.from('cash_registers').select('*').eq('commerce_id', commerceId).order('opened_at', { ascending: false }).limit(20),
        fetchAllRows(() => supabase.from('products').select('id, name, price, stock, category_id, is_active').eq('commerce_id', commerceId)),
        fetchAllRows(() => supabase.from('categories').select('id, name').eq('commerce_id', commerceId)),
        fetchAllRows(() => supabase.from('expenses').select('*').eq('commerce_id', commerceId).eq('is_active', true)),
        fetchAllRows(() => supabase.from('orders').select('id, total, status, order_type, user_id, created_at, payment_method').eq('commerce_id', commerceId).gte('created_at', startISO).lte('created_at', endISO)),
        fetchAllRows(() => supabase.from('order_items').select('total_price, product_id, quantity, product_name, orders!inner(commerce_id, status, created_at)').eq('orders.commerce_id', commerceId).eq('orders.status', 'delivered').gte('orders.created_at', startISO).lte('orders.created_at', endISO)),
        fetchAllRows(() => supabase.from('commerce_coupons').select('code, discount_type, discount_value, used_count, max_uses, valid_until, is_active').eq('commerce_id', commerceId).eq('is_active', true)),
        fetchAllRows(() => supabase.from('reviews').select('rating, comment, created_at').eq('commerce_id', commerceId)),
        fetchAllRows(() => supabase.from('favorites').select('id').eq('commerce_id', commerceId)),
        fetchAllRows(() => supabase.from('orders').select('user_id, total, created_at').eq('commerce_id', commerceId).eq('status', 'delivered')),
      ]);

      const cashRegisters = cashRegistersRes.data || [];

      // Revenue from cash_movements
      const grossRevenue = cashMovements.reduce((s, m) => s + Number(m.amount), 0);
      const totalOrders = cashMovements.length;
      const avgTicket = totalOrders > 0 ? grossRevenue / totalOrders : 0;

      // Operator fees
      const feeMap = new Map(paymentMethods.map(pm => [pm.type, { pct: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]));
      let operatorFeesCalc = 0;
      cashMovements.forEach(m => {
        const fee = feeMap.get(m.payment_method || '');
        if (fee) operatorFeesCalc += Number(m.amount) * (fee.pct / 100) + fee.fixed;
      });
      const netRevenue = grossRevenue - operatorFeesCalc;

      // Payment method breakdown
      const pmMap = new Map<string, { total: number; count: number }>();
      const pmNameMap = new Map(paymentMethods.map(pm => [pm.type, pm.name]));
      cashMovements.forEach(m => {
        const method = pmNameMap.get(m.payment_method || '') || m.payment_method || 'Dinheiro';
        const ex = pmMap.get(method) || { total: 0, count: 0 };
        pmMap.set(method, { total: ex.total + Number(m.amount), count: ex.count + 1 });
      });

      // Daily sales
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      cashMovements.forEach(m => {
        const date = format(new Date(m.created_at), 'dd/MM/yyyy');
        const ex = dailyMap.get(date) || { revenue: 0, orders: 0 };
        dailyMap.set(date, { revenue: ex.revenue + Number(m.amount), orders: ex.orders + 1 });
      });
      const dailySales = Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d })).sort((a, b) => {
        const [dA, mA, yA] = a.date.split('/').map(Number);
        const [dB, mB, yB] = b.date.split('/').map(Number);
        return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
      });

      // Categories
      const categoryMap = new Map(categories.map(c => [c.id, c.name]));
      const productCategoryMap = new Map(products.map(p => [p.id, p.category_id]));
      const salesByCategory: Record<string, number> = {};
      let productCostSold = 0;
      orderItems.forEach(item => {
        const catId = productCategoryMap.get(item.product_id || '');
        const catName = catId ? categoryMap.get(catId) : 'Sem categoria';
        salesByCategory[catName || 'Sem categoria'] = (salesByCategory[catName || 'Sem categoria'] || 0) + Number(item.total_price);
        productCostSold += Number(item.total_price) * 0.6;
      });
      const topCategories = Object.entries(salesByCategory).sort((a, b) => b[1] - a[1]).map(([name, revenue]) => ({ name, revenue }));

      // Fixed expenses & stock purchases
      const fixedExpensesList = expenses.filter(e => e.type !== 'stock_purchase');
      const stockPurchases = expenses.filter(e => e.type === 'stock_purchase');
      const totalFixedExpenses = fixedExpensesList.reduce((s, e) => s + Number(e.amount), 0);

      // Tax
      let taxAmount = 0;
      if (taxConfig) {
        taxAmount = taxConfig.tax_type === 'fixed' ? taxConfig.tax_value : (grossRevenue * taxConfig.tax_value) / 100;
      }

      const netProfit = netRevenue - productCostSold - totalFixedExpenses - taxAmount;
      const profitMargin = grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0;

      // Growth rate
      const periodDays = Math.ceil((dateFilter.end.getTime() - dateFilter.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const prevStart = new Date(dateFilter.start);
      prevStart.setDate(prevStart.getDate() - periodDays);
      const prevEnd = new Date(dateFilter.start);
      prevEnd.setDate(prevEnd.getDate() - 1);
      const { startISO: pStartISO, endISO: pEndISO } = getSupabaseDateRange(prevStart, prevEnd);
      const prevMoves = await fetchAllRows(() => supabase.from('cash_movements').select('amount').eq('commerce_id', commerceId).eq('type', 'sale').gte('created_at', pStartISO).lte('created_at', pEndISO));
      const prevRevenue = prevMoves.reduce((s, m) => s + Number(m.amount), 0);
      const growthRate = prevRevenue > 0 ? ((grossRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      const projectedRevenue = periodDays > 0 ? (grossRevenue / periodDays) * 30 : 0;
      const businessValuation = Math.max(netProfit, 0) * 12;

      // Cash closings with movements
      const cashClosingsData = await Promise.all(
        cashRegisters.filter(cr => cr.status === 'closed').slice(0, 10).map(async (cr) => {
          const { data: crMoves } = await supabase.from('cash_movements').select('amount, payment_method').eq('cash_register_id', cr.id).eq('type', 'sale');
          const moves = crMoves || [];
          const totalSales = moves.reduce((s, m) => s + Number(m.amount), 0);
          const salesCount = moves.length;
          const ticketMedio = salesCount > 0 ? totalSales / salesCount : 0;
          // Top payment method
          const pmCount: Record<string, number> = {};
          moves.forEach(m => { pmCount[m.payment_method] = (pmCount[m.payment_method] || 0) + 1; });
          const topPM = Object.entries(pmCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
          const openedAt = format(new Date(cr.opened_at), 'dd/MM HH:mm');
          const closedAt = cr.closed_at ? format(new Date(cr.closed_at), 'dd/MM HH:mm') : '-';
          const durationMs = cr.closed_at ? new Date(cr.closed_at).getTime() - new Date(cr.opened_at).getTime() : 0;
          const durationMinutes = Math.round(durationMs / 60000);
          return {
            openedAt, closedAt,
            openingAmount: Number(cr.opening_amount),
            closingAmount: Number(cr.closing_amount || 0),
            expectedAmount: Number(cr.expected_amount || 0),
            difference: Number(cr.difference || 0),
            totalSales, salesCount, ticketMedio,
            topPaymentMethod: pmNameMap.get(topPM) || topPM,
            durationMinutes,
            status: cr.status,
          };
        })
      );

      // Stock
      const activeProducts = products.filter(p => p.is_active !== false);
      const stockValue = activeProducts.reduce((s, p) => s + ((p.stock || 0) * p.price * 0.6), 0);
      const potentialRevenue = activeProducts.reduce((s, p) => s + ((p.stock || 0) * p.price), 0);
      const lowStockProducts = activeProducts.filter(p => (p.stock || 0) > 0 && (p.stock || 0) <= 5).map(p => ({ name: p.name, stock: p.stock || 0 }));
      const catStats: Record<string, { productCount: number; totalValue: number }> = {};
      activeProducts.forEach(p => {
        const catName = categoryMap.get(p.category_id || '') || 'Sem categoria';
        if (!catStats[catName]) catStats[catName] = { productCount: 0, totalValue: 0 };
        catStats[catName].productCount += 1;
        catStats[catName].totalValue += (p.stock || 0) * p.price;
      });

      // CRM - customers
      const customerOrders: Record<string, { count: number; total: number }> = {};
      allOrders.forEach(o => {
        if (!customerOrders[o.user_id]) customerOrders[o.user_id] = { count: 0, total: 0 };
        customerOrders[o.user_id].count += 1;
        customerOrders[o.user_id].total += Number(o.total);
      });
      const totalCustomers = Object.keys(customerOrders).length;
      const returningCustomers = Object.values(customerOrders).filter(c => c.count > 1).length;
      const newCustomers = totalCustomers - returningCustomers;
      const retentionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

      // Top customers - fetch names
      const topCustomerIds = Object.entries(customerOrders).sort((a, b) => b[1].total - a[1].total).slice(0, 10);
      const { data: profilesData } = await supabase.rpc('get_profile_names', { p_user_ids: topCustomerIds.map(c => c[0]) });
      const profileMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);
      const topCustomers = topCustomerIds.map(([uid, data]) => ({
        name: profileMap.get(uid) || 'Cliente',
        totalSpent: data.total,
        orderCount: data.count,
      }));

      // Delivery stats
      const deliveryOrders = orders.filter(o => o.order_type === 'delivery');
      const deliveryStats = {
        total: deliveryOrders.length,
        delivered: deliveryOrders.filter(o => o.status === 'delivered').length,
        pending: deliveryOrders.filter(o => o.status === 'pending' || o.status === 'confirmed').length,
        inRoute: deliveryOrders.filter(o => o.status === 'preparing' || o.status === 'delivering').length,
        totalValue: deliveryOrders.reduce((s, o) => s + Number(o.total), 0),
      };

      // Insights - peak hour/day
      const hourCount: Record<string, number> = {};
      const dayCount: Record<string, number> = {};
      const productCount: Record<string, number> = {};
      cashMovements.forEach(m => {
        const d = new Date(m.created_at);
        const h = `${d.getHours().toString().padStart(2, '0')}:00`;
        hourCount[h] = (hourCount[h] || 0) + 1;
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = dayNames[d.getDay()];
        dayCount[dayName] = (dayCount[dayName] || 0) + 1;
      });
      orderItems.forEach(item => {
        productCount[item.product_name] = (productCount[item.product_name] || 0) + Number(item.quantity);
      });
      const peakHour = Object.entries(hourCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      const peakDay = Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
      const topProduct = Object.entries(productCount).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

      const reportData: ManagementReportData = {
        commerceName: commerce.fantasy_name,
        logoUrl: commerce.logo_url,
        period: periodLabel,
        grossRevenue, netRevenue, operatorFees: operatorFeesCalc,
        productCostSold, taxAmount,
        taxRegime: taxConfig?.tax_regime || 'simples',
        taxPaymentDay: taxConfig?.tax_payment_day || 20,
        fixedExpenses: totalFixedExpenses,
        netProfit, projectedRevenue, businessValuation,
        totalOrders, avgTicket, growthRate, profitMargin,
        paymentMethodBreakdown: Array.from(pmMap.entries()).map(([method, d]) => ({ method, total: d.total, count: d.count })),
        topCategories, dailySales,
        cashClosings: cashClosingsData,
        totalProducts: activeProducts.length,
        stockValue, potentialRevenue, lowStockProducts,
        productsByCategory: Object.entries(catStats).map(([name, d]) => ({ name, ...d })),
        expenses: expenses.map(e => ({
          name: e.name, type: e.type, amount: Number(e.amount),
          isPaid: e.is_paid || false,
          dueDate: e.due_date ? format(new Date(e.due_date), 'dd/MM/yyyy') : undefined,
        })),
        stockPurchaseHistory: stockPurchases.map(e => ({
          name: e.name, amount: Number(e.amount),
          date: format(new Date(e.created_at), 'dd/MM/yyyy'),
        })),
        totalCustomers, newCustomers, returningCustomers, topCustomers,
        activeCoupons: coupons.map(c => ({
          code: c.code, discountType: c.discount_type, discountValue: Number(c.discount_value),
          usedCount: c.used_count || 0, maxUses: c.max_uses,
          validUntil: c.valid_until ? format(new Date(c.valid_until), 'dd/MM/yyyy') : null,
        })),
        deliveryStats,
        peakHour, peakDay, topProduct, retentionRate,
      };

      await generateManagementReportPDF(reportData);
      toast({ title: "Relatório Gerencial gerado com sucesso!" });
    } catch (error) {
      console.error('Management report error:', error);
      toast({ variant: "destructive", title: "Erro ao gerar relatório gerencial" });
    }
    
    setGeneratingPdf(null);
  };

  const handlePayInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  // IMPORTANTE: Não desmontar o DateFilter durante loading para preservar o estado de seleção
  // O loading agora é tratado com skeletons nos cards individuais

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground text-sm sm:text-base">Dashboard financeiro e insights do seu comércio</p>
          </div>
          <DateFilter onDateChange={handleDateChange} defaultValue="thisMonth" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsTaxModalOpen(true)}
            className="text-xs sm:text-sm"
          >
            <Calculator className="w-4 h-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Configurar</span> Impostos
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateSalesReport}
            disabled={!!generatingPdf}
            className="text-xs sm:text-sm"
          >
            {generatingPdf === 'vendas' ? (
              <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden xs:inline">Relatório de</span> Vendas
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGenerateManagementReport}
            disabled={!!generatingPdf}
            className="text-xs sm:text-sm bg-primary/10 border-primary/30 hover:bg-primary/20"
          >
            {generatingPdf === 'gerencial' ? (
              <Loader2 className="w-4 h-4 mr-1 sm:mr-2 animate-spin" />
            ) : (
              <BarChart3 className="w-4 h-4 mr-1 sm:mr-2" />
            )}
            <span className="hidden xs:inline">Relatório</span> Gerencial
          </Button>
        </div>
      </div>

      {/* Tax Config Modal */}
      <TaxConfigModal
        isOpen={isTaxModalOpen}
        onClose={() => setIsTaxModalOpen(false)}
        commerceId={commerceId}
        currentConfig={taxConfig}
        onSave={handleSaveTaxConfig}
      />

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">Faturamento Líquido</p>
                  <HelpTooltip content={`Total de vendas realizadas menos as taxas das operadoras de cartão/maquininha. Bruto: ${formatCurrency(stats.monthlyRevenue)} | Taxas: ${formatCurrency(operatorFees)}`} />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-green-500">{formatCurrency(stats.monthlyRevenue - operatorFees)}</p>
                )}
                {loading ? (
                  <Skeleton className="h-4 w-32 mt-2" />
                ) : (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {stats.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {stats.growthRate.toFixed(1)}% vs mês anterior
                  </p>
                )}
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
                  <HelpTooltip content="Lucro estimado considerando margem de 40% sobre o faturamento líquido (após taxas de operadoras)." />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-blue-500">{formatCurrency((stats.monthlyRevenue - operatorFees) * 0.4)}</p>
                )}
                {loading ? (
                  <Skeleton className="h-4 w-28 mt-2" />
                ) : (
                  <p className="text-xs mt-1 text-muted-foreground">Margem: 40% (após taxas)</p>
                )}
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
                  <HelpTooltip content="Soma de: faturas pendentes + despesas com vencimento futuro não pagas + imposto do mês (se não pago e antes do vencimento)." />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-yellow-500">{formatCurrency(stats.pendingPayments)}</p>
                )}
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
                  <HelpTooltip content="Soma de: faturas vencidas + despesas com vencimento passado não pagas + imposto do mês (se não pago e após o vencimento)." />
                </div>
                {loading ? (
                  <Skeleton className="h-8 w-28 mt-1" />
                ) : (
                  <p className="text-2xl font-bold text-red-500">{formatCurrency(stats.overduePayments)}</p>
                )}
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
                {loading ? (
                  <Skeleton className="h-6 w-12 mt-1" />
                ) : (
                  <p className="text-lg font-bold">{stats.totalOrders}</p>
                )}
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
                {loading ? (
                  <Skeleton className="h-6 w-20 mt-1" />
                ) : (
                  <p className="text-lg font-bold">{formatCurrency(stats.avgTicket)}</p>
                )}
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
                {loading ? (
                  <Skeleton className="h-6 w-24 mt-1" />
                ) : (
                  <p className="text-lg font-bold">{formatCurrency(stats.projectedRevenue)}</p>
                )}
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
                {loading ? (
                  <Skeleton className="h-6 w-16 mt-1" />
                ) : (
                  <p className={`text-lg font-bold ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tax Card */}
      {(() => {
        // Verificar se o pagamento do imposto foi feito no mês atual
        const isTaxPaidThisMonth = () => {
          if (!commerce?.tax_paid_at) return false;
          const paidDate = new Date(commerce.tax_paid_at);
          const now = new Date();
          return paidDate.getMonth() === now.getMonth() && 
                 paidDate.getFullYear() === now.getFullYear();
        };
        
        const taxPaidThisMonth = isTaxPaidThisMonth();
        
        // Calculate if payment is due in 2 days or less
        const today = new Date();
        const currentDay = today.getDate();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const paymentDay = taxConfig?.tax_payment_day || 20;
        let daysUntilDue: number;
        
        if (currentDay <= paymentDay) {
          daysUntilDue = paymentDay - currentDay;
        } else {
          // Already passed this month
          daysUntilDue = daysInMonth - currentDay + paymentDay;
        }
        
        const isAlertActive = daysUntilDue <= 2 && taxConfig && !taxPaidThisMonth;

        const handleMarkAsPaid = async () => {
          await supabase
            .from('commerces')
            .update({ 
              tax_paid_current_month: true,
              tax_paid_at: new Date().toISOString()
            })
            .eq('id', commerceId);
          // Sync expense
          await supabase
            .from('expenses')
            .update({ is_paid: true, paid_at: new Date().toISOString() })
            .eq('commerce_id', commerceId)
            .eq('type', 'fixed')
            .ilike('name', 'Imposto%');
          toast({ title: "Imposto marcado como pago!" });
          fetchData();
        };

        const handleResetTaxPayment = async () => {
          await supabase
            .from('commerces')
            .update({ 
              tax_paid_current_month: false,
              tax_paid_at: null
            })
            .eq('id', commerceId);
          // Sync expense
          await supabase
            .from('expenses')
            .update({ is_paid: false, paid_at: null })
            .eq('commerce_id', commerceId)
            .eq('type', 'fixed')
            .ilike('name', 'Imposto%');
          toast({ title: "Pagamento de imposto estornado!" });
          fetchData();
        };

        return (
          <Card className={`border-amber-500/20 bg-amber-500/5 ${isAlertActive ? 'animate-pulse ring-2 ring-amber-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isAlertActive ? 'bg-amber-500 animate-bounce' : 'bg-amber-500/10'}`}>
                    <Calculator className={`w-5 h-5 ${isAlertActive ? 'text-white' : 'text-amber-500'}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-muted-foreground">Imposto Estimado</p>
                      <HelpTooltip content={
                        taxConfig 
                          ? `Cálculo baseado no regime ${getTaxRegimeLabel(taxConfig.tax_regime)}. ${
                              taxConfig.tax_type === 'fixed' 
                                ? `Valor fixo de ${formatCurrency(taxConfig.tax_value)}/mês.` 
                                : `${taxConfig.tax_value}% sobre o faturamento.`
                            } Vencimento todo dia ${taxConfig.tax_payment_day}. Configure para ajustar às suas necessidades.`
                          : "Configure o tipo de imposto e regime tributário para calcular o valor estimado. Clique em 'Configurar Impostos' para definir."
                      } />
                      {isAlertActive && (
                        <Badge variant="destructive" className="animate-pulse">
                          Vence em {daysUntilDue} dia{daysUntilDue !== 1 ? 's' : ''}!
                        </Badge>
                      )}
                      {taxPaidThisMonth && (
                        <Badge className="bg-green-500">Pago</Badge>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-amber-500">{formatCurrency(stats.taxAmount)}</p>
                    {taxConfig && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {getTaxRegimeLabel(taxConfig.tax_regime)} • Vencimento dia {taxConfig.tax_payment_day}
                      </p>
                    )}
                  </div>
                </div>
                 <div className="flex flex-col gap-2">
                   {taxConfig && !taxPaidThisMonth && (
                     <Button
                       size="sm"
                       onClick={handleMarkAsPaid}
                       className={isAlertActive ? 'animate-pulse' : undefined}
                     >
                       Paguei
                     </Button>
                   )}
                   {taxPaidThisMonth && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={handleResetTaxPayment}
                       className="text-destructive border-destructive/50 hover:bg-destructive/10"
                     >
                       Reset
                     </Button>
                   )}
                  <Button variant="outline" size="sm" onClick={() => setIsTaxModalOpen(true)}>
                    Configurar
                  </Button>
                </div>
              </div>
              {!taxConfig && (
                <p className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
                  💡 <strong>Dica:</strong> Configure seus impostos para ter uma visão mais precisa do lucro líquido. 
                  MEI: DAS fixo ~R$71,60/mês. Simples Nacional: 4% a 33% do faturamento.
                </p>
              )}
            </CardContent>
          </Card>
        );
      })()}

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
        taxAmount={stats.taxAmount}
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
            <>
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
                  {invoices
                    .slice((invoicesPage - 1) * INVOICES_PER_PAGE, invoicesPage * INVOICES_PER_PAGE)
                    .map((invoice) => {
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
              {invoices.length > INVOICES_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 px-2">
                  <p className="text-sm text-muted-foreground">
                    Página {invoicesPage} de {Math.ceil(invoices.length / INVOICES_PER_PAGE)}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoicesPage(p => Math.max(1, p - 1))}
                      disabled={invoicesPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvoicesPage(p => Math.min(Math.ceil(invoices.length / INVOICES_PER_PAGE), p + 1))}
                      disabled={invoicesPage >= Math.ceil(invoices.length / INVOICES_PER_PAGE)}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
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
