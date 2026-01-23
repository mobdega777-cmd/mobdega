import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Store,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  User,
  FileText,
  Crown,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  Star,
  Users,
  Truck,
  CreditCard,
  Building,
  Globe,
  Hash
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CommerceDetailsModalProps {
  commerce: any;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: string) => void;
}

interface CommerceStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  avgOrderValue: number;
  totalCategories: number;
  pendingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueGrowth: number;
  ordersGrowth: number;
}

const CommerceDetailsModal: React.FC<CommerceDetailsModalProps> = ({
  commerce,
  isOpen,
  onClose,
  onStatusChange
}) => {
  const [stats, setStats] = useState<CommerceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [couponInfo, setCouponInfo] = useState<{ discount_type: string; discount_value: number } | null>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    if (commerce?.id && isOpen) {
      fetchCommerceDetails();
    }
  }, [commerce?.id, isOpen]);

  const fetchCommerceDetails = async () => {
    setLoading(true);
    setCouponInfo(null);
    
    // Fetch plan details
    if (commerce.plan_id) {
      const { data: planData } = await supabase
        .from('plans')
        .select('*')
        .eq('id', commerce.plan_id)
        .single();
      setPlan(planData);
    }

    // Fetch coupon info if commerce used one
    if (commerce.coupon_code) {
      const { data: couponData } = await supabase
        .from('discount_coupons')
        .select('discount_type, discount_value')
        .eq('code', commerce.coupon_code)
        .maybeSingle();
      
      if (couponData) {
        setCouponInfo(couponData);
      }
    }

    // Fetch orders stats
    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('commerce_id', commerce.id);

    // Fetch products count
    const { count: productsCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerce.id);

    // Fetch categories count
    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerce.id);

    // Fetch recent orders
    const { data: recent } = await supabase
      .from('orders')
      .select('*')
      .eq('commerce_id', commerce.id)
      .order('created_at', { ascending: false })
      .limit(5);
    
    setRecentOrders(recent || []);

    // Calculate stats
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const pendingOrders = orders?.filter(o => o.status === 'pending').length || 0;
    const deliveredOrders = orders?.filter(o => o.status === 'delivered').length || 0;
    const cancelledOrders = orders?.filter(o => o.status === 'cancelled').length || 0;

    // Calculate growth (comparing last 30 days to previous 30 days)
    const now = new Date();
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const prev30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    const recentRevenue = orders?.filter(o => new Date(o.created_at) >= last30Days)
      .reduce((sum, o) => sum + Number(o.total), 0) || 0;
    const prevRevenue = orders?.filter(o => 
      new Date(o.created_at) >= prev30Days && new Date(o.created_at) < last30Days
    ).reduce((sum, o) => sum + Number(o.total), 0) || 0;
    
    const revenueGrowth = prevRevenue > 0 ? ((recentRevenue - prevRevenue) / prevRevenue) * 100 : 0;
    
    const recentOrdersCount = orders?.filter(o => new Date(o.created_at) >= last30Days).length || 0;
    const prevOrdersCount = orders?.filter(o => 
      new Date(o.created_at) >= prev30Days && new Date(o.created_at) < last30Days
    ).length || 0;
    
    const ordersGrowth = prevOrdersCount > 0 ? ((recentOrdersCount - prevOrdersCount) / prevOrdersCount) * 100 : 0;

    setStats({
      totalOrders,
      totalRevenue,
      totalProducts: productsCount || 0,
      avgOrderValue,
      totalCategories: categoriesCount || 0,
      pendingOrders,
      deliveredOrders,
      cancelledOrders,
      revenueGrowth,
      ordersGrowth
    });

    setLoading(false);
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any; color: string }> = {
      pending: { label: "Aguardando Aprovação", variant: "warning", icon: Clock, color: "text-amber-500" },
      approved: { label: "Aprovado", variant: "success", icon: CheckCircle, color: "text-green-500" },
      rejected: { label: "Rejeitado", variant: "destructive", icon: XCircle, color: "text-red-500" },
      suspended: { label: "Suspenso", variant: "secondary", icon: Ban, color: "text-gray-500" },
    };
    return config[status] || config.pending;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (!commerce) return null;

  const statusConfig = getStatusConfig(commerce.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader className="mb-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-2xl">
                    {commerce.fantasy_name?.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <DialogTitle className="text-2xl">{commerce.fantasy_name}</DialogTitle>
                      {plan ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
                          <Crown className="w-3 h-3" />
                          {plan.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Sem plano
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground">{commerce.owner_name}</p>
                    <Badge variant={statusConfig.variant} className="mt-2 gap-1">
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  {commerce.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        variant="success"
                        onClick={() => onStatusChange(commerce.id, 'approved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => onStatusChange(commerce.id, 'rejected')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {commerce.status === 'approved' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onStatusChange(commerce.id, 'suspended')}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      Suspender
                    </Button>
                  )}
                </div>
              </div>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="stats">Estatísticas</TabsTrigger>
                <TabsTrigger value="orders">Pedidos</TabsTrigger>
                <TabsTrigger value="info">Informações</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Pedidos</p>
                          <p className="text-2xl font-bold">{stats?.totalOrders || 0}</p>
                        </div>
                        <ShoppingCart className="w-8 h-8 text-blue-500" />
                      </div>
                      {stats && stats.ordersGrowth !== 0 && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${stats.ordersGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stats.ordersGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(stats.ordersGrowth).toFixed(1)}% vs mês anterior
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Faturamento</p>
                          <p className="text-2xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-500" />
                      </div>
                      {stats && stats.revenueGrowth !== 0 && (
                        <div className={`flex items-center gap-1 mt-2 text-sm ${stats.revenueGrowth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stats.revenueGrowth > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {Math.abs(stats.revenueGrowth).toFixed(1)}% vs mês anterior
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Produtos</p>
                          <p className="text-2xl font-bold">{stats?.totalProducts || 0}</p>
                        </div>
                        <Package className="w-8 h-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Ticket Médio</p>
                          <p className="text-2xl font-bold">{formatCurrency(stats?.avgOrderValue || 0)}</p>
                        </div>
                        <CreditCard className="w-8 h-8 text-amber-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Plan Info */}
                {plan && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Crown className="w-5 h-5 text-primary" />
                        Plano Contratado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-xl">{plan.name}</h3>
                          <p className="text-muted-foreground">{plan.description}</p>
                          {commerce.coupon_code && couponInfo && (
                            <Badge variant="outline" className="mt-2 bg-green-500/10 text-green-600 border-green-500/30">
                              Cupom: {commerce.coupon_code} ({couponInfo.discount_type === 'percentage' 
                                ? `${couponInfo.discount_value}%` 
                                : formatCurrency(couponInfo.discount_value)} OFF)
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          {couponInfo ? (
                            <>
                              <p className="text-sm text-muted-foreground line-through">
                                {formatCurrency(Number(plan.price))}
                              </p>
                              <p className="text-2xl font-bold text-primary">
                                {formatCurrency(
                                  couponInfo.discount_type === 'percentage'
                                    ? Number(plan.price) * (1 - couponInfo.discount_value / 100)
                                    : Number(plan.price) - couponInfo.discount_value
                                )}
                              </p>
                            </>
                          ) : (
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(Number(plan.price))}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">/mês</p>
                        </div>
                      </div>
                      {plan.features && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(plan.features as string[]).map((feature: string, index: number) => (
                            <Badge key={index} variant="outline" className="bg-primary/5">
                              <CheckCircle className="w-3 h-3 mr-1 text-primary" />
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Contact & Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Contato
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{commerce.email}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{commerce.phone}</span>
                      </div>
                      {commerce.whatsapp && (
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <span>WhatsApp: {commerce.whatsapp}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        Localização
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {commerce.address && (
                        <div className="flex items-start gap-3">
                          <Building className="w-4 h-4 text-muted-foreground mt-0.5" />
                          <span>
                            {commerce.address}, {commerce.address_number}
                            {commerce.complement && ` - ${commerce.complement}`}
                          </span>
                        </div>
                      )}
                      {commerce.neighborhood && (
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span>{commerce.neighborhood} - {commerce.city}</span>
                        </div>
                      )}
                      {commerce.cep && (
                        <div className="flex items-center gap-3">
                          <Hash className="w-4 h-4 text-muted-foreground" />
                          <span>CEP: {commerce.cep}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="bg-amber-500/10 border-amber-500/20">
                    <CardContent className="p-4 text-center">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-amber-500" />
                      <p className="text-2xl font-bold">{stats?.pendingOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">Pendentes</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-green-500/10 border-green-500/20">
                    <CardContent className="p-4 text-center">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{stats?.deliveredOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">Entregues</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-500/10 border-red-500/20">
                    <CardContent className="p-4 text-center">
                      <XCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                      <p className="text-2xl font-bold">{stats?.cancelledOrders || 0}</p>
                      <p className="text-sm text-muted-foreground">Cancelados</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Métricas de Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Taxa de Conversão</span>
                          <span className="text-sm font-medium">
                            {stats && stats.totalOrders > 0 
                              ? ((stats.deliveredOrders / stats.totalOrders) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 rounded-full"
                            style={{ width: `${stats && stats.totalOrders > 0 ? (stats.deliveredOrders / stats.totalOrders) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Taxa de Cancelamento</span>
                          <span className="text-sm font-medium">
                            {stats && stats.totalOrders > 0 
                              ? ((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-red-500 rounded-full"
                            style={{ width: `${stats && stats.totalOrders > 0 ? (stats.cancelledOrders / stats.totalOrders) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="orders" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Pedidos Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum pedido encontrado</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                            <div>
                              <p className="font-medium">Pedido #{order.id.slice(0, 8)}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{formatCurrency(Number(order.total))}</p>
                              <Badge variant={order.status === 'delivered' ? 'success' : order.status === 'cancelled' ? 'destructive' : 'warning'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-6 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      Dados Cadastrais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Razão Social / Nome</p>
                        <p className="font-medium">{commerce.owner_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                        <p className="font-medium">{commerce.fantasy_name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{commerce.document_type?.toUpperCase()}</p>
                        <p className="font-medium">{commerce.document}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status da Loja</p>
                        <Badge variant={commerce.is_open ? "success" : "secondary"}>
                          {commerce.is_open ? "Aberta" : "Fechada"}
                        </Badge>
                      </div>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Cadastrado em</p>
                        <p className="font-medium">
                          {format(new Date(commerce.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {commerce.approved_at && (
                        <div>
                          <p className="text-sm text-muted-foreground">Aprovado em</p>
                          <p className="font-medium">
                            {format(new Date(commerce.approved_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                        </div>
                      )}
                    </div>
                    {commerce.rejection_reason && (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground">Motivo da Rejeição</p>
                          <p className="font-medium text-red-500">{commerce.rejection_reason}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CommerceDetailsModal;
