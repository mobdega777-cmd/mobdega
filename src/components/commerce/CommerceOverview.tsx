import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Clock,
  CheckCircle,
  Truck,
  Store,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DateFilter from "./DateFilter";
import { startOfDay, endOfDay } from "date-fns";
import { formatCurrency } from "@/lib/formatCurrency";

interface OpeningHours {
  [key: string]: { open: string; close: string; enabled: boolean };
}

interface CommerceOverviewProps {
  commerce: { id: string; fantasy_name: string; status: string };
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  todayRevenue: number;
  totalProducts: number;
  activeDeliveries: number;
  completedToday: number;
}

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: "08:00", close: "22:00", enabled: true },
  tuesday: { open: "08:00", close: "22:00", enabled: true },
  wednesday: { open: "08:00", close: "22:00", enabled: true },
  thursday: { open: "08:00", close: "22:00", enabled: true },
  friday: { open: "08:00", close: "22:00", enabled: true },
  saturday: { open: "08:00", close: "22:00", enabled: true },
  sunday: { open: "08:00", close: "22:00", enabled: false },
};

const DAY_NAMES: Record<string, string> = {
  monday: "Segunda", tuesday: "Terça", wednesday: "Quarta",
  thursday: "Quinta", friday: "Sexta", saturday: "Sábado", sunday: "Domingo",
};

const CommerceOverview = ({ commerce }: CommerceOverviewProps) => {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, pendingOrders: 0, todayRevenue: 0, totalProducts: 0, activeDeliveries: 0, completedToday: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState({ start: startOfDay(new Date()), end: endOfDay(new Date()) });
  const [isOpen, setIsOpen] = useState(true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(DEFAULT_HOURS);
  const [savingStatus, setSavingStatus] = useState(false);
  const [hoursDialogOpen, setHoursDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCommerceStatus = async () => {
      const { data } = await supabase.from('commerces').select('is_open, opening_hours').eq('id', commerce.id).single();
      if (data) {
        setIsOpen(data.is_open ?? true);
        if (data.opening_hours) setOpeningHours(data.opening_hours as OpeningHours);
      }
    };
    fetchCommerceStatus();
  }, [commerce.id]);

  const handleStoreStatusChange = async (newStatus: boolean) => {
    setSavingStatus(true);
    setIsOpen(newStatus);
    const { error } = await supabase.from('commerces').update({ is_open: newStatus }).eq('id', commerce.id);
    if (error) { toast({ variant: "destructive", title: "Erro ao atualizar status" }); setIsOpen(!newStatus); }
    else { toast({ title: newStatus ? "Loja aberta!" : "Loja fechada!" }); }
    setSavingStatus(false);
  };

  const handleHoursChange = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    setOpeningHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
  };

  const saveOpeningHours = async () => {
    setSavingStatus(true);
    const { error } = await supabase.from('commerces').update({ opening_hours: openingHours }).eq('id', commerce.id);
    if (error) toast({ variant: "destructive", title: "Erro ao salvar horários" });
    else { toast({ title: "Horários salvos!" }); setHoursDialogOpen(false); }
    setSavingStatus(false);
  };

  useEffect(() => {
    const fetchStats = async () => {
      const { data: orders } = await supabase.from('orders').select('id, status, total, created_at, order_type').eq('commerce_id', commerce.id);
      const { data: cashMovements } = await supabase.from('cash_movements').select('id, type, amount, created_at').eq('commerce_id', commerce.id).eq('type', 'sale');
      const pendingOrders = orders?.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length || 0;
      const filteredOrders = orders?.filter(o => { const d = new Date(o.created_at); return d >= dateFilter.start && d <= dateFilter.end && o.status === 'delivered'; }) || [];
      const filteredMovements = cashMovements?.filter(m => { const d = new Date(m.created_at); return d >= dateFilter.start && d <= dateFilter.end; }) || [];
      const dateRangeRevenue = filteredOrders.reduce((s, o) => s + Number(o.total), 0) + filteredMovements.reduce((s, m) => s + Number(m.amount), 0);
      const activeDeliveries = orders?.filter(o => o.status === 'delivering' && o.order_type === 'delivery').length || 0;
      const { count: productsCount } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('commerce_id', commerce.id);
      const { data: recent } = await supabase.from('orders').select('*').eq('commerce_id', commerce.id).order('created_at', { ascending: false }).limit(5);
      setStats({ totalOrders: orders?.length || 0, pendingOrders, todayRevenue: dateRangeRevenue, totalProducts: productsCount || 0, activeDeliveries, completedToday: filteredOrders.length + filteredMovements.length });
      setRecentOrders(recent || []);
      setLoading(false);
    };
    fetchStats();
  }, [commerce.id, dateFilter]);

  // Using centralized formatCurrency from @/lib/formatCurrency

  const statCards = [
    { title: "Pedidos Pendentes", value: stats.pendingOrders, icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
    { title: "Faturamento do Período", value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Entregas Ativas", value: stats.activeDeliveries, icon: Truck, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Finalizados no Período", value: stats.completedToday, icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-500/10" },
    { title: "Total de Produtos", value: stats.totalProducts, icon: Package, color: "text-purple-500", bgColor: "bg-purple-500/10" },
    { title: "Total de Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary", bgColor: "bg-primary/10" },
  ];

  const getStatusBadge = (status: string) => {
    const cfg: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500" },
      confirmed: { label: "Confirmado", color: "bg-blue-500/20 text-blue-500" },
      preparing: { label: "Preparando", color: "bg-orange-500/20 text-orange-500" },
      delivering: { label: "Em Entrega", color: "bg-purple-500/20 text-purple-500" },
      delivered: { label: "Entregue", color: "bg-green-500/20 text-green-500" },
      cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-500" },
    };
    return cfg[status] || { label: status, color: "bg-muted text-muted-foreground" };
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div></div>;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">Bem-vindo, {commerce.fantasy_name}!</h1>
          <p className="text-muted-foreground text-sm md:text-base">Aqui está o resumo do seu comércio</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card">
            <Store className={`w-4 h-4 md:w-5 md:h-5 ${isOpen ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-xs md:text-sm font-medium">{isOpen ? 'Aberto' : 'Fechado'}</span>
            <Switch checked={isOpen} onCheckedChange={handleStoreStatusChange} disabled={savingStatus} />
          </div>
          <Dialog open={hoursDialogOpen} onOpenChange={setHoursDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs md:text-sm"><Settings className="w-4 h-4 mr-1 md:mr-2" />Horários</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Horário de Funcionamento</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-60 md:max-h-80 overflow-y-auto">
                {Object.entries(DAY_NAMES).map(([key, name]) => (
                  <div key={key} className="flex items-center gap-2 md:gap-3 p-2 rounded-lg bg-muted/30">
                    <Switch checked={openingHours[key]?.enabled} onCheckedChange={(v) => handleHoursChange(key, 'enabled', v)} />
                    <span className="w-16 md:w-20 text-xs md:text-sm font-medium">{name}</span>
                    <Input type="time" value={openingHours[key]?.open || '08:00'} onChange={(e) => handleHoursChange(key, 'open', e.target.value)} className="w-20 md:w-24 h-8 text-xs md:text-sm" disabled={!openingHours[key]?.enabled} />
                    <span className="text-muted-foreground text-xs">-</span>
                    <Input type="time" value={openingHours[key]?.close || '22:00'} onChange={(e) => handleHoursChange(key, 'close', e.target.value)} className="w-20 md:w-24 h-8 text-xs md:text-sm" disabled={!openingHours[key]?.enabled} />
                  </div>
                ))}
              </div>
              <Button onClick={saveOpeningHours} disabled={savingStatus} className="w-full mt-4">{savingStatus ? 'Salvando...' : 'Salvar Horários'}</Button>
            </DialogContent>
          </Dialog>
          <DateFilter onDateChange={(s, e) => setDateFilter({ start: s, end: e })} defaultValue="today" />
        </div>
      </div>

      {commerce.status !== 'approved' && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="w-5 h-5 text-yellow-500" />
            <div><p className="font-medium text-yellow-500">Aguardando Aprovação</p><p className="text-sm text-muted-foreground">Seu comércio está em análise.</p></div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {statCards.map((stat) => { const Icon = stat.icon; return (
          <Card key={stat.title} className="border-border/50"><CardContent className="p-3 md:p-6"><div className="flex items-center justify-between"><div className="min-w-0"><p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p><p className="text-lg md:text-2xl font-bold mt-1">{stat.value}</p></div><div className={`p-2 md:p-3 rounded-xl ${stat.bgColor}`}><Icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.color}`} /></div></div></CardContent></Card>
        ); })}
      </div>

      <Card>
        <CardHeader className="p-4 md:p-6"><CardTitle className="flex items-center gap-2 text-base md:text-lg"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5" />Pedidos Recentes</CardTitle></CardHeader>
        <CardContent className="p-3 md:p-6 pt-0 md:pt-0">
          {recentOrders.length === 0 ? <p className="text-center text-muted-foreground py-8 text-sm">Nenhum pedido recebido ainda</p> : (
            <div className="space-y-2 md:space-y-3">
              {recentOrders.map((order) => { const status = getStatusBadge(order.status); return (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors gap-2 sm:gap-4">
                  <div className="flex items-center gap-3 md:gap-4"><div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"><ShoppingCart className="w-4 h-4 md:w-5 md:h-5 text-primary" /></div><div className="min-w-0"><p className="font-medium text-sm md:text-base truncate">Pedido #{order.id.slice(0, 8)}</p><p className="text-xs md:text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString('pt-BR')}</p></div></div>
                  <div className="flex items-center gap-2 md:gap-4 ml-11 sm:ml-0"><span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span><span className="font-bold text-sm md:text-base">{formatCurrency(Number(order.total))}</span></div>
                </div>
              ); })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceOverview;
