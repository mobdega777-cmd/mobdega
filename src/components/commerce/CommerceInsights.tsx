import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Target, 
  Users, 
  Calendar,
  Sparkles,
  BarChart3,
  Clock,
  Star,
  ShoppingBag,
  Percent
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatCurrency";

interface CommerceInsightsProps {
  commerceId: string;
}

interface InsightData {
  avgTicket: number;
  avgTicketChange: number;
  peakHour: string;
  peakDay: string;
  topProduct: string;
  topProductSales: number;
  returningCustomers: number;
  newCustomers: number;
  conversionRate: number;
  totalCustomers: number;
  monthlyGrowth: number;
  weeklyOrders: number;
  avgOrdersPerDay: number;
}

const CommerceInsights = ({ commerceId }: CommerceInsightsProps) => {
  const [insights, setInsights] = useState<InsightData>({
    avgTicket: 0,
    avgTicketChange: 0,
    peakHour: "N/A",
    peakDay: "N/A",
    topProduct: "N/A",
    topProductSales: 0,
    returningCustomers: 0,
    newCustomers: 0,
    conversionRate: 0,
    totalCustomers: 0,
    monthlyGrowth: 0,
    weeklyOrders: 0,
    avgOrdersPerDay: 0
  });
  const [loading, setLoading] = useState(true);
  const [tips, setTips] = useState<string[]>([]);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        // Buscar pedidos dos últimos 30 dias
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: recentOrders } = await supabase
          .from('orders')
          .select('id, total, created_at, user_id, status')
          .eq('commerce_id', commerceId)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'delivered');

        const { data: previousOrders } = await supabase
          .from('orders')
          .select('id, total, created_at')
          .eq('commerce_id', commerceId)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString())
          .eq('status', 'delivered');

        const { data: weeklyOrdersData } = await supabase
          .from('orders')
          .select('id')
          .eq('commerce_id', commerceId)
          .gte('created_at', sevenDaysAgo.toISOString());

        // Buscar itens mais vendidos
        const { data: orderItems } = await supabase
          .from('order_items')
          .select('product_name, quantity, order_id')
          .in('order_id', recentOrders?.map(o => o.id) || []);

        // Calcular ticket médio
        const currentAvgTicket = recentOrders?.length 
          ? recentOrders.reduce((sum, o) => sum + Number(o.total), 0) / recentOrders.length 
          : 0;
        
        const previousAvgTicket = previousOrders?.length 
          ? previousOrders.reduce((sum, o) => sum + Number(o.total), 0) / previousOrders.length 
          : 0;

        const avgTicketChange = previousAvgTicket > 0 
          ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket) * 100 
          : 0;

        // Encontrar horário de pico
        const hourCounts: Record<number, number> = {};
        recentOrders?.forEach(order => {
          const hour = new Date(order.created_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHourNum = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0];
        const peakHour = peakHourNum ? `${peakHourNum[0]}:00 - ${Number(peakHourNum[0]) + 1}:00` : "N/A";

        // Encontrar dia de pico
        const dayCounts: Record<string, number> = {};
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        recentOrders?.forEach(order => {
          const day = dayNames[new Date(order.created_at).getDay()];
          dayCounts[day] = (dayCounts[day] || 0) + 1;
        });
        const peakDayEntry = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0];
        const peakDay = peakDayEntry ? peakDayEntry[0] : "N/A";

        // Produto mais vendido
        const productCounts: Record<string, number> = {};
        orderItems?.forEach(item => {
          productCounts[item.product_name] = (productCounts[item.product_name] || 0) + item.quantity;
        });
        const topProductEntry = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0];
        const topProduct = topProductEntry ? topProductEntry[0] : "N/A";
        const topProductSales = topProductEntry ? topProductEntry[1] : 0;

        // Clientes únicos
        const uniqueCustomers = new Set(recentOrders?.map(o => o.user_id) || []);
        const totalCustomers = uniqueCustomers.size;

        // Clientes que compraram mais de uma vez
        const customerOrderCounts: Record<string, number> = {};
        recentOrders?.forEach(order => {
          customerOrderCounts[order.user_id] = (customerOrderCounts[order.user_id] || 0) + 1;
        });
        const returningCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
        const newCustomers = totalCustomers - returningCustomers;

        // Taxa de retenção
        const conversionRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

        // Crescimento mensal
        const currentMonthTotal = recentOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const previousMonthTotal = previousOrders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
        const monthlyGrowth = previousMonthTotal > 0 
          ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 
          : 0;

        // Média de pedidos por dia
        const avgOrdersPerDay = (recentOrders?.length || 0) / 30;

        setInsights({
          avgTicket: currentAvgTicket,
          avgTicketChange,
          peakHour,
          peakDay,
          topProduct,
          topProductSales,
          returningCustomers,
          newCustomers,
          conversionRate,
          totalCustomers,
          monthlyGrowth,
          weeklyOrders: weeklyOrdersData?.length || 0,
          avgOrdersPerDay
        });

        // Gerar dicas dinâmicas baseadas nos dados
        const generatedTips: string[] = [];

        if (insights.avgOrdersPerDay < 1) {
          generatedTips.push("💡 Considere criar promoções para dias de baixo movimento para aumentar o fluxo de pedidos.");
        }
        
        if (peakHour !== "N/A") {
          generatedTips.push(`⏰ Seu horário de pico é ${peakHour}. Garanta equipe reforçada nesse período!`);
        }

        if (peakDay !== "N/A") {
          generatedTips.push(`📅 ${peakDay} é seu melhor dia! Considere promoções especiais para dias mais fracos.`);
        }

        if (conversionRate < 20) {
          generatedTips.push("🎯 Taxa de retenção baixa. Implemente um programa de fidelidade para aumentar clientes recorrentes.");
        }

        if (topProduct !== "N/A") {
          generatedTips.push(`🏆 "${topProduct}" é seu campeão de vendas! Destaque-o no cardápio e considere combos.`);
        }

        if (avgTicketChange < 0) {
          generatedTips.push("📉 Ticket médio em queda. Sugira acompanhamentos ou produtos complementares.");
        } else if (avgTicketChange > 10) {
          generatedTips.push("📈 Excelente! Seu ticket médio está crescendo. Continue com a estratégia atual!");
        }

        if (newCustomers > returningCustomers) {
          generatedTips.push("👋 Muitos clientes novos! Ofereça cupom de desconto para segunda compra.");
        }

        // Dicas fixas de marketing
        generatedTips.push("📸 Poste fotos dos produtos no Instagram com frequência para atrair novos clientes.");
        generatedTips.push("💬 Responda avaliações de clientes rapidamente - isso aumenta a confiança na sua marca.");

        setTips(generatedTips.slice(0, 4)); // Mostrar no máximo 4 dicas
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar insights:', error);
        setLoading(false);
      }
    };

    fetchInsights();
  }, [commerceId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="p-4 md:p-6">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <Sparkles className="w-5 h-5 text-primary" />
          Insights Poderosos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6 pt-0 md:pt-0 space-y-4">
        {/* Métricas principais em grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Ticket Médio */}
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Ticket Médio</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(insights.avgTicket)}</p>
            <div className="flex items-center gap-1 mt-1">
              {insights.avgTicketChange >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={`text-xs ${insights.avgTicketChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {insights.avgTicketChange >= 0 ? '+' : ''}{insights.avgTicketChange.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Horário de Pico */}
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Horário de Pico</span>
            </div>
            <p className="text-lg font-bold">{insights.peakHour}</p>
            <span className="text-xs text-muted-foreground">Mais vendas</span>
          </div>

          {/* Dia de Pico */}
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Melhor Dia</span>
            </div>
            <p className="text-lg font-bold">{insights.peakDay}</p>
            <span className="text-xs text-muted-foreground">Maior movimento</span>
          </div>

          {/* Taxa de Retenção */}
          <div className="p-3 rounded-lg bg-background border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <Percent className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Retenção</span>
            </div>
            <p className="text-lg font-bold">{insights.conversionRate.toFixed(1)}%</p>
            <span className="text-xs text-muted-foreground">Clientes recorrentes</span>
          </div>
        </div>

        {/* Métricas secundárias */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-muted-foreground">Produto Campeão</span>
            </div>
            <p className="font-medium text-sm mt-1 truncate">{insights.topProduct}</p>
            <span className="text-xs text-muted-foreground">{insights.topProductSales} vendas</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Clientes Novos</span>
            </div>
            <p className="font-medium text-sm mt-1">{insights.newCustomers}</p>
            <span className="text-xs text-muted-foreground">Últimos 30 dias</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Clientes Fiéis</span>
            </div>
            <p className="font-medium text-sm mt-1">{insights.returningCustomers}</p>
            <span className="text-xs text-muted-foreground">Compraram +1x</span>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Crescimento</span>
            </div>
            <p className={`font-medium text-sm mt-1 ${insights.monthlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {insights.monthlyGrowth >= 0 ? '+' : ''}{insights.monthlyGrowth.toFixed(1)}%
            </p>
            <span className="text-xs text-muted-foreground">vs mês anterior</span>
          </div>
        </div>

        {/* Dicas de Marketing */}
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <span className="font-medium text-sm">Dicas Personalizadas</span>
          </div>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <div 
                key={index} 
                className="p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-sm text-muted-foreground"
              >
                {tip}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommerceInsights;
