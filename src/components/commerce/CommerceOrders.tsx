import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  ChefHat,
  Package,
  ChevronLeft,
  ChevronRight,
  Receipt,
  CreditCard
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import DateFilter from "./DateFilter";
import { startOfDay, endOfDay, subDays } from "date-fns";
import { formatCurrency } from "@/lib/formatCurrency";

interface CommerceOrdersProps {
  commerceId: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  notes: string | null;
}

interface PaymentMethodConfig {
  type: string;
  fee_percentage: number;
  fee_fixed: number;
}

interface Order {
  id: string;
  status: string;
  order_type: string | null;
  subtotal: number;
  delivery_fee: number | null;
  discount: number | null;
  coupon_code?: string | null;
  coupon_discount?: number | null;
  total: number;
  notes: string | null;
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_method: string | null;
  created_at: string;
  table_id: string | null;
  order_items?: OrderItem[];
  table_number?: number;
  table_name?: string | null;
}

type CombinedOrder = Order;

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: "Pendente", color: "bg-yellow-500/20 text-yellow-500", icon: Clock },
  confirmed: { label: "Confirmado", color: "bg-blue-500/20 text-blue-500", icon: CheckCircle },
  preparing: { label: "Preparando", color: "bg-orange-500/20 text-orange-500", icon: ChefHat },
  delivering: { label: "Em Entrega", color: "bg-purple-500/20 text-purple-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-green-500/20 text-green-500", icon: Package },
  cancelled: { label: "Cancelado", color: "bg-red-500/20 text-red-500", icon: XCircle },
};

const orderTypeLabels: Record<string, string> = {
  delivery: "Delivery",
  pickup: "Retirada",
  table: "Mesa",
  pos: "PDV/Caixa",
};

const paymentMethodLabels: Record<string, string> = {
  cash: "Dinheiro",
  credit: "Crédito",
  debit: "Débito",
  pix: "PIX",
};

type OrderStatus = "pending" | "confirmed" | "preparing" | "delivering" | "delivered" | "cancelled";

const ITEMS_PER_PAGE = 10;

const CommerceOrders = ({ commerceId }: CommerceOrdersProps) => {
  const [orders, setOrders] = useState<CombinedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<PaymentMethodConfig[]>([]);
  // Usa função centralizada para evitar problemas de fuso horário UTC
  const getLocalToday = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  };
  const localToday = getLocalToday();
  
  const [dateFilter, setDateFilter] = useState({ 
    start: startOfDay(subDays(localToday, 29)), 
    end: endOfDay(localToday) 
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleDateChange = (start: Date, end: Date) => {
    setLoading(true); // Mostra loading IMEDIATAMENTE para evitar flash de dados antigos
    setDateFilter({ start, end });
    setCurrentPage(1);
  };

  const fetchOrders = async () => {
    setLoading(true);
    
    // Fetch orders from orders table
    let ordersQuery = supabase
      .from('orders')
      .select('*')
      .eq('commerce_id', commerceId)
      .gte('created_at', dateFilter.start.toISOString())
      .lte('created_at', dateFilter.end.toISOString())
      .order('created_at', { ascending: false });

    if (statusFilter !== 'all') {
      ordersQuery = ordersQuery.eq('status', statusFilter as OrderStatus);
    }

    // Fetch cash movements (PDV sales) - only if not filtering by order status
    const { data: ordersData, error: ordersError } = await ordersQuery;
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    }

    // Convert orders to combined format - pedidos já aparecem com seus dados
    // Não duplicar com cash_movements, apenas usar a tabela orders
    const combinedOrders: CombinedOrder[] = (ordersData || []).map(order => order as Order);

    // Sort by created_at descending
    combinedOrders.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setOrders(combinedOrders);
    setLoading(false);
  };

  // Fetch payment methods config
  useEffect(() => {
    const fetchPaymentMethodsConfig = async () => {
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('type, fee_percentage, fee_fixed')
        .eq('commerce_id', commerceId);
      
      setPaymentMethodsConfig(
        (paymentMethods || []).map(pm => ({
          type: pm.type,
          fee_percentage: pm.fee_percentage || 0,
          fee_fixed: pm.fee_fixed || 0
        }))
      );
    };
    fetchPaymentMethodsConfig();
  }, [commerceId]);

  useEffect(() => {
    fetchOrders();

    // Subscribe to orders changes for real-time updates
    const channel = supabase
      .channel(`commerce-orders-${commerceId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders',
          filter: `commerce_id=eq.${commerceId}` 
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commerceId, statusFilter, dateFilter]);

  // Helper function to calculate fee based on configured payment methods
  const calculateFee = (paymentMethod: string | null, total: number): number => {
    if (!paymentMethod) return 0;
    const config = paymentMethodsConfig.find(pm => pm.type === paymentMethod);
    if (!config) return 0;
    // Calculate: percentage fee + fixed fee
    return (total * (config.fee_percentage / 100)) + config.fee_fixed;
  };

  const fetchOrderDetails = async (orderId: string) => {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);

    if (error) {
      console.error('Error fetching order items:', error);
      return;
    }

    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Fetch table info if it's a table order
      let tableInfo = { table_number: undefined as number | undefined, table_name: undefined as string | null | undefined };
      if (order.order_type === 'table' && order.table_id) {
        const { data: tableData } = await supabase
          .from('tables')
          .select('number, name')
          .eq('id', order.table_id)
          .single();
        if (tableData) {
          tableInfo = { table_number: tableData.number, table_name: tableData.name };
        }
      }
      setSelectedOrder({ ...order, order_items: items || [], ...tableInfo });
      setIsDetailsOpen(true);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find(o => o.id === orderId);
    
    const updateData: { status: typeof newStatus; delivered_at?: string } = { status: newStatus };
    
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
      // Stock deduction is now handled by the database trigger automatically
      // when status becomes 'delivered'
      
      if (newStatus === 'delivered' && order) {
        // Liberar a mesa se for pedido de mesa
        if (order.order_type === 'table' && order.table_id) {
          await supabase
            .from('tables')
            .update({ 
              status: 'available', 
              current_order_id: null,
              closed_at: new Date().toISOString()
            })
            .eq('id', order.table_id);
        }

        // Criar movimentação de caixa automaticamente para consolidar vendas
        await createCashMovementForOrder(order);
      }
      
      toast({ title: "Status atualizado com sucesso!" });
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    }
  };

  // Função para criar cash_movement ao finalizar pedido
  const createCashMovementForOrder = async (order: Order) => {
    if (!user) return;

    // NÃO criar movimentação para pedidos com pagamento pendente (mesas sem pagamento imediato)
    // O movimento será criado quando o lojista fechar a mesa no PDV
    if (order.payment_method === 'pending') {
      console.log('Pedido com pagamento pendente - movimentação será criada no fechamento da mesa');
      return;
    }

    // Buscar caixa aberto do comércio
    const { data: openRegister } = await supabase
      .from('cash_registers')
      .select('id')
      .eq('commerce_id', commerceId)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!openRegister) {
      // Se não houver caixa aberto, não registrar movimentação
      // Isso é um cenário válido - o comércio pode não usar o PDV
      console.log('Nenhum caixa aberto para registrar movimentação');
      return;
    }

    // Verificar se já existe movimentação para este pedido (evitar duplicação)
    const { data: existingMovement } = await supabase
      .from('cash_movements')
      .select('id')
      .eq('order_id', order.id)
      .maybeSingle();

    if (existingMovement) {
      console.log('Movimentação já existe para este pedido');
      return;
    }

    // Mapear método de pagamento
    const paymentMethod = order.payment_method || 'cash';

    // Criar descrição baseada no tipo de pedido
    const orderTypeLabel = order.order_type === 'delivery' ? 'Delivery' : 
                           order.order_type === 'table' ? 'Mesa' : 
                           order.order_type === 'pickup' ? 'Retirada' : 'Pedido';
    const description = `${orderTypeLabel} #${order.id.slice(0, 8)} - ${order.customer_name || 'Cliente'}`;

    // Inserir movimentação de caixa
    const { error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: openRegister.id,
        commerce_id: commerceId,
        type: 'sale',
        amount: Number(order.total),
        payment_method: paymentMethod,
        order_id: order.id,
        description: description,
        created_by: user.id
      });

    if (error) {
      console.error('Erro ao criar movimentação de caixa:', error);
    } else {
      console.log('Movimentação de caixa criada com sucesso para pedido:', order.id);
    }
  };

  const getNextStatus = (currentStatus: string, orderType?: string | null): OrderStatus | null => {
    const flow: Record<string, OrderStatus> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'delivering',
      delivering: 'delivered',
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string, orderType?: string | null): string => {
    if (orderType === 'table' && currentStatus === 'preparing') {
      return 'Finalizado!';
    }
    const nextStatus = getNextStatus(currentStatus, orderType);
    if (nextStatus) {
      return statusConfig[nextStatus]?.label || nextStatus;
    }
    return '';
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    return order.id.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(searchTerm);
  });

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground text-sm sm:text-base">Gerencie todos os pedidos do seu comércio (Delivery, PDV, Mesas)</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-col xs:flex-row gap-2">
              <DateFilter onDateChange={handleDateChange} defaultValue="30days" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full xs:w-auto xs:min-w-[150px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedOrders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => {
                    const status = statusConfig[order.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    const nextStatus = getNextStatus(order.status);

                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(0, 8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {order.customer_name || "Cliente"}
                            </p>
                            {order.customer_phone && (
                              <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {orderTypeLabels[order.order_type || 'delivery']}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CreditCard className="w-3 h-3" />
                            {paymentMethodLabels[order.payment_method || ''] || order.payment_method || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(Number(order.total))}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div>
                            <p>{new Date(order.created_at).toLocaleDateString('pt-BR')}</p>
                            <p className="text-xs">{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {/* Eye icon for viewing details */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchOrderDetails(order.id)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {nextStatus && order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, nextStatus)}
                              >
                                {order.status === 'pending' ? 'Iniciar' : getNextStatusLabel(order.status, order.order_type)}
                              </Button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'cancelled')}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4 pt-4 border-t">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} de {filteredOrders.length} pedidos
                  </p>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden xs:inline">Anterior</span>
                    </Button>
                    <span className="text-xs sm:text-sm px-2 sm:px-3">
                      {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <span className="hidden xs:inline">Próxima</span>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Pedido #{selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{selectedOrder.customer_name || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedOrder.customer_phone || "Não informado"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {orderTypeLabels[selectedOrder.order_type || 'delivery']}
                    {selectedOrder.order_type === 'table' && selectedOrder.table_number && (
                      <span className="ml-2 text-primary font-bold">
                        (Mesa {selectedOrder.table_number}{selectedOrder.table_name ? ` - ${selectedOrder.table_name}` : ''})
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pagamento</p>
                  <p className="font-medium">{paymentMethodLabels[selectedOrder.payment_method || ''] || selectedOrder.payment_method || "Não informado"}</p>
                </div>
                {selectedOrder.delivery_address && (
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{selectedOrder.delivery_address}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-3">Itens do Pedido</h4>
                <div className="space-y-2">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="font-medium">{item.quantity}x {item.product_name}</p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                      <p className="font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.total_price))}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedOrder.subtotal))}</span>
                </div>
                {selectedOrder.delivery_fee && Number(selectedOrder.delivery_fee) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Taxa de entrega</span>
                    <span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(selectedOrder.delivery_fee))}</span>
                  </div>
                )}
                {selectedOrder.discount != null && Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Desconto</span>
                    <span>-{formatCurrency(Number(selectedOrder.discount))}</span>
                  </div>
                )}
                {selectedOrder.coupon_code && selectedOrder.coupon_discount != null && Number(selectedOrder.coupon_discount) > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Cupom ({selectedOrder.coupon_code})</span>
                    <span>-{formatCurrency(Number(selectedOrder.coupon_discount))}</span>
                  </div>
                )}
                {/* Payment Fee Calculation - using configured rates */}
                {selectedOrder.payment_method && calculateFee(selectedOrder.payment_method, Number(selectedOrder.total)) > 0 && (
                  <div className="flex justify-between text-sm text-destructive">
                    <span>Taxa de {paymentMethodLabels[selectedOrder.payment_method] || selectedOrder.payment_method}</span>
                    <span>-{formatCurrency(calculateFee(selectedOrder.payment_method, Number(selectedOrder.total)))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total Recebido</span>
                  <span>{formatCurrency(Number(selectedOrder.total))}</span>
                </div>
                {/* Lucro Líquido - using configured rates */}
                {selectedOrder.payment_method && (
                  <div className="flex justify-between font-bold text-lg text-primary">
                    <span>Lucro Líquido (após taxas)</span>
                    <span>{formatCurrency(
                      Number(selectedOrder.total) - calculateFee(selectedOrder.payment_method, Number(selectedOrder.total))
                    )}</span>
                  </div>
                )}
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-lg bg-muted border border-muted-foreground/20">
                  <p className="text-sm font-medium text-muted-foreground">Observações</p>
                  <p className="text-sm mt-1">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CommerceOrders;
