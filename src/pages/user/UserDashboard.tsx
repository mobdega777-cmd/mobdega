import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, MapPin, Phone, Mail, ShoppingBag, Clock, LogOut, Edit, Save, X, Loader2, 
  Package, Heart, Star, Camera, Calendar, Home, Store, Search, ChevronRight,
  MessageCircle, History, Settings, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { fetchAddressByCep, formatCep } from "@/lib/viaCepService";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoMobdega from "@/assets/logo-mobdega.png";
import CommerceStorefront from "@/components/user/CommerceStorefront";
import { formatCurrency } from "@/lib/formatCurrency";

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
  bio: string | null;
  birthday: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Order {
  id: string;
  created_at: string;
  status: string;
  total: number;
  order_type: string | null;
  commerce: {
    fantasy_name: string;
    logo_url: string | null;
  } | null;
}

interface Favorite {
  id: string;
  commerce_id: string;
  commerce: {
    fantasy_name: string;
    logo_url: string | null;
    cover_url: string | null;
    city: string | null;
    is_open: boolean | null;
  } | null;
}

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

interface Commerce {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  neighborhood: string | null;
  is_open: boolean | null;
  opening_hours: OpeningHours | null;
  whatsapp: string | null;
  averageRating?: number;
  reviewCount?: number;
}

const getDayKey = (date: Date): string => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[date.getDay()];
};

const isStoreOpen = (isOpen: boolean | null, openingHours: OpeningHours | null): boolean => {
  if (isOpen === false) return false;
  if (!openingHours) return true;
  
  const now = new Date();
  const dayKey = getDayKey(now);
  const todayHours = openingHours[dayKey];
  
  if (!todayHours || !todayHours.enabled) return false;
  
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openHour, openMinute] = todayHours.open.split(':').map(Number);
  const [closeHour, closeMinute] = todayHours.close.split(':').map(Number);
  const openTime = openHour * 60 + openMinute;
  let closeTime = closeHour * 60 + closeMinute;
  
  // Handle overnight hours (e.g., 18:00 - 00:00 or 18:00 - 02:00)
  if (closeTime <= openTime) {
    closeTime += 24 * 60;
    const adjustedCurrentTime = currentTime < openTime ? currentTime + 24 * 60 : currentTime;
    return adjustedCurrentTime >= openTime && adjustedCurrentTime <= closeTime;
  }
  
  return currentTime >= openTime && currentTime <= closeTime;
};

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [commerces, setCommerces] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("explore");
  
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    cep: "",
    city: "",
    neighborhood: "",
    address: "",
    address_number: "",
    complement: "",
    bio: "",
    birthday: "",
  });

  // Initial fetch only once when component mounts
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    
    // Only fetch data on initial load, not on every tab change
    if (!initialLoadDone) {
      fetchAllData();
      setInitialLoadDone(true);
    }
  }, [user, navigate, initialLoadDone]);

  const fetchAllData = async () => {
    if (!user) return;
    setLoading(true);
    
    await Promise.all([
      fetchProfile(),
      fetchOrders(),
      fetchFavorites(),
      fetchCommerces(),
    ]);
    
    setLoading(false);
  };

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
      // Fix timezone issue for birthday - ensure we use the date as-is without timezone conversion
      let formattedBirthday = "";
      if (data.birthday) {
        // If it's already in YYYY-MM-DD format, use it directly
        formattedBirthday = data.birthday.split('T')[0];
      }
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        cep: data.cep || "",
        city: data.city || "",
        neighborhood: data.neighborhood || "",
        address: data.address || "",
        address_number: data.address_number || "",
        complement: data.complement || "",
        bio: data.bio || "",
        birthday: formattedBirthday,
      });
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id, created_at, status, total, order_type,
        commerce:commerces(fantasy_name, logo_url)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching orders:', error);
      return;
    }
    
    setOrders((data || []) as unknown as Order[]);
  };

  const fetchFavorites = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('favorites')
      .select(`
        id, commerce_id,
        commerce:commerces(fantasy_name, logo_url, cover_url, city, is_open)
      `)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('Error fetching favorites:', error);
      return;
    }
    
    setFavorites((data || []) as unknown as Favorite[]);
  };

  const fetchCommerces = async () => {
    // Use public view for security (excludes sensitive owner data)
    const { data, error } = await supabase
      .from('commerces_public')
      .select('id, fantasy_name, logo_url, cover_url, city, neighborhood, is_open, opening_hours, whatsapp')
      .eq('is_open', true)
      .limit(50);
    
    if (error) {
      console.error('Error fetching commerces:', error);
      return;
    }

    // Filter by actual opening hours and fetch ratings
    const commercesWithRatings = await Promise.all(
      (data || [])
        .filter(commerce => isStoreOpen(commerce.is_open, commerce.opening_hours as OpeningHours))
        .map(async (commerce) => {
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .eq('commerce_id', commerce.id);
          
          const reviewCount = reviews?.length || 0;
          const averageRating = reviewCount > 0 
            ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount 
            : 0;
          
          return {
            ...commerce,
            averageRating,
            reviewCount
          };
        })
    );
    
    setCommerces(commercesWithRatings as Commerce[]);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingAvatar(true);
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar foto",
        description: uploadError.message,
      });
      setUploadingAvatar(false);
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(filePath);
    
    await supabase
      .from('profiles')
      .update({ avatar_url: `${publicUrl}?t=${Date.now()}` })
      .eq('user_id', user.id);
    
    toast({ title: "Foto atualizada!" });
    setUploadingAvatar(false);
    fetchProfile();
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
        bio: formData.bio,
        birthday: formData.birthday || null,
      })
      .eq('user_id', user.id);
    
    setSaving(false);
    
    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: error.message });
      return;
    }
    
    toast({ title: "Perfil atualizado!" });
    setEditing(false);
    fetchProfile();
  };

  const toggleFavorite = async (commerceId: string) => {
    if (!user) return;
    
    const isFavorite = favorites.some(f => f.commerce_id === commerceId);
    
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('commerce_id', commerceId);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, commerce_id: commerceId });
    }
    
    fetchFavorites();
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

  // Check if searchQuery looks like a CEP (8 digits)
  const isSearchingByCep = /^\d{5}-?\d{3}$|^\d{8}$/.test(searchQuery.replace(/\D/g, '') ? searchQuery : '');
  const normalizedCepSearch = searchQuery.replace(/\D/g, '');

  const filteredCommerces = commerces.filter(c => {
    // If searching by CEP, show all open commerces (CEP filtering happens at fetch level)
    if (normalizedCepSearch.length >= 5) {
      return true; // All open commerces are shown (already filtered by is_open)
    }
    return c.fantasy_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.neighborhood?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const memberSince = profile?.created_at 
    ? formatDistanceToNow(new Date(profile.created_at), { locale: ptBR, addSuffix: true })
    : '';

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
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex items-center gap-2">
              <img src={logoMobdega} alt="Mobdega" className="h-9" />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/10 border-2 border-primary">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <div className="hidden sm:block text-right">
                <p className="font-medium text-foreground text-sm">{profile?.full_name?.split(' ')[0]}</p>
                <p className="text-xs text-muted-foreground">Membro {memberSince}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 mb-6 text-white relative overflow-hidden">
            <div className="relative z-10">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Olá, {profile?.full_name?.split(' ')[0]}! 👋
              </h1>
              <p className="text-white/80">
                O que você vai pedir hoje?
              </p>
            </div>
            <div className="absolute right-0 bottom-0 opacity-10">
              <Store className="w-32 h-32" />
            </div>
          </div>

          {/* Quick Stats - Clickable Cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card 
              className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('orders')}
            >
              <Package className="w-6 h-6 mx-auto text-primary mb-2" />
              <p className="text-2xl font-bold text-foreground">{orders.length}</p>
              <p className="text-xs text-muted-foreground">Pedidos</p>
            </Card>
            <Card 
              className="text-center p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => setActiveTab('favorites')}
            >
              <Heart className="w-6 h-6 mx-auto text-red-500 mb-2" />
              <p className="text-2xl font-bold text-foreground">{favorites.length}</p>
              <p className="text-xs text-muted-foreground">Favoritos</p>
            </Card>
            <Card className="text-center p-4">
              <Award className="w-6 h-6 mx-auto text-accent mb-2" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Pontos</p>
            </Card>
          </div>

          {/* Check if viewing a commerce storefront */}
          {activeTab.startsWith('vitrine-') ? (
            <CommerceStorefront 
              commerceId={activeTab.replace('vitrine-', '')} 
              onBack={() => setActiveTab('explore')} 
            />
          ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1">
              <TabsTrigger value="explore" className="flex flex-col gap-1 py-2">
                <Search className="w-4 h-4" />
                <span className="text-xs">Explorar</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex flex-col gap-1 py-2">
                <Package className="w-4 h-4" />
                <span className="text-xs">Pedidos</span>
              </TabsTrigger>
              <TabsTrigger value="favorites" className="flex flex-col gap-1 py-2">
                <Heart className="w-4 h-4" />
                <span className="text-xs">Favoritos</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex flex-col gap-1 py-2">
                <User className="w-4 h-4" />
                <span className="text-xs">Perfil</span>
              </TabsTrigger>
            </TabsList>

            {/* Explore Tab */}
            <TabsContent value="explore">
              <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar adegas e tabacarias..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>

                {/* Commerce List */}
                <div className="space-y-3">
                  {filteredCommerces.map((commerce) => {
                    const isFav = favorites.some(f => f.commerce_id === commerce.id);
                    return (
                      <motion.div
                        key={commerce.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-card rounded-xl overflow-hidden shadow-sm border border-border"
                      >
                        <div className="flex">
                          <div className="relative w-24 h-24 flex-shrink-0 bg-muted">
                            {commerce.cover_url || commerce.logo_url ? (
                              <img
                                src={commerce.cover_url || commerce.logo_url || ''}
                                alt={commerce.fantasy_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                <Store className="w-8 h-8 text-primary/50" />
                              </div>
                            )}
                            {/* Rating badge on logo */}
                            {commerce.averageRating !== undefined && commerce.averageRating > 0 && (
                              <div className="absolute bottom-1 right-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <Star className="w-3 h-3 fill-current" />
                                {commerce.averageRating.toFixed(1)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 p-3 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-foreground">{commerce.fantasy_name}</h3>
                                <button onClick={() => toggleFavorite(commerce.id)}>
                                  <Heart className={`w-5 h-5 ${isFav ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
                                </button>
                              </div>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {commerce.neighborhood}, {commerce.city}
                              </p>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge className={`${commerce.is_open ? 'bg-green-500' : 'bg-red-500'} text-white border-0 text-xs`}>
                                {commerce.is_open ? 'Aberto' : 'Fechado'}
                              </Badge>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-primary"
                                onClick={() => setActiveTab(`vitrine-${commerce.id}`)}
                              >
                                Acessar <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {filteredCommerces.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Store className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nenhum estabelecimento encontrado</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5" />
                    Histórico de Pedidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Nenhum pedido ainda</p>
                      <p className="text-sm">Explore os estabelecimentos e faça seu primeiro pedido!</p>
                      <Button className="mt-4" onClick={() => setActiveTab("explore")}>
                        Explorar
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const status = getStatusLabel(order.status);
                        return (
                          <div key={order.id} className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {order.commerce?.logo_url ? (
                                <img src={order.commerce.logo_url} alt="" className="w-full h-full rounded-full object-cover" />
                              ) : (
                                <Package className="w-6 h-6 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">
                                {order.commerce?.fantasy_name || 'Pedido'}
                              </p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(order.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge className={`${status.color} text-white border-0 text-xs`}>
                                {status.label}
                              </Badge>
                              <p className="font-semibold text-foreground mt-1">
                                {formatCurrency(order.total)}
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

            {/* Favorites Tab */}
            <TabsContent value="favorites">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Meus Favoritos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">Nenhum favorito ainda</p>
                      <p className="text-sm">Salve seus estabelecimentos preferidos!</p>
                      <Button className="mt-4" onClick={() => setActiveTab("explore")}>
                        Explorar
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {favorites.map((fav) => (
                        <div key={fav.id} className="bg-muted/50 rounded-xl overflow-hidden">
                        <div className="h-24 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                            {fav.commerce?.cover_url ? (
                              <img src={fav.commerce.cover_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Store className="w-8 h-8 text-primary/30" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-card border-2 border-background -mt-9 overflow-hidden flex-shrink-0">
                                {fav.commerce?.logo_url ? (
                                  <img src={fav.commerce.logo_url} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                                    <Store className="w-5 h-5 text-primary/50" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h3 className="font-semibold text-foreground truncate">{fav.commerce?.fantasy_name}</h3>
                                  <button onClick={() => toggleFavorite(fav.commerce_id)}>
                                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                                  </button>
                                </div>
                                <p className="text-sm text-muted-foreground">{fav.commerce?.city}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="space-y-6">
                {/* Avatar Section */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center">
                      <div className="relative">
                        <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border-4 border-primary">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/10">
                              <User className="w-12 h-12 text-primary" />
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="absolute bottom-0 right-0 w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white shadow-lg hover:bg-primary/90 transition-colors"
                        >
                          {uploadingAvatar ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Camera className="w-4 h-4" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />
                      </div>
                      <h2 className="text-xl font-bold text-foreground mt-4">{profile?.full_name}</h2>
                      <p className="text-muted-foreground">{profile?.email}</p>
                      {profile?.bio && (
                        <p className="text-center text-sm text-muted-foreground mt-2 max-w-xs">{profile.bio}</p>
                      )}
                      <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Membro {memberSince}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Profile Form */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
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
                          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-foreground">
                            <User className="w-4 h-4 text-muted-foreground" />
                            {profile?.full_name}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Data de Nascimento</Label>
                        {editing ? (
                          <Input
                            type="date"
                            value={formData.birthday}
                            onChange={(e) => setFormData(prev => ({ ...prev, birthday: e.target.value }))}
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-foreground">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {profile?.birthday ? format(new Date(profile.birthday), "dd/MM/yyyy") : "Não informado"}
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-foreground">
                          <Mail className="w-4 h-4 text-muted-foreground" />
                          {profile?.email}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>WhatsApp</Label>
                        {editing ? (
                          <Input
                            value={formData.phone}
                            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(00) 00000-0000"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg text-foreground">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            {profile?.phone || "Não informado"}
                          </div>
                        )}
                      </div>
                      
                      <div className="md:col-span-2 space-y-2">
                        <Label>Bio</Label>
                        {editing ? (
                          <Textarea
                            value={formData.bio}
                            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                            placeholder="Conte um pouco sobre você..."
                            rows={3}
                          />
                        ) : (
                          <div className="p-2.5 bg-muted/50 rounded-lg text-foreground min-h-[60px]">
                            {profile?.bio || "Nenhuma bio ainda..."}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Info */}
                    <div>
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Home className="w-4 h-4" />
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
                              {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin" />}
                            </div>
                          ) : (
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.cep || "—"}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Cidade</Label>
                          {editing ? (
                            <Input value={formData.city} readOnly className="bg-muted/50" />
                          ) : (
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.city || "—"}</p>
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
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.neighborhood || "—"}</p>
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
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.address || "—"}</p>
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
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.address_number || "—"}</p>
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
                            <p className="p-2.5 bg-muted/50 rounded-lg">{profile?.complement || "—"}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default UserDashboard;