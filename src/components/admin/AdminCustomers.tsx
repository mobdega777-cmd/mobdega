import { useState, useEffect } from "react";
import { 
  Users, Search, MoreHorizontal, Trash2, Eye, Mail, Phone, 
  MapPin, Calendar, Filter, Download, UserCheck, UserX, 
  ShoppingBag, Heart, Star, TrendingUp, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Customer {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  neighborhood: string | null;
  cep: string | null;
  avatar_url: string | null;
  bio: string | null;
  birthday: string | null;
  created_at: string;
}

interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
  favoritesCount: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_type: string | null;
  commerce: {
    fantasy_name: string;
  } | null;
}

const AdminCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerStats, setCustomerStats] = useState<CustomerStats | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    
    // Get profiles that are not commerce owners or admins
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching customers:', error);
      toast({ variant: "destructive", title: "Erro ao carregar clientes" });
      setLoading(false);
      return;
    }

    // Filter out users who have commerce or admin roles
    const { data: commerceOwners } = await supabase
      .from('commerces')
      .select('owner_id');
    
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'master_admin');

    const ownerIds = new Set(commerceOwners?.map(c => c.owner_id) || []);
    const adminIds = new Set(adminRoles?.map(r => r.user_id) || []);

    const filteredCustomers = (profiles || []).filter(
      p => !ownerIds.has(p.user_id) && !adminIds.has(p.user_id)
    );

    setCustomers(filteredCustomers);
    setLoading(false);
  };

  const fetchCustomerDetails = async (customer: Customer) => {
    setLoadingDetails(true);
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);

    // Fetch orders
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id, created_at, status, total, order_type,
        commerce:commerces(fantasy_name)
      `)
      .eq('user_id', customer.user_id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch favorites count
    const { count: favoritesCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', customer.user_id);

    const customerOrders = (orders || []) as unknown as CustomerOrder[];
    const totalOrders = customerOrders.length;
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;
    const lastOrderDate = customerOrders[0]?.created_at || null;

    setCustomerOrders(customerOrders);
    setCustomerStats({
      totalOrders,
      totalSpent,
      favoritesCount: favoritesCount || 0,
      averageOrderValue,
      lastOrderDate,
    });

    setLoadingDetails(false);
  };

  const handleDeleteCustomer = async (customer: Customer) => {
    if (!confirm(`Deseja realmente excluir o cliente "${customer.full_name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', customer.id);

    if (error) {
      toast({ variant: "destructive", title: "Erro ao excluir cliente" });
      return;
    }

    toast({ title: "Cliente excluído com sucesso" });
    fetchCustomers();
  };

  const filteredCustomers = customers.filter(c =>
    c.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm) ||
    c.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      pending: { label: "Pendente", color: "bg-yellow-500" },
      confirmed: { label: "Confirmado", color: "bg-blue-500" },
      preparing: { label: "Preparando", color: "bg-purple-500" },
      delivering: { label: "Em entrega", color: "bg-orange-500" },
      delivered: { label: "Entregue", color: "bg-green-500" },
      cancelled: { label: "Cancelado", color: "bg-red-500" },
    };
    return labels[status] || { label: status, color: "bg-gray-500" };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Calculate summary stats
  const totalCustomers = customers.length;
  const customersThisMonth = customers.filter(c => {
    const created = new Date(c.created_at);
    const now = new Date();
    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Gestão de Clientes
        </h1>
        <p className="text-muted-foreground">
          Gerencie todos os clientes cadastrados na Mobdega
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalCustomers}</p>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{customersThisMonth}</p>
                <p className="text-sm text-muted-foreground">Novos este mês</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-sm text-muted-foreground">Pedidos totais</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl">
                <TrendingUp className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">—</p>
                <p className="text-sm text-muted-foreground">Ticket médio</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, email, telefone ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filtros
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            {filteredCustomers.length} clientes encontrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Localização</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                            {customer.avatar_url ? (
                              <img src={customer.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-primary font-semibold">
                                {customer.full_name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{customer.full_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          <span className="text-sm">{customer.phone || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="text-sm">
                            {customer.city || "—"}
                            {customer.neighborhood && `, ${customer.neighborhood}`}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span className="text-sm">
                            {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => fetchCustomerDetails(customer)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCustomer(customer)}
                              className="text-red-500"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
          </DialogHeader>
          
          {loadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : selectedCustomer && customerStats && (
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6">
                {/* Customer Header */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                    {selectedCustomer.avatar_url ? (
                      <img src={selectedCustomer.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl text-primary font-semibold">
                        {selectedCustomer.full_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedCustomer.full_name}</h3>
                    <p className="text-muted-foreground">{selectedCustomer.email}</p>
                    <p className="text-sm text-muted-foreground">
                      Membro {formatDistanceToNow(new Date(selectedCustomer.created_at), { locale: ptBR, addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <ShoppingBag className="w-6 h-6 mx-auto text-primary mb-2" />
                      <p className="text-2xl font-bold">{customerStats.totalOrders}</p>
                      <p className="text-xs text-muted-foreground">Pedidos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <TrendingUp className="w-6 h-6 mx-auto text-green-500 mb-2" />
                      <p className="text-2xl font-bold">{formatCurrency(customerStats.totalSpent)}</p>
                      <p className="text-xs text-muted-foreground">Total gasto</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Heart className="w-6 h-6 mx-auto text-red-500 mb-2" />
                      <p className="text-2xl font-bold">{customerStats.favoritesCount}</p>
                      <p className="text-xs text-muted-foreground">Favoritos</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-center">
                      <Star className="w-6 h-6 mx-auto text-yellow-500 mb-2" />
                      <p className="text-2xl font-bold">{formatCurrency(customerStats.averageOrderValue)}</p>
                      <p className="text-xs text-muted-foreground">Ticket médio</p>
                    </CardContent>
                  </Card>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="info">Informações</TabsTrigger>
                    <TabsTrigger value="orders">Pedidos</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Telefone</p>
                        <p className="font-medium">{selectedCustomer.phone || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                        <p className="font-medium">
                          {selectedCustomer.birthday 
                            ? format(new Date(selectedCustomer.birthday), "dd/MM/yyyy")
                            : "Não informado"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">CEP</p>
                        <p className="font-medium">{selectedCustomer.cep || "Não informado"}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cidade</p>
                        <p className="font-medium">{selectedCustomer.city || "Não informado"}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Bio</p>
                        <p className="font-medium">{selectedCustomer.bio || "Nenhuma bio"}</p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="orders" className="space-y-4">
                    {customerOrders.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum pedido realizado</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {customerOrders.map((order) => {
                          const status = getStatusLabel(order.status);
                          return (
                            <div key={order.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                              <div>
                                <p className="font-medium">{order.commerce?.fantasy_name || "Pedido"}</p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className={`${status.color} text-white border-0`}>
                                  {status.label}
                                </Badge>
                                <p className="font-semibold mt-1">{formatCurrency(order.total)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
