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
  Settings,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import DateFilter from "./DateFilter";
import SystemUpdates from "./SystemUpdates";
import { formatCurrency } from "@/lib/formatCurrency";
import { getSupabaseDateRange, getTodayDateRange } from "@/lib/dateUtils";
import HelpTooltip from "@/components/ui/help-tooltip";

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
  const todayRange = getTodayDateRange();
  const [dateFilter, setDateFilter] = useState({ start: todayRange.start, end: todayRange.end });
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
      const { startISO, endISO } = getSupabaseDateRange(dateFilter.start, dateFilter.end);
      
      // Busca pedidos para status e entregas ativas
      const { data: orders } = await supabase.from('orders').select('id, status, total, created_at, order_type').eq('commerce_id', commerce.id);
      
      // Busca cash_movements como fonte única de verdade para faturamento
      const { data: cashMovements } = await supabase
        .from('cash_movements')
        .select('id, type, amount, created_at, payment_method')
        .eq('commerce_id', commerce.id)
        .eq('type', 'sale')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      // Buscar configuração de taxas dos métodos de pagamento
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('type, fee_percentage, fee_fixed')
        .eq('commerce_id', commerce.id)
        .eq('is_active', true);

      const feeMap = new Map(paymentMethods?.map(pm => [pm.type, { pct: pm.fee_percentage || 0, fixed: pm.fee_fixed || 0 }]) || []);
      
      const pendingOrders = orders?.filter(o => ['pending', 'confirmed', 'preparing'].includes(o.status)).length || 0;
      const activeDeliveries = orders?.filter(o => o.status === 'delivering' && o.order_type === 'delivery').length || 0;
      
      // Faturamento bruto e cálculo de taxas
      const grossRevenue = cashMovements?.reduce((s, m) => s + Number(m.amount), 0) || 0;
      
      // Calcular taxas das operadoras
      let operatorFees = 0;
      cashMovements?.forEach(movement => {
        const fee = feeMap.get(movement.payment_method || '');
        if (fee) {
          operatorFees += Number(movement.amount) * (fee.pct / 100) + fee.fixed;
        }
      });
      
      // Faturamento líquido (após taxas)
      const netRevenue = grossRevenue - operatorFees;
      const completedCount = cashMovements?.length || 0;
      
      const { count: productsCount } = await supabase.from('products').select('id', { count: 'exact', head: true }).eq('commerce_id', commerce.id);
      
      // Pedidos recentes filtrados por data
      const { data: recent } = await supabase
        .from('orders')
        .select('*')
        .eq('commerce_id', commerce.id)
        .gte('created_at', startISO)
        .lte('created_at', endISO)
        .order('created_at', { ascending: false })
        .limit(10);
      
      setStats({ 
        totalOrders: orders?.length || 0, 
        pendingOrders, 
        todayRevenue: netRevenue, 
        totalProducts: productsCount || 0, 
        activeDeliveries, 
        completedToday: completedCount 
      });
      setRecentOrders(recent || []);
      setLoading(false);
    };
    fetchStats();
  }, [commerce.id, dateFilter]);

  const shareUrl = `https://mobdega.lovable.app/loja/${commerce.id}`;
  const shareMessage = `🎉 Conheça ${commerce.fantasy_name}!\n\n✨ Novidades:\n📱 Cardápio digital\n🛵 Pedidos delivery pelo app\n💳 Pagamento online\n\nAcesse: ${shareUrl}`;

  const handleShare = (platform: 'whatsapp' | 'facebook' | 'twitter' | 'instagram') => {
    const encodedMessage = encodeURIComponent(shareMessage);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    const urls = {
      whatsapp: `https://wa.me/?text=${encodedMessage}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodeURIComponent(`Conheça ${commerce.fantasy_name}!`)}`,
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}`,
      instagram: '' // Instagram não tem API de compartilhamento, apenas copia o link
    };

    if (platform === 'instagram') {
      navigator.clipboard.writeText(shareMessage);
      toast({ title: "Link copiado!", description: "Cole no Instagram para compartilhar." });
      return;
    }

    window.open(urls[platform], '_blank', 'width=600,height=400');
  };

  // Using centralized formatCurrency from @/lib/formatCurrency

  const statCards = [
    { title: "Pedidos Pendentes", value: stats.pendingOrders, icon: Clock, color: "text-yellow-500", bgColor: "bg-yellow-500/10", tooltip: "Pedidos que estão aguardando confirmação, em preparo ou para serem entregues." },
    { title: "Faturamento Líquido", value: formatCurrency(stats.todayRevenue), icon: DollarSign, color: "text-green-500", bgColor: "bg-green-500/10", tooltip: "Total de vendas concluídas no período selecionado menos as taxas das operadoras de cartão." },
    { title: "Entregas Ativas", value: stats.activeDeliveries, icon: Truck, color: "text-blue-500", bgColor: "bg-blue-500/10", tooltip: "Pedidos de delivery que estão em rota de entrega neste momento." },
    { title: "Finalizados no Período", value: stats.completedToday, icon: CheckCircle, color: "text-emerald-500", bgColor: "bg-emerald-500/10", tooltip: "Quantidade de pedidos concluídos com sucesso no período selecionado." },
    { title: "Total de Produtos", value: stats.totalProducts, icon: Package, color: "text-purple-500", bgColor: "bg-purple-500/10", tooltip: "Quantidade de produtos cadastrados no seu cardápio." },
    { title: "Total de Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-primary", bgColor: "bg-primary/10", tooltip: "Todos os pedidos recebidos desde a criação do comércio." },
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
          
          {/* Botão de Compartilhar */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="text-xs md:text-sm">
                <Share2 className="w-4 h-4 mr-1 md:mr-2" />
                Compartilhar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Twitter/X
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleShare('instagram')} className="cursor-pointer">
                <svg className="w-4 h-4 mr-2 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram (copiar)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Card key={stat.title} className="border-border/50">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p>
                    <HelpTooltip content={stat.tooltip} className="flex-shrink-0" />
                  </div>
                  <p className="text-lg md:text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-3 rounded-xl ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 md:w-6 md:h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ); })}
      </div>

      {/* Atualizações do Sistema */}
      <SystemUpdates />

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
