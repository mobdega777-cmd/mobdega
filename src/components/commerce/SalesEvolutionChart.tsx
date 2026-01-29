import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent 
} from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, eachDayOfInterval, startOfWeek, endOfWeek, eachWeekOfInterval, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatCurrency";
import { getSupabaseDateRange } from "@/lib/dateUtils";

interface SalesEvolutionChartProps {
  commerceId: string;
  dateFilter: { start: Date; end: Date };
}

interface DailyData {
  date: string;
  fullDate: string;
  revenue: number;
  orders: number;
}

interface WeeklyData {
  week: string;
  weekLabel: string;
  revenue: number;
  orders: number;
}

interface PaymentFee {
  pct: number;
  fixed: number;
}
const chartConfig = {
  revenue: {
    label: "Faturamento",
    color: "hsl(var(--primary))",
  },
  orders: {
    label: "Pedidos",
    color: "hsl(142 76% 36%)", // Green
  },
};

const SalesEvolutionChart = ({ commerceId, dateFilter }: SalesEvolutionChartProps) => {
  const [viewMode, setViewMode] = useState<'daily' | 'weekly'>('daily');
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      
      // Usa conversão correta de timezone para queries
      const { startISO, endISO } = getSupabaseDateRange(dateFilter.start, dateFilter.end);
      
      // Buscar configuração de taxas dos métodos de pagamento
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('type, fee_percentage, fee_fixed')
        .eq('commerce_id', commerceId)
        .eq('is_active', true);

      const feeMap = new Map<string, PaymentFee>(
        paymentMethods?.map(pm => [pm.type, { pct: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]) || []
      );
      
      // IMPORTANTE: Usar apenas cash_movements para faturamento real
      // Os cash_movements já contêm o valor final (com descontos aplicados)
      // Evita duplicação entre orders e movements
      const { data: cashMovements } = await supabase
        .from('cash_movements')
        .select('amount, created_at, payment_method')
        .eq('commerce_id', commerceId)
        .eq('type', 'sale')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      // Process daily data
      const dailyMap = new Map<string, { revenue: number; orders: number }>();
      
      // Initialize all days in the range
      const daysInRange = eachDayOfInterval({ start: dateFilter.start, end: dateFilter.end });
      daysInRange.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyMap.set(dateKey, { revenue: 0, orders: 0 });
      });

      // Add cash movements data (única fonte de faturamento)
      // IMPORTANTE: Usa T12:00:00 para evitar shift de timezone
      // IMPORTANTE: Desconta taxas de maquininha para valor líquido
      cashMovements?.forEach(movement => {
        const movementDate = new Date(movement.created_at.replace('Z', ''));
        const dateKey = format(movementDate, 'yyyy-MM-dd');
        const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };
        
        // Calcular taxa da operadora
        const amount = Number(movement.amount);
        const fee = feeMap.get(movement.payment_method || '');
        const operatorFee = fee ? (amount * (fee.pct / 100) + fee.fixed) : 0;
        const netAmount = amount - operatorFee;
        
        dailyMap.set(dateKey, {
          revenue: existing.revenue + netAmount,
          orders: existing.orders + 1
        });
      });

      // Convert to array and sort
      // IMPORTANTE: Adiciona T12:00:00 para evitar shift de timezone UTC
      const dailyArray: DailyData[] = Array.from(dailyMap.entries())
        .map(([dateKey, data]) => {
          const localDate = new Date(`${dateKey}T12:00:00`);
          return {
            date: format(localDate, 'dd/MM', { locale: ptBR }),
            fullDate: format(localDate, 'dd/MM/yyyy', { locale: ptBR }),
            revenue: data.revenue,
            orders: data.orders
          };
        })
        .sort((a, b) => {
          const [dA, mA, yA] = a.fullDate.split('/').map(Number);
          const [dB, mB, yB] = b.fullDate.split('/').map(Number);
          return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
        });

      setDailyData(dailyArray);

      // Process weekly data
      const weeks = eachWeekOfInterval({ start: dateFilter.start, end: dateFilter.end }, { weekStartsOn: 0 });
      const weeklyArray: WeeklyData[] = weeks.map((weekStart, index) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 });
        const weekData = { revenue: 0, orders: 0 };

        dailyArray.forEach(day => {
          const [d, m, y] = day.fullDate.split('/').map(Number);
          const dayDate = new Date(y, m - 1, d);
          if (dayDate >= weekStart && dayDate <= weekEnd) {
            weekData.revenue += day.revenue;
            weekData.orders += day.orders;
          }
        });

        return {
          week: `Sem ${index + 1}`,
          weekLabel: `${format(weekStart, 'dd/MM', { locale: ptBR })} - ${format(weekEnd, 'dd/MM', { locale: ptBR })}`,
          revenue: weekData.revenue,
          orders: weekData.orders
        };
      });

      setWeeklyData(weeklyArray);
      setLoading(false);
    };

    fetchSalesData();
  }, [commerceId, dateFilter]);

  const currentData = viewMode === 'daily' ? dailyData : weeklyData;
  const xAxisKey = viewMode === 'daily' ? 'date' : 'week';

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-80">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <TrendingUp className="w-5 h-5 shrink-0" />
              <span>Evolução de Vendas</span>
            </CardTitle>
            <CardDescription className="text-sm">Faturamento e pedidos ao longo do período</CardDescription>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button
              variant={viewMode === 'daily' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('daily')}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <Calendar className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Diário</span>
            </Button>
            <Button
              variant={viewMode === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('weekly')}
              className="text-xs sm:text-sm px-2 sm:px-3"
            >
              <BarChart3 className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Semanal</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentData.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            Nenhum dado de vendas no período selecionado
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-80 w-full">
            {viewMode === 'daily' ? (
              <AreaChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey={xAxisKey} 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [formatCurrency(Number(value)), 'Faturamento'];
                        }
                        return [value, 'Pedidos'];
                      }}
                    />
                  } 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#revenueGradient)" 
                  name="revenue"
                />
              </AreaChart>
            ) : (
              <BarChart data={currentData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey={xAxisKey} 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  className="text-xs fill-muted-foreground"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <ChartTooltip 
                  content={
                    <ChartTooltipContent 
                      formatter={(value, name) => {
                        if (name === 'revenue') {
                          return [formatCurrency(Number(value)), 'Faturamento'];
                        }
                        return [value, 'Pedidos'];
                      }}
                    />
                  } 
                />
                <Bar 
                  dataKey="revenue" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="revenue"
                />
              </BarChart>
            )}
          </ChartContainer>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total do Período</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(currentData.reduce((sum, d) => sum + d.revenue, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Média {viewMode === 'daily' ? 'Diária' : 'Semanal'}</p>
            <p className="text-lg font-bold">
              {formatCurrency(currentData.length > 0 
                ? currentData.reduce((sum, d) => sum + d.revenue, 0) / currentData.length 
                : 0
              )}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total de Pedidos</p>
            <p className="text-lg font-bold text-green-500">
              {currentData.reduce((sum, d) => sum + d.orders, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesEvolutionChart;
