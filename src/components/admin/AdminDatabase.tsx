import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  Users, 
  Store, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  RefreshCw,
  Loader2,
  Table2,
  Activity,
  HardDrive,
  Layers,
  TrendingUp,
  Calendar,
  Download,
  Copy,
  Code
} from "lucide-react";
import { fetchAllRows } from "@/lib/supabaseHelper";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TableStats {
  table_name: string;
  row_count: number;
  last_updated?: string;
}

interface SystemStats {
  profiles: number;
  commerces: number;
  commerces_approved: number;
  commerces_pending: number;
  orders: number;
  orders_pending: number;
  orders_delivered: number;
  products: number;
  categories: number;
  invoices: number;
  invoices_pending: number;
  invoices_paid: number;
  reviews: number;
  tables: number;
  table_sessions: number;
  table_participants: number;
  favorites: number;
  training_videos: number;
  plans: number;
  discount_coupons: number;
  delivery_zones: number;
  payment_methods: number;
  expenses: number;
  cash_registers: number;
  cash_movements: number;
  financial_transactions: number;
  admin_notifications: number;
  site_customizations: number;
  commerce_photos: number;
}

const AdminDatabase = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();
  const [tableStats, setTableStats] = useState<TableStats[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    setRefreshing(true);

    try {
      // Fetch counts from all tables in parallel
      const [
        profilesRes,
        commercesRes,
        commercesApprovedRes,
        commercesPendingRes,
        ordersRes,
        ordersPendingRes,
        ordersDeliveredRes,
        productsRes,
        categoriesRes,
        invoicesRes,
        invoicesPendingRes,
        invoicesPaidRes,
        reviewsRes,
        tablesRes,
        tableSessionsRes,
        tableParticipantsRes,
        favoritesRes,
        trainingVideosRes,
        plansRes,
        discountCouponsRes,
        deliveryZonesRes,
        paymentMethodsRes,
        expensesRes,
        cashRegistersRes,
        cashMovementsRes,
        financialTransactionsRes,
        adminNotificationsRes,
        siteCustomizationsRes,
        commercePhotosRes,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('commerces').select('*', { count: 'exact', head: true }),
        supabase.from('commerces').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('commerces').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('categories').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('reviews').select('*', { count: 'exact', head: true }),
        supabase.from('tables').select('*', { count: 'exact', head: true }),
        supabase.from('table_sessions').select('*', { count: 'exact', head: true }),
        supabase.from('table_participants').select('*', { count: 'exact', head: true }),
        supabase.from('favorites').select('*', { count: 'exact', head: true }),
        supabase.from('training_videos').select('*', { count: 'exact', head: true }),
        supabase.from('plans').select('*', { count: 'exact', head: true }),
        supabase.from('discount_coupons').select('*', { count: 'exact', head: true }),
        supabase.from('delivery_zones').select('*', { count: 'exact', head: true }),
        supabase.from('payment_methods').select('*', { count: 'exact', head: true }),
        supabase.from('expenses').select('*', { count: 'exact', head: true }),
        supabase.from('cash_registers').select('*', { count: 'exact', head: true }),
        supabase.from('cash_movements').select('*', { count: 'exact', head: true }),
        supabase.from('financial_transactions').select('*', { count: 'exact', head: true }),
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }),
        supabase.from('site_customizations').select('*', { count: 'exact', head: true }),
        supabase.from('commerce_photos').select('*', { count: 'exact', head: true }),
      ]);

      const newStats: SystemStats = {
        profiles: profilesRes.count || 0,
        commerces: commercesRes.count || 0,
        commerces_approved: commercesApprovedRes.count || 0,
        commerces_pending: commercesPendingRes.count || 0,
        orders: ordersRes.count || 0,
        orders_pending: ordersPendingRes.count || 0,
        orders_delivered: ordersDeliveredRes.count || 0,
        products: productsRes.count || 0,
        categories: categoriesRes.count || 0,
        invoices: invoicesRes.count || 0,
        invoices_pending: invoicesPendingRes.count || 0,
        invoices_paid: invoicesPaidRes.count || 0,
        reviews: reviewsRes.count || 0,
        tables: tablesRes.count || 0,
        table_sessions: tableSessionsRes.count || 0,
        table_participants: tableParticipantsRes.count || 0,
        favorites: favoritesRes.count || 0,
        training_videos: trainingVideosRes.count || 0,
        plans: plansRes.count || 0,
        discount_coupons: discountCouponsRes.count || 0,
        delivery_zones: deliveryZonesRes.count || 0,
        payment_methods: paymentMethodsRes.count || 0,
        expenses: expensesRes.count || 0,
        cash_registers: cashRegistersRes.count || 0,
        cash_movements: cashMovementsRes.count || 0,
        financial_transactions: financialTransactionsRes.count || 0,
        admin_notifications: adminNotificationsRes.count || 0,
        site_customizations: siteCustomizationsRes.count || 0,
        commerce_photos: commercePhotosRes.count || 0,
      };

      setStats(newStats);

      // Build table stats for detailed view
      const tables: TableStats[] = [
        { table_name: 'profiles', row_count: newStats.profiles },
        { table_name: 'commerces', row_count: newStats.commerces },
        { table_name: 'orders', row_count: newStats.orders },
        { table_name: 'order_items', row_count: 0 }, // Will fetch separately
        { table_name: 'products', row_count: newStats.products },
        { table_name: 'categories', row_count: newStats.categories },
        { table_name: 'invoices', row_count: newStats.invoices },
        { table_name: 'reviews', row_count: newStats.reviews },
        { table_name: 'tables', row_count: newStats.tables },
        { table_name: 'table_sessions', row_count: newStats.table_sessions },
        { table_name: 'table_participants', row_count: newStats.table_participants },
        { table_name: 'favorites', row_count: newStats.favorites },
        { table_name: 'training_videos', row_count: newStats.training_videos },
        { table_name: 'plans', row_count: newStats.plans },
        { table_name: 'discount_coupons', row_count: newStats.discount_coupons },
        { table_name: 'delivery_zones', row_count: newStats.delivery_zones },
        { table_name: 'payment_methods', row_count: newStats.payment_methods },
        { table_name: 'expenses', row_count: newStats.expenses },
        { table_name: 'cash_registers', row_count: newStats.cash_registers },
        { table_name: 'cash_movements', row_count: newStats.cash_movements },
        { table_name: 'financial_transactions', row_count: newStats.financial_transactions },
        { table_name: 'admin_notifications', row_count: newStats.admin_notifications },
        { table_name: 'site_customizations', row_count: newStats.site_customizations },
        { table_name: 'commerce_photos', row_count: newStats.commerce_photos },
        { table_name: 'user_roles', row_count: 0 },
        { table_name: 'billing_config', row_count: 0 },
      ];

      // Fetch remaining counts
      const [orderItemsRes, userRolesRes, billingConfigRes] = await Promise.all([
        supabase.from('order_items').select('*', { count: 'exact', head: true }),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }),
        supabase.from('billing_config').select('*', { count: 'exact', head: true }),
      ]);

      tables[3].row_count = orderItemsRes.count || 0;
      tables[tables.length - 2].row_count = userRolesRes.count || 0;
      tables[tables.length - 1].row_count = billingConfigRes.count || 0;

      setTableStats(tables.sort((a, b) => b.row_count - a.row_count));
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const downloadCSV = (filename: string, data: any[]) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        const str = val === null || val === undefined ? '' : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportAllData = async () => {
    setExporting(true);
    toast({ title: 'Exportando...', description: 'Buscando todos os dados do sistema.' });

    try {
      const tableConfigs = [
        { name: 'profiles', query: () => supabase.from('profiles').select('*') },
        { name: 'commerces', query: () => supabase.from('commerces').select('*') },
        { name: 'orders', query: () => supabase.from('orders').select('*') },
        { name: 'order_items', query: () => supabase.from('order_items').select('*') },
        { name: 'products', query: () => supabase.from('products').select('*') },
        { name: 'categories', query: () => supabase.from('categories').select('*') },
        { name: 'invoices', query: () => supabase.from('invoices').select('*') },
        { name: 'reviews', query: () => supabase.from('reviews').select('*') },
        { name: 'tables', query: () => supabase.from('tables').select('*') },
        { name: 'table_sessions', query: () => supabase.from('table_sessions').select('*') },
        { name: 'table_participants', query: () => supabase.from('table_participants').select('*') },
        { name: 'favorites', query: () => supabase.from('favorites').select('*') },
        { name: 'training_videos', query: () => supabase.from('training_videos').select('*') },
        { name: 'plans', query: () => supabase.from('plans').select('*') },
        { name: 'discount_coupons', query: () => supabase.from('discount_coupons').select('*') },
        { name: 'delivery_zones', query: () => supabase.from('delivery_zones').select('*') },
        { name: 'payment_methods', query: () => supabase.from('payment_methods').select('*') },
        { name: 'expenses', query: () => supabase.from('expenses').select('*') },
        { name: 'cash_registers', query: () => supabase.from('cash_registers').select('*') },
        { name: 'cash_movements', query: () => supabase.from('cash_movements').select('*') },
        { name: 'financial_transactions', query: () => supabase.from('financial_transactions').select('*') },
        { name: 'admin_notifications', query: () => supabase.from('admin_notifications').select('*') },
        { name: 'commerce_notifications', query: () => supabase.from('commerce_notifications').select('*') },
        { name: 'site_customizations', query: () => supabase.from('site_customizations').select('*') },
        { name: 'commerce_photos', query: () => supabase.from('commerce_photos').select('*') },
        { name: 'user_roles', query: () => supabase.from('user_roles').select('*') },
        { name: 'billing_config', query: () => supabase.from('billing_config').select('*') },
        { name: 'system_updates', query: () => supabase.from('system_updates').select('*') },
        { name: 'forum_topics', query: () => supabase.from('forum_topics').select('*') },
        { name: 'forum_replies', query: () => supabase.from('forum_replies').select('*') },
        { name: 'commerce_coupons', query: () => supabase.from('commerce_coupons').select('*') },
        { name: 'composite_product_items', query: () => supabase.from('composite_product_items').select('*') },
        { name: 'training_video_progress', query: () => supabase.from('training_video_progress').select('*') },
      ];

      const dateStr = format(new Date(), 'yyyy-MM-dd_HH-mm');
      let exportedCount = 0;

      for (const config of tableConfigs) {
        try {
          const data = await fetchAllRows(() => config.query());
          if (data.length > 0) {
            downloadCSV(`${config.name}_${dateStr}.csv`, data);
            exportedCount++;
          }
        } catch (err) {
          console.warn(`Erro ao exportar ${config.name}:`, err);
        }
      }

      toast({ 
        title: 'Exportação concluída!', 
        description: `${exportedCount} tabela(s) exportada(s) com sucesso.` 
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({ variant: 'destructive', title: 'Erro na exportação', description: 'Ocorreu um erro ao exportar os dados.' });
    } finally {
      setExporting(false);
    }
  };

  const totalRecords = tableStats.reduce((sum, t) => sum + t.row_count, 0);


  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="w-7 h-7 text-primary" />
            Banco de Dados
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Monitoramento completo do sistema em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">
            <Calendar className="w-3 h-3 mr-1" />
            Atualizado: {format(lastRefresh, "dd/MM HH:mm:ss", { locale: ptBR })}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAllStats}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Atualizar</span>
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={exportAllData}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span className="ml-2 hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-primary/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <HardDrive className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{totalRecords.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total de Registros</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card className="border-blue-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Layers className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{tableStats.length}</p>
                  <p className="text-xs text-muted-foreground">Tabelas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-green-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Users className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.profiles.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Usuários</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-orange-500/20">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <Store className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{stats?.commerces.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Comércios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Database Capacity Bar */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Capacidade do Banco de Dados</span>
              </div>
              <span className="text-sm font-semibold text-muted-foreground">
                {totalRecords.toLocaleString()} / 500.000 registros
              </span>
            </div>
            <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((totalRecords / 500000) * 100, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className={`h-full rounded-full ${
                  (totalRecords / 500000) * 100 < 50 
                    ? 'bg-gradient-to-r from-green-500 to-green-400' 
                    : (totalRecords / 500000) * 100 < 80 
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-400' 
                      : 'bg-gradient-to-r from-red-500 to-red-400'
                }`}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span className="font-medium text-foreground">
                {((totalRecords / 500000) * 100).toFixed(2)}% utilizado
              </span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs for detailed info */}
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables" className="gap-2">
            <Table2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tabelas</span>
          </TabsTrigger>
          <TabsTrigger value="operations" className="gap-2">
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">Operações</span>
          </TabsTrigger>
          <TabsTrigger value="metrics" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Métricas</span>
          </TabsTrigger>
          <TabsTrigger value="sql" className="gap-2">
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">SQL Schema</span>
          </TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                Todas as Tabelas do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {tableStats.map((table, index) => (
                    <motion.div
                      key={table.table_name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                          <Table2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{table.table_name}</p>
                          <p className="text-xs text-muted-foreground">public.{table.table_name}</p>
                        </div>
                      </div>
                      <Badge variant={table.row_count > 0 ? "default" : "secondary"}>
                        {table.row_count.toLocaleString()} registros
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Operations Tab */}
        <TabsContent value="operations" className="mt-4">
          <div className="grid md:grid-cols-2 gap-4">
            {/* Orders Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Total de Pedidos</span>
                  <Badge>{stats?.orders.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-sm">Pendentes</span>
                  <Badge variant="warning">{stats?.orders_pending.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-sm">Entregues</span>
                  <Badge variant="success">{stats?.orders_delivered.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Invoices Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  Faturas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Total de Faturas</span>
                  <Badge>{stats?.invoices.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-sm">Pendentes</span>
                  <Badge variant="warning">{stats?.invoices_pending.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-sm">Pagas</span>
                  <Badge variant="success">{stats?.invoices_paid.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Commerces Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="w-5 h-5 text-primary" />
                  Comércios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Total</span>
                  <Badge>{stats?.commerces.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-green-500/10">
                  <span className="text-sm">Aprovados</span>
                  <Badge variant="success">{stats?.commerces_approved.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-yellow-500/10">
                  <span className="text-sm">Pendentes</span>
                  <Badge variant="warning">{stats?.commerces_pending.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Products & Categories */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  Catálogo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Produtos</span>
                  <Badge>{stats?.products.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Categorias</span>
                  <Badge>{stats?.categories.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm">Avaliações</span>
                  <Badge>{stats?.reviews.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="mt-4">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Tables & Sessions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Mesas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mesas cadastradas</span>
                  <span className="font-medium">{stats?.tables}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sessões</span>
                  <span className="font-medium">{stats?.table_sessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Participantes</span>
                  <span className="font-medium">{stats?.table_participants}</span>
                </div>
              </CardContent>
            </Card>

            {/* Financial */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Financeiro</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Caixas</span>
                  <span className="font-medium">{stats?.cash_registers}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Movimentações</span>
                  <span className="font-medium">{stats?.cash_movements}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Despesas</span>
                  <span className="font-medium">{stats?.expenses}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Transações</span>
                  <span className="font-medium">{stats?.financial_transactions}</span>
                </div>
              </CardContent>
            </Card>

            {/* System */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Planos</span>
                  <span className="font-medium">{stats?.plans}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cupons</span>
                  <span className="font-medium">{stats?.discount_coupons}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Vídeos de Treinamento</span>
                  <span className="font-medium">{stats?.training_videos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Notificações</span>
                  <span className="font-medium">{stats?.admin_notifications}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Favoritos</span>
                  <span className="font-medium">{stats?.favorites}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDatabase;
