import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  Search,
  Star,
  Heart,
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Eye,
  Crown,
  Calendar,
  Phone,
  MapPin,
  Lightbulb
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/formatCurrency";
import { HelpTooltip } from "@/components/ui/help-tooltip";

interface CommerceCustomersProps {
  commerceId: string;
}

interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  created_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
  is_favorite: boolean;
  avg_ticket: number;
}

interface CustomerOrder {
  id: string;
  status: string;
  total: number;
  order_type: string | null;
  created_at: string;
  payment_method: string | null;
}

interface CustomerStats {
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalRevenue: number;
  favoritesCount: number;
  avgTicket: number;
  topSpender: { name: string; total: number } | null;
  mostFrequent: { name: string; orders: number } | null;
}

const CommerceCustomers = ({ commerceId }: CommerceCustomersProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = async () => {
    setLoading(true);

    // First, fetch all orders for this commerce to get unique customers
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('user_id, total, status, created_at')
      .eq('commerce_id', commerceId)
      .neq('status', 'cancelled');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userOrderStats = new Map<string, { total: number; count: number; lastDate: string }>();
    
    ordersData?.forEach(order => {
      const existing = userOrderStats.get(order.user_id);
      if (existing) {
        existing.total += Number(order.total);
        existing.count += 1;
        if (order.created_at > existing.lastDate) {
          existing.lastDate = order.created_at;
        }
      } else {
        userOrderStats.set(order.user_id, {
          total: Number(order.total),
          count: 1,
          lastDate: order.created_at
        });
      }
    });

    const userIds = Array.from(userOrderStats.keys());

    if (userIds.length === 0) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    // Fetch profiles for these users
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, phone, city, neighborhood, created_at')
      .in('user_id', userIds);

    // Fetch ALL favorites for this commerce (not just customers with orders)
    const { data: favoritesData, count: totalFavorites } = await supabase
      .from('favorites')
      .select('user_id', { count: 'exact' })
      .eq('commerce_id', commerceId);

    const favoriteUserIds = new Set(favoritesData?.map(f => f.user_id) || []);

    // Combine data
    const customersList: Customer[] = (profilesData || []).map(profile => {
      const stats = userOrderStats.get(profile.user_id);
      return {
        user_id: profile.user_id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        city: profile.city,
        neighborhood: profile.neighborhood,
        created_at: profile.created_at,
        total_orders: stats?.count || 0,
        total_spent: stats?.total || 0,
        last_order_date: stats?.lastDate || null,
        is_favorite: favoriteUserIds.has(profile.user_id),
        avg_ticket: stats ? stats.total / stats.count : 0
      };
    });

    // Sort by total spent descending
    customersList.sort((a, b) => b.total_spent - a.total_spent);

    setCustomers(customersList);
    setLoading(false);
  };

  const fetchCustomerOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('id, status, total, order_type, created_at, payment_method')
      .eq('commerce_id', commerceId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    setCustomerOrders(data || []);
  };

  useEffect(() => {
    fetchCustomers();

    // Subscribe to order changes
    const channel = supabase
      .channel(`commerce-customers-${commerceId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `commerce_id=eq.${commerceId}` },
        () => fetchCustomers()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerceId]);

  const calculateStats = async (): Promise<CustomerStats> => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const newCustomersThisMonth = customers.filter(c => 
      new Date(c.created_at) >= thisMonth
    ).length;

    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    
    // Fetch total favorites count for this commerce directly
    const { count: totalFavorites } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerceId);

    const favoritesCount = totalFavorites || 0;
    
    const totalOrders = customers.reduce((sum, c) => sum + c.total_orders, 0);
    const avgTicket = totalOrders > 0 
      ? totalRevenue / totalOrders 
      : 0;

    const topSpender = customers.length > 0
      ? { name: customers[0].full_name, total: customers[0].total_spent }
      : null;

    const sortedByOrders = [...customers].sort((a, b) => b.total_orders - a.total_orders);
    const mostFrequent = sortedByOrders.length > 0
      ? { name: sortedByOrders[0].full_name, orders: sortedByOrders[0].total_orders }
      : null;

    return {
      totalCustomers: customers.length,
      newCustomersThisMonth,
      totalRevenue,
      favoritesCount,
      avgTicket,
      topSpender,
      mostFrequent
    };
  };

  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    newCustomersThisMonth: 0,
    totalRevenue: 0,
    favoritesCount: 0,
    avgTicket: 0,
    topSpender: null,
    mostFrequent: null
  });

  useEffect(() => {
    const updateStats = async () => {
      const newStats = await calculateStats();
      setStats(newStats);
    };
    if (customers.length > 0 || !loading) {
      updateStats();
    }
  }, [customers, commerceId, loading]);

  const openCustomerDetails = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerOrders(customer.user_id);
    setIsDetailsOpen(true);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pendente',
      confirmed: 'Confirmado',
      preparing: 'Preparando',
      delivering: 'Em Entrega',
      delivered: 'Entregue',
      cancelled: 'Cancelado'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-500/20 text-yellow-600',
      confirmed: 'bg-blue-500/20 text-blue-600',
      preparing: 'bg-orange-500/20 text-orange-600',
      delivering: 'bg-purple-500/20 text-purple-600',
      delivered: 'bg-green-500/20 text-green-600',
      cancelled: 'bg-red-500/20 text-red-600'
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const filteredCustomers = customers.filter(customer =>
    customer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm)
  );

  // Generate insights
  const generateInsights = (): string[] => {
    const insights: string[] = [];

    if (stats.topSpender) {
      insights.push(`👑 ${stats.topSpender.name} é seu melhor cliente com ${formatCurrency(stats.topSpender.total)} em compras`);
    }

    if (stats.favoritesCount > 0) {
      const favoritePercent = ((stats.favoritesCount / stats.totalCustomers) * 100).toFixed(0);
      insights.push(`❤️ ${stats.favoritesCount} clientes (${favoritePercent}%) favoritaram sua loja`);
    }

    if (stats.newCustomersThisMonth > 0) {
      insights.push(`🆕 ${stats.newCustomersThisMonth} novos clientes este mês`);
    }

    if (stats.avgTicket > 0) {
      insights.push(`💰 Ticket médio: ${formatCurrency(stats.avgTicket)}`);
    }

    const repeatCustomers = customers.filter(c => c.total_orders > 1).length;
    if (repeatCustomers > 0) {
      const repeatPercent = ((repeatCustomers / customers.length) * 100).toFixed(0);
      insights.push(`🔄 ${repeatPercent}% dos clientes fizeram mais de um pedido`);
    }

    return insights;
  };

  const insights = generateInsights();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Gerencie e analise os clientes do seu comércio</p>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Total de Clientes</p>
                  <HelpTooltip content="Número de clientes únicos que fizeram pedidos na sua loja" />
                </div>
                <p className="text-2xl font-bold text-blue-500">
                  {stats.totalCustomers}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-500/20 bg-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Receita Total</p>
                  <HelpTooltip content="Soma de todas as vendas realizadas para estes clientes" />
                </div>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <DollarSign className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Favoritaram</p>
                  <HelpTooltip content="Clientes que marcaram sua loja como favorita" />
                </div>
                <p className="text-2xl font-bold text-red-500">
                  {stats.favoritesCount}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <Heart className="w-6 h-6 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  <HelpTooltip content="Valor médio gasto por pedido" />
                </div>
                <p className="text-2xl font-bold text-purple-500">
                  {formatCurrency(stats.avgTicket)}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.topSpender && (
          <Card className="border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Maior Gastador</p>
                    <HelpTooltip content="Cliente que mais gastou na sua loja" />
                  </div>
                  <p className="font-medium">{stats.topSpender.name}</p>
                  <p className="text-sm text-yellow-600">{formatCurrency(stats.topSpender.total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {stats.mostFrequent && (
          <Card className="border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-500/10">
                  <ShoppingCart className="w-5 h-5 text-orange-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">Mais Frequente</p>
                    <HelpTooltip content="Cliente com maior número de pedidos" />
                  </div>
                  <p className="font-medium">{stats.mostFrequent.name}</p>
                  <p className="text-sm text-orange-600">{stats.mostFrequent.orders} pedidos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-primary" />
              Insights de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, index) => (
                <p key={index} className="text-sm">{insight}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Clientes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum cliente encontrado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Pedidos</TableHead>
                  <TableHead>Total Gasto</TableHead>
                  <TableHead>Ticket Médio</TableHead>
                  <TableHead>Favorito</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.user_id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.full_name}</p>
                        <p className="text-xs text-muted-foreground">{customer.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {customer.phone ? (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="w-3 h-3" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {customer.city || customer.neighborhood ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="w-3 h-3" />
                          {customer.neighborhood || customer.city}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{customer.total_orders}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-green-600">
                      {formatCurrency(customer.total_spent)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(customer.avg_ticket)}
                    </TableCell>
                    <TableCell>
                      {customer.is_favorite ? (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      ) : (
                        <Heart className="w-4 h-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openCustomerDetails(customer)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              {/* Info do Cliente */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      {selectedCustomer.full_name}
                      {selectedCustomer.is_favorite && (
                        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>
                    {selectedCustomer.phone && (
                      <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Cliente desde</p>
                    <p className="font-medium">
                      {new Date(selectedCustomer.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Estatísticas do Cliente */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <ShoppingCart className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">{selectedCustomer.total_orders}</p>
                    <p className="text-xs text-muted-foreground">Pedidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-500" />
                    <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.total_spent)}</p>
                    <p className="text-xs text-muted-foreground">Total Gasto</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="w-6 h-6 mx-auto mb-2 text-purple-500" />
                    <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.avg_ticket)}</p>
                    <p className="text-xs text-muted-foreground">Ticket Médio</p>
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de Pedidos */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Histórico de Pedidos
                </h4>
                {customerOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum pedido encontrado</p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(order.total)}</p>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {getStatusLabel(order.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceCustomers;
