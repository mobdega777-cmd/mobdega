import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Truck, 
  MapPin, 
  Phone, 
  User,
  Clock, 
  CheckCircle,
  Package,
  Navigation
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CommerceDeliveryProps {
  commerceId: string;
}

interface DeliveryOrder {
  id: string;
  status: string;
  total: number;
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  estimated_delivery: string | null;
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  pending: { label: "Novo", color: "text-yellow-500", bgColor: "bg-yellow-500/20" },
  confirmed: { label: "Confirmado", color: "text-blue-500", bgColor: "bg-blue-500/20" },
  preparing: { label: "Preparando", color: "text-orange-500", bgColor: "bg-orange-500/20" },
  delivering: { label: "Em Rota", color: "text-purple-500", bgColor: "bg-purple-500/20" },
  delivered: { label: "Entregue", color: "text-green-500", bgColor: "bg-green-500/20" },
  cancelled: { label: "Cancelado", color: "text-red-500", bgColor: "bg-red-500/20" },
};

const CommerceDelivery = ({ commerceId }: CommerceDeliveryProps) => {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('commerce_id', commerceId)
      .eq('order_type', 'delivery')
      .in('status', ['pending', 'confirmed', 'preparing', 'delivering'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching delivery orders:', error);
    } else {
      setOrders(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('delivery-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `commerce_id=eq.${commerceId}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerceId]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const updateData: Record<string, unknown> = { status: newStatus };
    
    if (newStatus === 'delivered') {
      updateData.delivered_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao atualizar pedido", description: error.message });
    } else {
      toast({ title: "Status atualizado!" });
      fetchOrders();
    }
  };

  const getNextAction = (status: string): { label: string; nextStatus: string } | null => {
    const actions: Record<string, { label: string; nextStatus: string }> = {
      pending: { label: "Confirmar", nextStatus: "confirmed" },
      confirmed: { label: "Preparar", nextStatus: "preparing" },
      preparing: { label: "Enviar", nextStatus: "delivering" },
      delivering: { label: "Finalizar", nextStatus: "delivered" },
    };
    return actions[status] || null;
  };

  const getTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 1000 / 60);
    
    if (diffMinutes < 60) return `${diffMinutes}min`;
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}min`;
  };

  const groupedOrders = {
    pending: orders.filter(o => o.status === 'pending'),
    confirmed: orders.filter(o => o.status === 'confirmed'),
    preparing: orders.filter(o => o.status === 'preparing'),
    delivering: orders.filter(o => o.status === 'delivering'),
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
        <h1 className="text-3xl font-bold">Delivery</h1>
        <p className="text-muted-foreground">Gerencie entregas em tempo real</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(groupedOrders).map(([status, statusOrders]) => {
          const config = statusConfig[status];
          return (
            <Card key={status} className={`border-2 ${config.bgColor.replace('/20', '/30')}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <span className={`font-medium ${config.color}`}>{config.label}</span>
                  <Badge variant="secondary" className="text-lg">
                    {statusOrders.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold mb-2">Sem entregas no momento</h3>
            <p className="text-muted-foreground">
              Novos pedidos de delivery aparecerão aqui automaticamente
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const nextAction = getNextAction(order.status);
            const timeSince = getTimeSince(order.created_at);

            return (
              <Card 
                key={order.id} 
                className={`cursor-pointer hover:shadow-lg transition-all ${
                  order.status === 'pending' ? 'border-yellow-500/50 animate-pulse' : ''
                }`}
                onClick={() => setSelectedOrder(order)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-mono text-sm text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="font-bold text-lg">
                        R$ {Number(order.total).toFixed(2)}
                      </p>
                    </div>
                    <Badge className={`${status.bgColor} ${status.color} border-0`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{order.customer_name || "Cliente"}</span>
                  </div>
                  {order.customer_phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{order.customer_phone}</span>
                    </div>
                  )}
                  {order.delivery_address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.delivery_address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>há {timeSince}</span>
                  </div>

                  {nextAction && (
                    <Button
                      className="w-full mt-2"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        updateOrderStatus(order.id, nextAction.nextStatus);
                      }}
                    >
                      {nextAction.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">#{selectedOrder.id.slice(0, 8)}</span>
                <Badge className={`${statusConfig[selectedOrder.status].bgColor} ${statusConfig[selectedOrder.status].color}`}>
                  {statusConfig[selectedOrder.status].label}
                </Badge>
              </div>

              <div className="space-y-3 p-4 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer_name || "Não informado"}</p>
                  </div>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                )}
                {selectedOrder.delivery_address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">Endereço</p>
                      <p className="font-medium">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-sm font-medium text-yellow-500">Observações</p>
                  <p className="text-sm mt-1">{selectedOrder.notes}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold">
                  R$ {Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2">
                {selectedOrder.delivery_address && (
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedOrder.delivery_address || '')}`,
                        '_blank'
                      );
                    }}
                  >
                    <Navigation className="w-4 h-4" />
                    Abrir Mapa
                  </Button>
                )}
                {getNextAction(selectedOrder.status) && (
                  <Button
                    className="flex-1"
                    onClick={() => {
                      const action = getNextAction(selectedOrder.status);
                      if (action) {
                        updateOrderStatus(selectedOrder.id, action.nextStatus);
                        setSelectedOrder(null);
                      }
                    }}
                  >
                    {getNextAction(selectedOrder.status)?.label}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceDelivery;
