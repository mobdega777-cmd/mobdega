import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  Store, 
  DollarSign, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";

interface Stats {
  totalUsers: number;
  totalCommerces: number;
  pendingCommerces: number;
  approvedCommerces: number;
  monthlyRevenue: number;
  pendingInvoices: number;
}

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalCommerces: 0,
    pendingCommerces: 0,
    approvedCommerces: 0,
    monthlyRevenue: 0,
    pendingInvoices: 0,
  });
  const [recentCommerces, setRecentCommerces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchRecentCommerces();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch commerces stats
      const { data: commercesData } = await supabase
        .from('commerces')
        .select('status');

      const totalCommerces = commercesData?.length || 0;
      const pendingCommerces = commercesData?.filter(c => c.status === 'pending').length || 0;
      const approvedCommerces = commercesData?.filter(c => c.status === 'approved').length || 0;

      // Fetch invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('amount, status');

      const monthlyRevenue = invoicesData
        ?.filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      const pendingInvoices = invoicesData?.filter(i => i.status === 'pending').length || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalCommerces,
        pendingCommerces,
        approvedCommerces,
        monthlyRevenue,
        pendingInvoices,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentCommerces = async () => {
    const { data } = await supabase
      .from('commerces')
      .select('*, plans(name)')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentCommerces(data || []);
  };

  const statCards = [
    {
      title: "Total Usuários",
      value: stats.totalUsers,
      icon: Users,
      color: "primary",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Comércios Ativos",
      value: stats.approvedCommerces,
      icon: Store,
      color: "secondary",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Faturamento Mensal",
      value: formatCurrency(stats.monthlyRevenue),
      icon: DollarSign,
      color: "success",
      trend: "+23%",
      trendUp: true,
    },
    {
      title: "Aguardando Aprovação",
      value: stats.pendingCommerces,
      icon: Clock,
      color: "warning",
      trend: stats.pendingCommerces > 0 ? "Atenção" : "OK",
      trendUp: false,
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: "bg-yellow-500/20 text-yellow-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      suspended: "bg-gray-500/20 text-gray-400",
    };
    const labels = {
      pending: "Pendente",
      approved: "Aprovado",
      rejected: "Rejeitado",
      suspended: "Suspenso",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Visão Geral
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Bem-vindo ao painel administrativo do Mobdega
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                      <Icon className={`w-6 h-6 text-${stat.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 text-sm ${
                      stat.trendUp ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {stat.trendUp ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {stat.trend}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stat.title}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Commerces */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Comércios Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentCommerces.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum comércio cadastrado ainda
            </p>
          ) : (
            <div className="space-y-4">
              {recentCommerces.map((commerce) => (
                <div
                  key={commerce.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                      {commerce.fantasy_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {commerce.fantasy_name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {commerce.city} • {commerce.plans?.name || 'Sem plano'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(commerce.status)}
                    <span className="text-sm text-muted-foreground">
                      {new Date(commerce.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Aprovar Comércios</h3>
              <p className="text-sm text-muted-foreground">
                {stats.pendingCommerces} aguardando
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-secondary/10 to-secondary/5 hover:from-secondary/20 hover:to-secondary/10 transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-secondary/20">
              <DollarSign className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Gerar Faturas</h3>
              <p className="text-sm text-muted-foreground">
                Criar faturas mensais
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-accent/10 to-accent/5 hover:from-accent/20 hover:to-accent/10 transition-all cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-accent/20">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Ver Relatórios</h3>
              <p className="text-sm text-muted-foreground">
                Análise completa
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
