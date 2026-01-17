import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  ShoppingBag, 
  Clock, 
  LogOut,
  Edit,
  Save,
  X,
  Loader2,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchAddressByCep, formatCep } from "@/lib/viaCepService";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoMobdega from "@/assets/logo-mobdega.png";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  cep: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  address_number: string | null;
  complement: string | null;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_type: string | null;
  commerce: {
    fantasy_name: string;
  } | null;
}

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    cep: "",
    city: "",
    neighborhood: "",
    address: "",
    address_number: "",
    complement: "",
  });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    fetchProfile();
    fetchOrders();
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    if (data) {
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        cep: data.cep || "",
        city: data.city || "",
        neighborhood: data.neighborhood || "",
        address: data.address || "",
        address_number: data.address_number || "",
        complement: data.complement || "",
      });
    }
    
    setLoading(false);
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        total,
        order_type,
        commerce:commerces(fantasy_name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    setOrders((data || []) as unknown as Order[]);
  };

  const handleCepChange = async (value: string) => {
    const formatted = formatCep(value);
    setFormData(prev => ({ ...prev, cep: formatted }));
    
    if (formatted.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      const address = await fetchAddressByCep(formatted);
      setLoadingCep(false);
      
      if (address) {
        setFormData(prev => ({
          ...prev,
          city: address.city,
          neighborhood: address.neighborhood,
          address: address.street,
        }));
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        cep: formData.cep,
        city: formData.city,
        neighborhood: formData.neighborhood,
        address: formData.address,
        address_number: formData.address_number,
        complement: formData.complement,
      })
      .eq('user_id', user.id);
    
    setSaving(false);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar",
        description: error.message,
      });
      return;
    }
    
    toast({
      title: "Perfil atualizado!",
      description: "Suas informações foram salvas com sucesso.",
    });
    
    setEditing(false);
    fetchProfile();
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src={logoMobdega} alt="Mobdega" className="h-10" />
            </button>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-medium text-foreground">{profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{profile?.email}</p>
              </div>
              <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            Olá, {profile?.full_name?.split(' ')[0]}! 👋
          </h1>

          <Tabs defaultValue="orders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Meus Pedidos
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Meu Perfil
              </TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    Histórico de Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Você ainda não fez nenhum pedido</p>
                      <p className="text-sm">Explore as adegas e tabacarias perto de você!</p>
                      <Button className="mt-4" onClick={() => navigate('/')}>
                        Explorar Comércios
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const status = getStatusLabel(order.status);
                        return (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">
                                  {order.commerce?.fantasy_name || 'Pedido'}
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={`${status.color} text-white border-0`}>
                                {status.label}
                              </Badge>
                              <p className="font-semibold text-foreground mt-1">
                                R$ {order.total.toFixed(2)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Meus Dados
                  </CardTitle>
                  {!editing ? (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                        <X className="w-4 h-4 mr-2" />
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Salvar
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome Completo</Label>
                      {editing ? (
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-foreground p-2 bg-muted/50 rounded-lg">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {profile?.full_name}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <div className="flex items-center gap-2 text-foreground p-2 bg-muted/50 rounded-lg">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        {profile?.email}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Telefone / WhatsApp</Label>
                      {editing ? (
                        <Input
                          value={formData.phone}
                          onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(00) 00000-0000"
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-foreground p-2 bg-muted/50 rounded-lg">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          {profile?.phone || "Não informado"}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address Info */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço de Entrega
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        {editing ? (
                          <div className="relative">
                            <Input
                              value={formData.cep}
                              onChange={(e) => handleCepChange(e.target.value)}
                              maxLength={9}
                              placeholder="00000-000"
                            />
                            {loadingCep && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />
                            )}
                          </div>
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.cep || "—"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        {editing ? (
                          <Input
                            value={formData.city}
                            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                            readOnly
                          />
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.city || "—"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        {editing ? (
                          <Input
                            value={formData.neighborhood}
                            onChange={(e) => setFormData(prev => ({ ...prev, neighborhood: e.target.value }))}
                          />
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.neighborhood || "—"}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label>Endereço</Label>
                        {editing ? (
                          <Input
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          />
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.address || "—"}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Número</Label>
                        {editing ? (
                          <Input
                            value={formData.address_number}
                            onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                          />
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.address_number || "—"}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-3 space-y-2">
                        <Label>Complemento</Label>
                        {editing ? (
                          <Input
                            value={formData.complement}
                            onChange={(e) => setFormData(prev => ({ ...prev, complement: e.target.value }))}
                            placeholder="Apto, Bloco, etc."
                          />
                        ) : (
                          <p className="p-2 bg-muted/50 rounded-lg">{profile?.complement || "—"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
};

export default UserDashboard;
