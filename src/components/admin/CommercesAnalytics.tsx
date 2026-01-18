import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Users,
  DollarSign,
  Store,
  ArrowUp,
  ArrowDown,
  Zap,
  Target
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

interface CommerceData {
  id: string;
  fantasy_name: string;
  status: string;
  created_at: string;
  totalOrders: number;
  totalRevenue: number;
  growth: number;
}

interface CommercesAnalyticsProps {
  commerces: any[];
  commerceStats: Record<string, { totalOrders: number; totalRevenue: number; growth: number }>;
}

const CommercesAnalytics: React.FC<CommercesAnalyticsProps> = ({ commerces, commerceStats }) => {
  const approvedCommerces = commerces.filter(c => c.status === 'approved');
  
  // Calculate insights
  const commercesWithStats = approvedCommerces.map(c => ({
    ...c,
    ...commerceStats[c.id] || { totalOrders: 0, totalRevenue: 0, growth: 0 }
  }));

  const topPerformers = [...commercesWithStats]
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  const growingCommerces = [...commercesWithStats]
    .filter(c => c.growth > 0)
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5);

  const needsAttention = commercesWithStats.filter(c => c.growth < -10 || c.totalOrders === 0);

  // Pie chart data for status distribution
  const statusData = [
    { name: 'Aprovados', value: commerces.filter(c => c.status === 'approved').length, color: '#22c55e' },
    { name: 'Pendentes', value: commerces.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    { name: 'Rejeitados', value: commerces.filter(c => c.status === 'rejected').length, color: '#ef4444' },
    { name: 'Suspensos', value: commerces.filter(c => c.status === 'suspended').length, color: '#6b7280' },
  ].filter(d => d.value > 0);

  // Monthly growth data (mock based on created_at)
  const monthlyData = [
    { month: 'Jan', novos: 0, ativos: 0 },
    { month: 'Fev', novos: 0, ativos: 0 },
    { month: 'Mar', novos: 0, ativos: 0 },
    { month: 'Abr', novos: 0, ativos: 0 },
    { month: 'Mai', novos: 0, ativos: 0 },
    { month: 'Jun', novos: 0, ativos: 0 },
  ];

  commerces.forEach(c => {
    const month = new Date(c.created_at).getMonth();
    if (month < 6) {
      monthlyData[month].novos++;
      if (c.status === 'approved') {
        monthlyData[month].ativos++;
      }
    }
  });

  // Calculate totals
  const totalRevenue = commercesWithStats.reduce((sum, c) => sum + c.totalRevenue, 0);
  const totalOrders = commercesWithStats.reduce((sum, c) => sum + c.totalOrders, 0);
  const avgRevenuePerCommerce = approvedCommerces.length > 0 ? totalRevenue / approvedCommerces.length : 0;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-2">
        <Target className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Analytics & Insights</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Faturamento Total</p>
                <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">De todos os comércios ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média por Comércio</p>
                <p className="text-2xl font-bold">{formatCurrency(avgRevenuePerCommerce)}</p>
              </div>
              <Store className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Faturamento médio mensal</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Em Crescimento</p>
                <p className="text-2xl font-bold">{growingCommerces.length}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Comércios com crescimento positivo</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Precisam de Atenção</p>
                <p className="text-2xl font-bold">{needsAttention.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Queda ou sem vendas</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Crescimento de Comércios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="novos" 
                    stackId="1"
                    stroke="#f59e0b" 
                    fill="#f59e0b" 
                    fillOpacity={0.3}
                    name="Novos Cadastros"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="ativos" 
                    stackId="2"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.3}
                    name="Ativos"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers & Needs Attention */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="w-5 h-5 text-amber-500" />
              Top Performers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPerformers.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados suficientes</p>
            ) : (
              <div className="space-y-3">
                {topPerformers.map((commerce, index) => (
                  <div key={commerce.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-amber-500 text-white' :
                        index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{commerce.fantasy_name}</p>
                        <p className="text-xs text-muted-foreground">{commerce.totalOrders} pedidos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-500">{formatCurrency(commerce.totalRevenue)}</p>
                      {commerce.growth !== 0 && (
                        <div className={`flex items-center gap-1 text-xs ${commerce.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {commerce.growth > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                          {Math.abs(commerce.growth).toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growing Fast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5 text-primary" />
              Crescimento Acelerado
            </CardTitle>
          </CardHeader>
          <CardContent>
            {growingCommerces.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Sem dados de crescimento</p>
            ) : (
              <div className="space-y-3">
                {growingCommerces.map((commerce) => (
                  <div key={commerce.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                        {commerce.fantasy_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{commerce.fantasy_name}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(commerce.totalRevenue)}</p>
                      </div>
                    </div>
                    <Badge variant="success" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      +{commerce.growth.toFixed(1)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Needs Attention */}
      {needsAttention.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-amber-500">
              <AlertTriangle className="w-5 h-5" />
              Comércios que Precisam de Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {needsAttention.slice(0, 6).map((commerce) => (
                <div key={commerce.id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500 font-bold">
                      {commerce.fantasy_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{commerce.fantasy_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {commerce.totalOrders === 0 ? 'Sem vendas' : `${commerce.totalOrders} pedidos`}
                      </p>
                    </div>
                  </div>
                  {commerce.growth < 0 && (
                    <Badge variant="destructive" className="gap-1">
                      <TrendingDown className="w-3 h-3" />
                      {commerce.growth.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommercesAnalytics;
