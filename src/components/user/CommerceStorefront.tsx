import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  ArrowLeft, Store, MapPin, Phone, Clock, Star, Heart,
  UtensilsCrossed, Truck, MessageCircle, ShoppingCart, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("menu");

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

    // Check if favorite
    if (user) {
      const { data: favData } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('commerce_id', commerceId)
        .maybeSingle();
      
      setIsFavorite(!!favData);
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
      className="space-y-4"
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
        <Button className="gap-2 h-14 text-base" variant="outline">
          <UtensilsCrossed className="w-5 h-5" />
          Pedir na Mesa
        </Button>
        <Button className="gap-2 h-14 text-base gradient-primary text-white">
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
                        {product.promotional_price ? (
                          <>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="font-bold text-green-500">
                              {formatCurrency(product.promotional_price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                        )}
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
                      <div className="flex items-center gap-2">
                        {product.promotional_price ? (
                          <>
                            <span className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.price)}
                            </span>
                            <span className="font-bold text-green-500">
                              {formatCurrency(product.promotional_price)}
                            </span>
                          </>
                        ) : (
                          <span className="font-bold text-primary">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="h-8">
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
                <Button className="mt-4" variant="outline">
                  Seja o primeiro a avaliar
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default CommerceStorefront;
