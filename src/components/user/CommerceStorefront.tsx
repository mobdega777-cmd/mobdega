import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, Store, MapPin, Phone, Clock, Star, Heart,
  UtensilsCrossed, Truck, MessageCircle, ShoppingCart, ChevronRight,
  X, Plus, Minus, Send
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
  const [activeTab, setActiveTab] = useState("menu");
  
  // Order mode and cart
  const [orderMode, setOrderMode] = useState<'none' | 'table' | 'delivery'>('none');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  
  // Modals
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  
  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  // Delivery form
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [submittingOrder, setSubmittingOrder] = useState(false);
  
  // User profile for delivery
  const [userProfile, setUserProfile] = useState<{
    full_name: string;
    phone: string | null;
    cep: string | null;
    address: string | null;
    address_number: string | null;
    city: string | null;
    neighborhood: string | null;
  } | null>(null);

  useEffect(() => {
    fetchCommerceData();
  }, [commerceId]);

  const fetchCommerceData = async () => {
    setLoading(true);
    
    // Fetch commerce details
    const { data: commerceData } = await supabase
      .from('commerces')
      .select('*')
      .eq('id', commerceId)
      .single();
    
    if (commerceData) {
      setCommerce(commerceData as unknown as Commerce);
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

    // Fetch reviews
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, user_id')
      .eq('commerce_id', commerceId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setReviews(reviewsData || []);

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
        .select('full_name, phone, cep, address, address_number, city, neighborhood')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (profileData) {
        setUserProfile(profileData);
        // Pre-fill delivery address
        if (profileData.address) {
          setDeliveryAddress(
            `${profileData.address}${profileData.address_number ? ', ' + profileData.address_number : ''} - ${profileData.neighborhood}, ${profileData.city}`
          );
        }
      }
    }

    setLoading(false);
  };

  const toggleFavorite = async () => {
    if (!user) return;
    
    if (isFavorite) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('commerce_id', commerceId);
      setIsFavorite(false);
      toast({ title: "Removido dos favoritos" });
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, commerce_id: commerceId });
      setIsFavorite(true);
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
      currency: 'BRL'
    }).format(value);
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
    if (!userProfile?.cep || deliveryZones.length === 0) return 0;
    
    const userCep = parseInt(userProfile.cep.replace(/\D/g, ''));
    
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

  // Handle table selection
  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    setOrderMode('table');
    setShowTableModal(false);
    toast({ title: `Mesa ${table.number} selecionada!` });
  };

  // Handle order modes
  const handlePedirNaMesa = () => {
    if (tables.length === 0) {
      toast({ variant: "destructive", title: "Nenhuma mesa disponível" });
      return;
    }
    setShowTableModal(true);
  };

  const handlePedirDelivery = () => {
    if (!commerce?.delivery_enabled) {
      toast({ variant: "destructive", title: "Delivery indisponível", description: "Este estabelecimento não está aceitando pedidos de delivery no momento" });
      return;
    }
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

  // Submit order
  const submitOrder = async () => {
    if (!user || cart.length === 0) return;

    setSubmittingOrder(true);

    const subtotal = cartTotal;
    const total = orderMode === 'delivery' ? subtotal + deliveryFee : subtotal;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        commerce_id: commerceId,
        user_id: user.id,
        order_type: orderMode,
        table_id: selectedTable?.id || null,
        delivery_address: orderMode === 'delivery' ? deliveryAddress : null,
        delivery_fee: orderMode === 'delivery' ? deliveryFee : 0,
        notes: deliveryNotes || null,
        customer_name: userProfile?.full_name || null,
        customer_phone: userProfile?.phone || null,
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

    toast({ title: "Pedido enviado com sucesso!", description: "Acompanhe o status na aba Pedidos" });
    setCart([]);
    setOrderMode('none');
    setSelectedTable(null);
    setShowDeliveryModal(false);
    setShowCartModal(false);
    setSubmittingOrder(false);
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
          className="absolute top-3 left-3 bg-black/50 text-white hover:bg-black/70"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* Commerce Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-end gap-3">
            <div className="w-16 h-16 rounded-xl bg-card border-2 border-background overflow-hidden flex-shrink-0">
              {commerce.logo_url ? (
                <img src={commerce.logo_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-primary/10">
                  <Store className="w-8 h-8 text-primary" />
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button 
          className={`gap-2 h-14 text-base ${orderMode === 'table' ? 'ring-2 ring-primary' : ''}`} 
          variant={orderMode === 'table' ? 'default' : 'outline'}
          onClick={handlePedirNaMesa}
        >
          <UtensilsCrossed className="w-5 h-5" />
          Pedir na Mesa
          {selectedTable && <Badge variant="secondary" className="ml-1">Mesa {selectedTable.number}</Badge>}
        </Button>
        <Button 
          className={`gap-2 h-14 text-base ${orderMode === 'delivery' ? 'ring-2 ring-primary' : ''}`} 
          variant={orderMode === 'delivery' ? 'default' : 'outline'}
          onClick={handlePedirDelivery}
          disabled={!commerce.delivery_enabled}
        >
          <Truck className="w-5 h-5" />
          Pedir Delivery
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="menu" className="gap-2">
            <ShoppingCart className="w-4 h-4" />
            Cardápio
          </TabsTrigger>
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

        {/* Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4 mt-4">
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
                  <div className="flex items-center gap-2 mb-2">
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
                    <span className="text-sm text-muted-foreground ml-auto">
                      {format(new Date(review.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
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
                <Button className="mt-4" variant="default" onClick={() => setShowReviewModal(true)}>
                  Seja o primeiro a avaliar
                </Button>
              </div>
            )}

            {reviews.length > 0 && (
              <Button className="w-full" variant="outline" onClick={() => setShowReviewModal(true)}>
                Adicionar Avaliação
              </Button>
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
            onClick={() => orderMode === 'delivery' ? setShowDeliveryModal(true) : setShowCartModal(true)}
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
          <div className="grid grid-cols-3 gap-3 py-4">
            {tables.map((table) => (
              <Button
                key={table.id}
                variant={table.status === 'available' ? 'outline' : 'ghost'}
                disabled={table.status !== 'available'}
                className="h-20 flex flex-col"
                onClick={() => handleSelectTable(table)}
              >
                <span className="text-lg font-bold">Mesa {table.number}</span>
                {table.name && <span className="text-xs text-muted-foreground">{table.name}</span>}
                <span className="text-xs text-muted-foreground">{table.capacity} lugares</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cart Modal (Table Order) */}
      <Dialog open={showCartModal} onOpenChange={setShowCartModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Seu Pedido - Mesa {selectedTable?.number}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {item.product.image_url && (
                  <img src={item.product.image_url} alt="" className="w-16 h-16 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-primary font-bold">
                    {formatCurrency(item.product.promotional_price || item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCartQuantity(item.product.id, -1)}>
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateCartQuantity(item.product.id, 1)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                placeholder="Alguma observação para o pedido?"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCartModal(false)}>
              Continuar Comprando
            </Button>
            <Button onClick={submitOrder} disabled={submittingOrder}>
              {submittingOrder ? 'Enviando...' : 'Enviar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Modal */}
      <Dialog open={showDeliveryModal} onOpenChange={setShowDeliveryModal}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar Delivery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cart Items */}
            {cart.map((item) => (
              <div key={item.product.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {item.product.image_url && (
                  <img src={item.product.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-sm">{item.product.name}</p>
                  <p className="text-primary text-sm">
                    {item.quantity}x {formatCurrency(item.product.promotional_price || item.product.price)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, -1)}>
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-6 text-center text-sm">{item.quantity}</span>
                  <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => updateCartQuantity(item.product.id, 1)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Delivery Address */}
            <div>
              <Label htmlFor="address">Endereço de Entrega</Label>
              <Input
                id="address"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Seu endereço completo"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="delivery-notes">Observações</Label>
              <Textarea
                id="delivery-notes"
                placeholder="Ponto de referência, instruções de entrega..."
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="mt-2"
              />
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega</span>
                <span>{formatCurrency(deliveryFee)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">{formatCurrency(cartTotal + deliveryFee)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeliveryModal(false)}>
              Continuar Comprando
            </Button>
            <Button onClick={submitOrder} disabled={submittingOrder || !deliveryAddress}>
              {submittingOrder ? 'Enviando...' : 'Confirmar Pedido'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default CommerceStorefront;