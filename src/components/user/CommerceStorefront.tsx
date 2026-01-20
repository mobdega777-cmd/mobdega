import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Store, MapPin, Phone, Clock, Star, Heart,
  UtensilsCrossed, Truck, MessageCircle, ShoppingCart, ChevronRight,
  X, Plus, Minus, Send, User, CreditCard, Banknote, Smartphone, DollarSign,
  Check, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commerce {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  cover_url: string | null;
  city: string | null;
  neighborhood: string | null;
  address: string | null;
  phone: string;
  whatsapp: string | null;
  is_open: boolean | null;
  delivery_enabled: boolean | null;
  opening_hours: Record<string, { open: string; close: string; enabled: boolean }> | null;
  table_payment_required: boolean;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  promotional_price: number | null;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean | null;
}

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  user_name?: string;
}

interface Table {
  id: string;
  number: number;
  name: string | null;
  capacity: number | null;
  status: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface DeliveryZone {
  id: string;
  name: string;
  cep_start: string;
  cep_end: string;
  delivery_fee: number;
  estimated_time: number;
}

interface CommerceStorefrontProps {
  commerceId: string;
  onBack: () => void;
}

const CommerceStorefront = ({ commerceId, onBack }: CommerceStorefrontProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [commerce, setCommerce] = useState<Commerce | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [activeTab, setActiveTab] = useState("menu");
  
  // Order mode and cart
  const [orderMode, setOrderMode] = useState<'none' | 'table' | 'delivery'>('none');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showOrderStatusModal, setShowOrderStatusModal] = useState(false);
  
  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Delivery/order form
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  
  // User profile for delivery - editable fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCep, setCustomerCep] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");
  const [customerComplement, setCustomerComplement] = useState("");
  const [customerNeighborhood, setCustomerNeighborhood] = useState("");
  const [customerCity, setCustomerCity] = useState("");

  // Payment
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [commercePixKey, setCommercePixKey] = useState<string | null>(null);
  const [commercePixQrCode, setCommercePixQrCode] = useState<string | null>(null);

  // Order status tracking
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("pending");

  useEffect(() => {
    fetchCommerceData();
  }, [commerceId]);

  const fetchCommerceData = async () => {
    setLoading(true);
    
    // Fetch commerce details including table_payment_required
    const { data: commerceData } = await supabase
      .from('commerces')
      .select('*, table_payment_required')
      .eq('id', commerceId)
      .single();
    
    if (commerceData) {
      setCommerce({
        ...commerceData,
        table_payment_required: commerceData.table_payment_required ?? true
      } as unknown as Commerce);
    }

    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('categories')
      .select('id, name, description')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('sort_order');
    
    setCategories(categoriesData || []);

    // Fetch products
    const { data: productsData } = await supabase
      .from('products')
      .select('id, name, description, price, promotional_price, image_url, category_id, is_featured')
      .eq('commerce_id', commerceId)
      .eq('is_active', true)
      .order('name');
    
    setProducts(productsData || []);

    // Fetch reviews with user names
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('commerce_id', commerceId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Fetch user names for reviews
    if (reviewsData && reviewsData.length > 0) {
      const userIds = [...new Set(reviewsData.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      const reviewsWithNames = reviewsData.map(r => ({
        ...r,
        user_name: profileMap.get(r.user_id) || 'Usuário'
      }));
      setReviews(reviewsWithNames);
    } else {
      setReviews([]);
    }

    // Fetch tables
    const { data: tablesData } = await supabase
      .from('tables')
      .select('id, number, name, capacity, status')
      .eq('commerce_id', commerceId)
      .order('number');
    
    setTables(tablesData || []);

    // Fetch delivery zones
    const { data: zonesData } = await supabase
      .from('delivery_zones')
      .select('*')
      .eq('commerce_id', commerceId)
      .eq('is_active', true);
    
    setDeliveryZones(zonesData || []);

    // Fetch favorites count for this commerce
    const { count: favsCount } = await supabase
      .from('favorites')
      .select('*', { count: 'exact', head: true })
      .eq('commerce_id', commerceId);
    
    setFavoritesCount(favsCount || 0);

    // Fetch billing config for PIX
    const { data: billingData } = await supabase
      .from('billing_config')
      .select('pix_key, qr_code_url')
      .limit(1)
      .maybeSingle();
    
    if (billingData) {
      setCommercePixKey(billingData.pix_key);
      setCommercePixQrCode(billingData.qr_code_url);
    }

    // Check if favorite and fetch user profile
    if (user) {
      const { data: favData } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('commerce_id', commerceId)
        .maybeSingle();
      
      setIsFavorite(!!favData);

      // Fetch user profile for delivery
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone, cep, address, address_number, city, neighborhood, complement')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setCustomerName(profileData.full_name || "");
        setCustomerPhone(profileData.phone || "");
        setCustomerCep(profileData.cep || "");
        setCustomerAddress(profileData.address || "");
        setCustomerNumber(profileData.address_number || "");
        setCustomerComplement(profileData.complement || "");
        setCustomerNeighborhood(profileData.neighborhood || "");
        setCustomerCity(profileData.city || "");
      }
    }

    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('commerce_id', commerceId);
      setIsFavorite(false);
      setFavoritesCount(prev => Math.max(0, prev - 1));
      toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, commerce_id: commerceId });
      setIsFavorite(true);
      setFavoritesCount(prev => prev + 1);
      toast({ title: "Adicionado aos favoritos" });
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const filteredProducts = activeCategory 
    ? products.filter(p => p.category_id === activeCategory)
    : products;

  const featuredProducts = products.filter(p => p.is_featured);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  // Check if CEP is covered by delivery zones
  const isCepCovered = (): boolean => {
    if (!customerCep || deliveryZones.length === 0) return false;
    const userCep = parseInt(customerCep.replace(/\D/g, ''));
    if (isNaN(userCep)) return false;
    
    for (const zone of deliveryZones) {
      const start = parseInt(zone.cep_start.replace(/\D/g, ''));
      const end = parseInt(zone.cep_end.replace(/\D/g, ''));
      if (userCep >= start && userCep <= end) {
        return true;
      }
    }
    return false;
  };

  // Cart functions
  const addToCart = (product: Product) => {
    if (orderMode === 'none') {
      toast({ 
        title: "Escolha um modo de pedido", 
        description: "Selecione 'Pedir na Mesa' ou 'Pedir Delivery' primeiro",
        variant: "destructive" 
      });
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast({ title: "Produto adicionado ao carrinho!" });
  };

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => 
          item.product.id === productId 
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter(item => item.quantity > 0);
    });
  };

  const cartTotal = cart.reduce((sum, item) => {
    const price = item.product.promotional_price || item.product.price;
    return sum + (price * item.quantity);
  }, 0);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate delivery fee based on CEP
  const calculateDeliveryFee = (): number => {
    if (!customerCep || deliveryZones.length === 0) return 0;
    
    const userCep = parseInt(customerCep.replace(/\D/g, ''));
    
    for (const zone of deliveryZones) {
      const start = parseInt(zone.cep_start.replace(/\D/g, ''));
      const end = parseInt(zone.cep_end.replace(/\D/g, ''));
      if (userCep >= start && userCep <= end) {
        return zone.delivery_fee;
      }
    }
    return 0;
  };

  const deliveryFee = calculateDeliveryFee();
  const orderTotal = orderMode === 'delivery' ? cartTotal + deliveryFee : cartTotal;

  // Calculate change for cash payment
  const cashChange = cashReceived ? Math.max(0, parseFloat(cashReceived) - orderTotal) : 0;

  // Handle table selection
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setOrderMode('table');
    setShowTableModal(false);
    toast({ title: `Mesa ${table.number} selecionada!` });
  };

  // Handle order modes - exclusive selection (toggle behavior)
  const handlePedirNaMesa = () => {
    if (tables.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma mesa disponível" });
      return;
    }
    // Always open the table modal to select a table
    setShowTableModal(true);
  };

  const handlePedirDelivery = () => {
    if (!commerce?.delivery_enabled) {
      toast({ variant: "destructive", title: "Delivery indisponível", description: "Este estabelecimento não está aceitando pedidos de delivery no momento" });
      return;
    }
    // Toggle delivery mode - reset table selection
    setSelectedTable(null);
    setOrderMode('delivery');
    toast({ title: "Modo Delivery selecionado!", description: "Adicione produtos ao carrinho" });
  };

  // Submit review
  const submitReview = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Faça login para avaliar" });
      return;
    }

    setSubmittingReview(true);

    const { error } = await supabase
      .from('reviews')
      .insert({
        commerce_id: commerceId,
        user_id: user.id,
        rating: reviewRating,
        comment: reviewComment || null
      });

    if (error) {
      if (error.code === '23505') {
        toast({ variant: "destructive", title: "Você já avaliou este estabelecimento" });
      } else {
        toast({ variant: "destructive", title: "Erro ao enviar avaliação", description: error.message });
      }
    } else {
      toast({ title: "Avaliação enviada!" });
      setShowReviewModal(false);
      setReviewRating(5);
      setReviewComment("");
      fetchCommerceData(); // Refresh reviews
    }

    setSubmittingReview(false);
  };

  // Open cart modal
  const openCartModal = () => {
    setShowCartModal(true);
  };

  // Proceed to payment or directly submit order for table orders without payment
  const proceedToPayment = () => {
    // Validate CEP for delivery orders
    if (orderMode === 'delivery' && !isCepCovered()) {
      toast({ 
        variant: "destructive", 
        title: "CEP não atendido", 
        description: "Infelizmente este CEP não está na área de entrega do estabelecimento." 
      });
      return;
    }
    
    setShowCartModal(false);
    
    // For table orders: check if payment is required
    if (orderMode === 'table' && commerce && !commerce.table_payment_required) {
      // Skip payment modal - submit order directly with payment_method as "pending"
      submitOrderWithoutPayment();
    } else {
      // Show payment modal
      setShowPaymentModal(true);
    }
  };

  // Submit order without payment (for table orders when payment is disabled)
  const submitOrderWithoutPayment = async () => {
    if (!user || cart.length === 0) return;

    setSubmittingOrder(true);

    const subtotal = cartTotal;
    const total = orderTotal;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        commerce_id: commerceId,
        user_id: user.id,
        order_type: orderMode,
        table_id: selectedTable?.id || null,
        delivery_address: null,
        delivery_fee: 0,
        notes: deliveryNotes || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: 'pending', // Will be set by commerce when processing
        subtotal,
        total,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      toast({ variant: "destructive", title: "Erro ao criar pedido", description: orderError.message });
      setSubmittingOrder(false);
      return;
    }

    // Insert order items
    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.promotional_price || item.product.price,
      total_price: (item.product.promotional_price || item.product.price) * item.quantity
    }));

    await supabase.from('order_items').insert(orderItems);

    setCreatedOrderId(orderData.id);
    setOrderStatus('pending');
    setShowOrderStatusModal(true);

    // Reset cart and form
    setCart([]);
    setOrderMode('none');
    setSelectedTable(null);
    setDeliveryNotes("");
    setSubmittingOrder(false);

    toast({ title: "Pedido enviado com sucesso!" });
  };

  // Submit order with payment
  const submitOrder = async () => {
    if (!user || cart.length === 0 || !selectedPaymentMethod) return;

    setSubmittingOrder(true);

    const subtotal = cartTotal;
    const total = orderTotal;
    const fullAddress = orderMode === 'delivery' 
      ? `${customerAddress}, ${customerNumber}${customerComplement ? ' - ' + customerComplement : ''} - ${customerNeighborhood}, ${customerCity} - CEP: ${customerCep}`
      : null;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        commerce_id: commerceId,
        user_id: user.id,
        order_type: orderMode,
        table_id: selectedTable?.id || null,
        delivery_address: fullAddress,
        delivery_fee: orderMode === 'delivery' ? deliveryFee : 0,
        notes: deliveryNotes || null,
        customer_name: customerName,
        customer_phone: customerPhone,
        payment_method: selectedPaymentMethod,
        subtotal,
        total,
        status: 'pending'
      })
      .select()
      .single();

    if (orderError) {
      toast({ variant: "destructive", title: "Erro ao criar pedido", description: orderError.message });
      setSubmittingOrder(false);
      return;
    }

    // Insert order items
    const orderItems = cart.map(item => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.promotional_price || item.product.price,
      total_price: (item.product.promotional_price || item.product.price) * item.quantity
    }));

    await supabase.from('order_items').insert(orderItems);

    setCreatedOrderId(orderData.id);
    setOrderStatus('pending');
    setShowPaymentModal(false);
    setShowOrderStatusModal(true);

    // Reset cart and form
    setCart([]);
    setOrderMode('none');
    setSelectedTable(null);
    setSelectedPaymentMethod(null);
    setCashReceived("");
    setDeliveryNotes("");
    setSubmittingOrder(false);

    toast({ title: "Pedido enviado com sucesso!" });
  };

  // Subscribe to order status changes
  useEffect(() => {
    if (!createdOrderId) return;

    const channel = supabase
      .channel(`order-${createdOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${createdOrderId}` },
        (payload) => {
          setOrderStatus(payload.new.status);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [createdOrderId]);

  const getOrderStatusStep = () => {
    switch (orderStatus) {
      case 'pending': return 0;
      case 'confirmed':
      case 'preparing': return 1;
      case 'delivering':
      case 'delivered': return 2;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!commerce) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Estabelecimento não encontrado</p>
        <Button onClick={onBack} className="mt-4">Voltar</Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4 pb-20"
    >
      {/* Header with cover */}
      <div className="relative rounded-2xl overflow-hidden">
        <div className="h-40 bg-gradient-to-br from-primary/30 to-secondary/30">
          {commerce.cover_url && (
            <img src={commerce.cover_url} alt="" className="w-full h-full object-cover" />
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="absolute top-3 left-3 bg-primary text-white hover:bg-primary/90"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Favorite button with count */}
        <div className="absolute top-3 right-3 flex flex-col items-center">
          <button
            onClick={toggleFavorite}
            className="w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
          </button>
          <span className="text-xs text-white bg-black/50 px-2 py-0.5 rounded-full mt-1">
            {favoritesCount}
          </span>
        </div>

        {/* Commerce Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-end gap-3">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-xl bg-card border-2 border-background overflow-hidden">
                {commerce.logo_url ? (
                  <img src={commerce.logo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <Store className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>
              {/* Rating badge on logo */}
              {averageRating && (
                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-current" />
                  {averageRating}
                </div>
              )}
            </div>
            <div className="flex-1 text-white">
              <h2 className="text-xl font-bold">{commerce.fantasy_name}</h2>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <MapPin className="w-3 h-3" />
                <span>{commerce.neighborhood}, {commerce.city}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className={`${commerce.is_open ? 'bg-green-500' : 'bg-red-500'} text-white border-0`}>
            {commerce.is_open ? 'Aberto' : 'Fechado'}
          </Badge>
          {averageRating && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">{averageRating}</span>
              <span className="text-muted-foreground">({reviews.length})</span>
            </div>
          )}
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Phone className="w-4 h-4" />
          Contato
        </Button>
      </div>

      {/* Action Buttons - Exclusive selection */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className={`gap-1 h-14 text-sm sm:text-base px-2 sm:px-4`} 
          variant={orderMode === 'table' ? 'default' : 'outline'}
          onClick={handlePedirNaMesa}
        >
          <UtensilsCrossed className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">{selectedTable ? `Mesa ${selectedTable.number}` : 'Mesa'}</span>
        </Button>
        <Button 
          className={`gap-1 h-14 text-sm sm:text-base px-2 sm:px-4`} 
          variant={orderMode === 'delivery' ? 'default' : 'outline'}
          onClick={handlePedirDelivery}
          disabled={!commerce.delivery_enabled}
        >
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="truncate">Delivery</span>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full ${orderMode === 'table' ? 'grid-cols-3' : 'grid-cols-2'}`}>
          <TabsTrigger value="menu" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cardápio
          </TabsTrigger>
          {orderMode === 'table' && (
            <TabsTrigger value="comanda" className="gap-2">
              <UtensilsCrossed className="w-4 h-4" />
              Comanda
            </TabsTrigger>
          )}
          <TabsTrigger value="reviews" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            Avaliações ({reviews.length})
          </TabsTrigger>
        </TabsList>

        {/* Menu Tab */}
        <TabsContent value="menu" className="space-y-4 mt-4">
          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              <Button
                variant={activeCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(null)}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                  className="whitespace-nowrap"
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          )}

          {/* Featured Products */}
          {activeCategory === null && featuredProducts.length > 0 && (
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                Destaques
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {featuredProducts.map((product) => (
                  <Card key={product.id} className="overflow-hidden">
                    {product.image_url && (
                      <div className="h-24 bg-muted">
                        <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-3">
                      <h4 className="font-medium text-sm text-foreground truncate">{product.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-primary">
                          {formatCurrency(product.promotional_price || product.price)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Products List */}
          <div className="space-y-3">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden">
                <div className="flex">
                  {product.image_url && (
                    <div className="w-24 h-24 flex-shrink-0 bg-muted">
                      <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <CardContent className="flex-1 p-3">
                    <h4 className="font-medium text-foreground">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-primary">
                        {formatCurrency(product.promotional_price || product.price)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8"
                        onClick={() => addToCart(product)}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto encontrado</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Comanda Tab - Only for table orders */}
        {orderMode === 'table' && (
          <TabsContent value="comanda" className="space-y-4 mt-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Sua comanda está vazia</p>
                <p className="text-sm mt-1">Adicione itens do cardápio para ver aqui</p>
              </div>
            ) : (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UtensilsCrossed className="w-5 h-5 text-primary" />
                    Comanda - Mesa {selectedTable?.number}
                    {selectedTable?.name && <span className="text-sm font-normal text-muted-foreground">({selectedTable.name})</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Cart Items */}
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                        {item.product.image_url && (
                          <img src={item.product.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.quantity}x {formatCurrency(item.product.promotional_price || item.product.price)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                          <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="font-bold text-primary text-sm">
                          {formatCurrency((item.product.promotional_price || item.product.price) * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Itens no pedido</span>
                      <span>{cartItemsCount}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(cartTotal)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <Button className="w-full h-12" onClick={openCartModal}>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Pedido
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
          {/* Add Review Button - At top */}
          <Button className="w-full" variant="default" onClick={() => setShowReviewModal(true)}>
            Adicionar Avaliação
          </Button>

          {/* Rating Summary */}
          {averageRating && (
            <Card className="bg-gradient-to-br from-primary/10 to-secondary/10">
              <CardContent className="pt-6 text-center">
                <div className="flex items-center justify-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-6 h-6 ${
                        star <= Math.round(Number(averageRating))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-3xl font-bold text-foreground">{averageRating}</p>
                <p className="text-sm text-muted-foreground">{reviews.length} avaliações</p>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          <div className="space-y-3">
            {reviews.map((review) => (
              <Card key={review.id}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground">{review.user_name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-foreground">{review.comment}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma avaliação ainda</p>
                <p className="text-sm">Seja o primeiro a avaliar!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed bottom-4 left-4 right-4 z-50"
        >
          <Button
            className="w-full h-14 text-lg gap-3"
            onClick={openCartModal}
          >
            <ShoppingCart className="w-5 h-5" />
            Ver Carrinho ({cartItemsCount})
            <span className="ml-auto">{formatCurrency(cartTotal)}</span>
          </Button>
        </motion.div>
      )}

      {/* Review Modal */}
      <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar {commerce.fantasy_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="mb-2 block">Sua avaliação</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= reviewRating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="comment">Comentário (opcional)</Label>
              <Textarea
                id="comment"
                placeholder="Conte como foi sua experiência..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewModal(false)}>
              Cancelar
            </Button>
            <Button onClick={submitReview} disabled={submittingReview}>
              {submittingReview ? 'Enviando...' : 'Enviar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Selection Modal */}
      <Dialog open={showTableModal} onOpenChange={setShowTableModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Selecione uma Mesa</DialogTitle>
          </DialogHeader>
          {tables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UtensilsCrossed className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma mesa cadastrada</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500" />
                  <span>Disponível</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500" />
                  <span>Ocupada</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {tables.map((table) => {
                  const isOccupied = table.status === 'occupied' || table.status === 'reserved';
                  const isAvailable = table.status === 'available';
                  return (
                    <Button
                      key={table.id}
                      variant="outline"
                      disabled={!isAvailable}
                      className={`h-20 flex flex-col border-2 ${
                        isOccupied 
                          ? 'bg-red-500/10 border-red-500 text-red-600 hover:bg-red-500/20' 
                          : isAvailable 
                            ? 'bg-green-500/10 border-green-500 text-green-700 hover:bg-green-500/20' 
                            : 'bg-muted border-muted-foreground/30'
                      }`}
                      onClick={() => handleSelectTable(table)}
                    >
                      <span className="text-lg font-bold">Mesa {table.number}</span>
                      {table.name && <span className="text-xs opacity-70">{table.name}</span>}
                      <span className="text-xs opacity-70">
                        {isOccupied ? 'Ocupada' : isAvailable ? `${table.capacity} lugares` : 'Fechada'}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cart Modal with full customer info */}
      <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {orderMode === 'table' ? `Seu Pedido - Mesa ${selectedTable?.number}` : 'Seu Pedido - Delivery'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cart Items */}
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {item.product.image_url && (
                  <img src={item.product.image_url} alt="" className="w-14 h-14 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-primary text-sm font-bold">
                    {item.quantity}x {formatCurrency(item.product.promotional_price || item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Customer Info - Editable */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="font-semibold text-foreground">Seus Dados</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="customerName">Nome</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Seu nome"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">Telefone</Label>
                  <Input
                    id="customerPhone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="mt-1"
                  />
                </div>
              </div>

              {orderMode === 'delivery' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="customerCep">CEP</Label>
                      <Input
                        id="customerCep"
                        value={customerCep}
                        onChange={(e) => setCustomerCep(e.target.value)}
                        placeholder="00000-000"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerCity">Cidade</Label>
                      <Input
                        id="customerCity"
                        value={customerCity}
                        onChange={(e) => setCustomerCity(e.target.value)}
                        placeholder="Cidade"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerNeighborhood">Bairro</Label>
                    <Input
                      id="customerNeighborhood"
                      value={customerNeighborhood}
                      onChange={(e) => setCustomerNeighborhood(e.target.value)}
                      placeholder="Bairro"
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="customerAddress">Endereço</Label>
                      <Input
                        id="customerAddress"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                        placeholder="Rua, Avenida..."
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customerNumber">Número</Label>
                      <Input
                        id="customerNumber"
                        value={customerNumber}
                        onChange={(e) => setCustomerNumber(e.target.value)}
                        placeholder="Nº"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customerComplement">Complemento</Label>
                    <Input
                      id="customerComplement"
                      value={customerComplement}
                      onChange={(e) => setCustomerComplement(e.target.value)}
                      placeholder="Apto, Bloco, Referência..."
                      className="mt-1"
                    />
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Alguma observação para o pedido?"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {orderMode === 'delivery' && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de entrega</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCartModal(false)}>
              Continuar Comprando
            </Button>
            <Button onClick={proceedToPayment}>
              Confirmar Pedido
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Forma de Pagamento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Payment Methods */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={selectedPaymentMethod === 'credit' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('credit')}
              >
                <CreditCard className="w-6 h-6" />
                <span>Crédito</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'debit' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('debit')}
              >
                <CreditCard className="w-6 h-6" />
                <span>Débito</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('cash')}
              >
                <Banknote className="w-6 h-6" />
                <span>Dinheiro</span>
              </Button>
              <Button
                variant={selectedPaymentMethod === 'pix' ? 'default' : 'outline'}
                className="h-20 flex flex-col gap-2"
                onClick={() => setSelectedPaymentMethod('pix')}
              >
                <Smartphone className="w-6 h-6" />
                <span>PIX</span>
              </Button>
            </div>

            {/* Cash - Change Calculator */}
            {selectedPaymentMethod === 'cash' && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div>
                  <Label htmlFor="cashReceived">Valor recebido</Label>
                  <Input
                    id="cashReceived"
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0,00"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-between font-bold text-lg">
                  <span>Total do pedido:</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
                {cashReceived && parseFloat(cashReceived) >= orderTotal && (
                  <div className="flex justify-between font-bold text-lg text-green-600">
                    <span>Troco:</span>
                    <span>{formatCurrency(cashChange)}</span>
                  </div>
                )}
              </div>
            )}

            {/* PIX - Show QR Code */}
            {selectedPaymentMethod === 'pix' && (
              <div className="p-4 bg-muted/50 rounded-lg space-y-3 text-center">
                <p className="font-medium">Pague via PIX</p>
                {commercePixQrCode && (
                  <div className="flex justify-center">
                    <img src={commercePixQrCode} alt="QR Code PIX" className="w-48 h-48 rounded-lg" />
                  </div>
                )}
                {commercePixKey && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Chave PIX:</p>
                    <p className="font-mono text-sm bg-card p-2 rounded break-all">{commercePixKey}</p>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  Total: <span className="font-bold text-foreground">{formatCurrency(orderTotal)}</span>
                </p>
              </div>
            )}

            {/* Order Summary */}
            <div className="pt-4 border-t">
              <div className="flex justify-between font-bold text-lg">
                <span>Total a pagar:</span>
                <span className="text-primary">{formatCurrency(orderTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setShowPaymentModal(false);
              setShowCartModal(true);
            }}>
              Voltar
            </Button>
            <Button 
              onClick={submitOrder} 
              disabled={!selectedPaymentMethod || submittingOrder}
            >
              {submittingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Confirmar Pagamento'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Status Modal - No auto-refresh, only manual close */}
      <Dialog open={showOrderStatusModal} onOpenChange={(open) => {
        // Only allow closing through the X button or Fechar button
        if (!open) {
          setShowOrderStatusModal(false);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Acompanhe seu Pedido</DialogTitle>
          </DialogHeader>
          <div className="py-8">
            {/* Status Steps */}
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-1 bg-muted">
                <div 
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${getOrderStatusStep() * 50}%` }}
                />
              </div>

              {/* Step 1: Waiting */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getOrderStatusStep() >= 0 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {getOrderStatusStep() > 0 ? <Check className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-2 text-center">Aguardando<br />Aprovação</span>
              </div>

              {/* Step 2: Preparing */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getOrderStatusStep() >= 1 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {getOrderStatusStep() > 1 ? <Check className="w-5 h-5" /> : <UtensilsCrossed className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-2 text-center">Preparando</span>
              </div>

              {/* Step 3: Ready/Delivering */}
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getOrderStatusStep() >= 2 ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {orderMode === 'delivery' ? <Truck className="w-5 h-5" /> : <Check className="w-5 h-5" />}
                </div>
                <span className="text-xs mt-2 text-center">
                  {orderMode === 'delivery' ? 'Saiu p/' : 'Pedido'}<br />
                  {orderMode === 'delivery' ? 'Entrega' : 'Pronto'}
                </span>
              </div>
            </div>

            <p className="text-center text-muted-foreground mt-8">
              {orderStatus === 'pending' && 'Aguardando confirmação do estabelecimento...'}
              {orderStatus === 'confirmed' && 'Pedido confirmado! Preparando...'}
              {orderStatus === 'preparing' && 'Seu pedido está sendo preparado!'}
              {orderStatus === 'delivering' && (orderMode === 'table' ? 'O atendente está levando o pedido até você.' : 'Pedido saiu para entrega!')}
              {orderStatus === 'delivered' && 'Pedido entregue! Obrigado pela preferência!'}
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowOrderStatusModal(false)} className="w-full">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CommerceStorefront;
