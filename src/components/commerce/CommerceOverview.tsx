import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Truck,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CommerceOverviewProps {
  commerce: {
    id: string;
    fantasy_name: string;
    status: string;
  };
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalProducts: number;
  activeDeliveries: number;
  completedToday: number;
}

const CommerceOverview = ({ commerce }: CommerceOverviewProps) => {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    totalProducts: 0,
    activeDeliveries: 0,
    completedToday: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch orders stats
      const { data: orders } = await supabase
        .from('orders')
        .select('id, status, total, created_at, order_type')
        .eq('commerce_id', commerce.id);

      const pendingOrders = orders?.filter(o => 
        ['pending', 'confirmed', 'preparing'].includes(o.status)
      ).length || 0;

      const todayOrders = orders?.filter(o => 
        o.created_at.startsWith(today) && o.status === 'delivered'
      ) || [];
      
      const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total), 0);

      const activeDeliveries = orders?.filter(o => 
        o.status === 'delivering' && o.order_type === 'delivery'
      ).length || 0;

      const completedToday = orders?.filter(o => 
        o.created_at.startsWith(today) && o.status === 'delivered'
      ).length || 0;

      // Fetch products count
      const { count: productsCount } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('commerce_id', commerce.id);

      // Fetch recent orders
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .eq('commerce_id', commerce.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setStats({
        totalOrders: orders?.length || 0,
        pendingOrders,
        todayRevenue,
        totalProducts: productsCount || 0,
        activeDeliveries,
        completedToday,
      });
      setRecentOrders(recent || []);
      setLoading(false);
    };

    fetchStats();
  }, [commerce.id]);

  const statCards = [
    {
      title: "Pedidos Pendentes",
      value: stats.pendingOrders,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      title: "Faturamento Hoje",
      value: `R$ ${stats.todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Entregas Ativas",
      value: stats.activeDeliveries,
      icon: Truck,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Finalizados Hoje",
      value: stats.completedToday,
      icon: CheckCircle,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "Total de Produtos",
      value: stats.totalProducts,
      icon: Package,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Total de Pedidos",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500" },
      confirmed: { label: "Confirmado", color: "bg-blue-500/20 text-blue-500" },
      preparing: { label: "Preparando", color: "bg-orange-500/20 text-orange-500" },
      delivering: { label: "Em Entrega", color: "bg-purple-500/20 text-purple-500" },
      delivered: { label: "Entregue", color: "bg-green-500/20 text-green-500" },
      cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-500" },
    };
    return statusConfig[status] || { label: status, color: "bg-muted text-muted-foreground" };
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
      <div>
        <h1 className="text-3xl font-bold">Bem-vindo, {commerce.fantasy_name}!</h1>
        <p className="text-muted-foreground">
          Aqui está o resumo do seu comércio
        </p>
      </div>

      {commerce.status !== 'approved' && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium text-yellow-500">Aguardando Aprovação</p>
              <p className="text-sm text-muted-foreground">
                Seu comércio está em análise. Em breve você poderá receber pedidos.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum pedido recebido ainda
            </p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => {
                const status = getStatusBadge(order.status);
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShoppingCart className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Pedido #{order.id.slice(0, 8)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      <span className="font-bold">
                        R$ {Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceOverview;
