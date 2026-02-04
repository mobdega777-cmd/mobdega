import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Heart, 
  MapPin, 
  Store,
  Medal,
  Crown,
  Loader2,
  Info,
  AlertTriangle,
  Truck,
  Settings2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface CommerceRankingData {
  id: string;
  fantasy_name: string;
  logo_url: string | null;
  city: string | null;
  neighborhood: string | null;
  cep: string | null;
  plan_type: string;
  avg_rating: number;
  review_count: number;
  favorites_count: number;
  zone: string;
  delivery_count: number;
  tools_usage_score: number;
}

// Categorias de ranking
type RankingCategory = "rating" | "delivery" | "gestao";

const DIVISIONS = {
  basic: { name: "Bronze", color: "from-amber-700 to-amber-900", badge: "bg-amber-700", icon: Medal },
  startup: { name: "Prata", color: "from-gray-400 to-gray-600", badge: "bg-gray-500", icon: Trophy },
  business: { name: "Ouro", color: "from-yellow-400 to-yellow-600", badge: "bg-yellow-500", icon: Crown },
};

// Categorias especiais
const SPECIAL_CATEGORIES = {
  delivery: { 
    name: "Top Delivery", 
    color: "from-blue-500 to-blue-700", 
    badge: "bg-blue-600", 
    icon: Truck,
    description: "Ranking por quantidade de entregas realizadas"
  },
  gestao: { 
    name: "Gestão 10", 
    color: "from-emerald-500 to-emerald-700", 
    badge: "bg-emerald-600", 
    icon: Settings2,
    description: "Ranking por uso completo das ferramentas do sistema"
  },
};

const ZONE_GROUPS = [
  {
    label: "São Paulo Capital",
    zones: [
      { id: "centro", name: "Centro" },
      { id: "norte", name: "Zona Norte" },
      { id: "sul", name: "Zona Sul" },
      { id: "leste", name: "Zona Leste" },
      { id: "oeste", name: "Zona Oeste" },
    ]
  },
  {
    label: "Região Oeste",
    zones: [
      { id: "osasco", name: "Osasco" },
      { id: "carapicuiba", name: "Carapicuíba" },
      { id: "barueri", name: "Barueri" },
      { id: "santana_parnaiba", name: "Santana do Parnaíba" },
      { id: "itapevi", name: "Itapevi" },
      { id: "jandira", name: "Jandira" },
      { id: "cotia", name: "Cotia" },
      { id: "vargem_grande", name: "Vargem Grande Paulista" },
      { id: "taboao", name: "Taboão da Serra" },
      { id: "embu", name: "Embu" },
      { id: "itapecirica", name: "Itapecirica da Serra" },
      { id: "embu_guacu", name: "Embu-Guaçu" },
    ]
  },
  {
    label: "Região Norte",
    zones: [
      { id: "guarulhos", name: "Guarulhos" },
      { id: "aruja", name: "Arujá" },
      { id: "santa_isabel", name: "Santa Isabel" },
      { id: "mairipora", name: "Mairiporã" },
      { id: "caieiras", name: "Caieiras" },
      { id: "cajamar", name: "Cajamar" },
      { id: "jordanesia", name: "Jordanésia" },
      { id: "polvilho", name: "Polvilho" },
      { id: "franco_rocha", name: "Franco da Rocha" },
      { id: "francisco_morato", name: "Francisco Morato" },
    ]
  },
  {
    label: "Região Leste",
    zones: [
      { id: "ferraz", name: "Ferraz de Vasconcelos" },
      { id: "poa", name: "Poá" },
      { id: "itaquaquecetuba", name: "Itaquaquecetuba" },
      { id: "suzano", name: "Suzano" },
      { id: "mogi", name: "Mogi das Cruzes" },
      { id: "guararema", name: "Guararema" },
    ]
  },
  {
    label: "ABC Paulista",
    zones: [
      { id: "santo_andre", name: "Santo André" },
      { id: "maua", name: "Mauá" },
      { id: "ribeirao_pires", name: "Ribeirão Pires" },
      { id: "rio_grande_serra", name: "Rio Grande da Serra" },
      { id: "sao_caetano", name: "São Caetano do Sul" },
      { id: "sao_bernardo", name: "São Bernardo do Campo" },
      { id: "diadema", name: "Diadema" },
    ]
  },
];

const ALL_ZONES = ZONE_GROUPS.flatMap(g => g.zones);

const getZoneFromCep = (cep: string | null): string => {
  if (!cep) return "centro";
  
  const cleanCep = cep.replace(/\D/g, '').padStart(8, '0');
  const numCep = parseInt(cleanCep);
  
  if (numCep >= 8000000 && numCep <= 8499999) return "leste";
  if (numCep >= 1000000 && numCep <= 1599999) return "centro";
  if (numCep >= 2000000 && numCep <= 2999999) return "norte";
  if (numCep >= 3000000 && numCep <= 3999999) return "leste";
  if (numCep >= 4000000 && numCep <= 4999999) return "sul";
  if (numCep >= 5000000 && numCep <= 5899999) return "oeste";
  if (numCep >= 6000000 && numCep <= 6299999) return "osasco";
  if (numCep >= 6300000 && numCep <= 6399999) return "carapicuiba";
  if (numCep >= 6400000 && numCep <= 6499999) return "barueri";
  if (numCep >= 6500000 && numCep <= 6549999) return "santana_parnaiba";
  if (numCep >= 6650000 && numCep <= 6699999) return "itapevi";
  if (numCep >= 6600000 && numCep <= 6649999) return "jandira";
  if (numCep >= 6700000 && numCep <= 6729999) return "cotia";
  if (numCep >= 6730000 && numCep <= 6749999) return "vargem_grande";
  if (numCep >= 6750000 && numCep <= 6799999) return "taboao";
  if (numCep >= 6800000 && numCep <= 6849999) return "embu";
  if (numCep >= 6850000 && numCep <= 6899999) return "itapecirica";
  if (numCep >= 6900000 && numCep <= 6999999) return "embu_guacu";
  if (numCep >= 7000000 && numCep <= 7399999) return "guarulhos";
  if (numCep >= 7400000 && numCep <= 7499999) return "aruja";
  if (numCep >= 7500000 && numCep <= 7599999) return "santa_isabel";
  if (numCep >= 7600000 && numCep <= 7699999) return "mairipora";
  if (numCep >= 7700000 && numCep <= 7749999) return "caieiras";
  if (numCep >= 7750000 && numCep <= 7759999) return "cajamar";
  if (numCep >= 7760000 && numCep <= 7769999) return "jordanesia";
  if (numCep >= 7770000 && numCep <= 7799999) return "polvilho";
  if (numCep >= 7800000 && numCep <= 7870999) return "franco_rocha";
  if (numCep >= 7900000 && numCep <= 7999999) return "francisco_morato";
  if (numCep >= 8500000 && numCep <= 8549999) return "ferraz";
  if (numCep >= 8550000 && numCep <= 8569999) return "poa";
  if (numCep >= 8570000 && numCep <= 8599999) return "itaquaquecetuba";
  if (numCep >= 8600000 && numCep <= 8699999) return "suzano";
  if (numCep >= 8700000 && numCep <= 8899999) return "mogi";
  if (numCep >= 8900000 && numCep <= 8999999) return "guararema";
  if (numCep >= 9000000 && numCep <= 9299999) return "santo_andre";
  if (numCep >= 9300000 && numCep <= 9399999) return "maua";
  if (numCep >= 9400000 && numCep <= 9449999) return "ribeirao_pires";
  if (numCep >= 9450000 && numCep <= 9499999) return "rio_grande_serra";
  if (numCep >= 9500000 && numCep <= 9599999) return "sao_caetano";
  if (numCep >= 9600000 && numCep <= 9899999) return "sao_bernardo";
  if (numCep >= 9900000 && numCep <= 9999999) return "diadema";
  
  return "centro";
};

// Lista de ferramentas do sistema para calcular Gestão 10
const SYSTEM_TOOLS = [
  'products',      // Tem produtos cadastrados
  'categories',    // Tem categorias cadastradas  
  'tables',        // Tem mesas configuradas
  'delivery',      // Tem delivery ativo
  'cash_register', // Usa caixa/PDV
  'stock',         // Usa controle de estoque
  'expenses',      // Registra despesas
  'payment_methods', // Configurou formas de pagamento
  'photos',        // Tem fotos do estabelecimento
  'coupons',       // Usa cupons de desconto
];

interface CommerceRankingProps {
  currentCommerceId?: string;
}

const CommerceRanking = ({ currentCommerceId }: CommerceRankingProps) => {
  const [commerces, setCommerces] = useState<CommerceRankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState("centro");
  const [activeDivision, setActiveDivision] = useState<"basic" | "startup" | "business">("business");
  const [activeCategory, setActiveCategory] = useState<RankingCategory>("rating");

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    setLoading(true);

    const { data: commercesData, error: commercesError } = await supabase
      .rpc('get_ranking_commerces');

    if (commercesError) {
      console.error('Error fetching commerces:', commercesError);
      setLoading(false);
      return;
    }

    const planIds = [...new Set((commercesData || []).map(c => c.plan_id).filter(Boolean))];
    const planTypesMap = new Map<string, string>();
    
    if (planIds.length > 0) {
      const { data: plansData } = await supabase
        .from('plans')
        .select('id, type')
        .in('id', planIds);
      
      plansData?.forEach(p => planTypesMap.set(p.id, p.type));
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('commerce_id, rating');

    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('commerce_id');

    // Buscar dados de delivery (pedidos com order_type = 'delivery' e status = 'delivered')
    const { data: deliveryData } = await supabase
      .from('orders')
      .select('commerce_id')
      .eq('order_type', 'delivery')
      .eq('status', 'delivered');

    // Buscar dados de uso de ferramentas para cada comércio
    const commerceIds = (commercesData || []).map(c => c.id);
    
    const [
      { data: productsData },
      { data: categoriesData },
      { data: tablesData },
      { data: cashData },
      { data: expensesData },
      { data: paymentMethodsData },
      { data: photosData },
      { data: couponsData }
    ] = await Promise.all([
      supabase.from('products').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('categories').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('tables').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('cash_registers').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('expenses').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('payment_methods').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('commerce_photos').select('commerce_id').in('commerce_id', commerceIds),
      supabase.from('commerce_coupons').select('commerce_id').in('commerce_id', commerceIds),
    ]);

    const reviewsByCommerce = new Map<string, number[]>();
    reviewsData?.forEach(review => {
      const current = reviewsByCommerce.get(review.commerce_id) || [];
      current.push(review.rating);
      reviewsByCommerce.set(review.commerce_id, current);
    });

    const favoritesByCommerce = new Map<string, number>();
    favoritesData?.forEach(fav => {
      favoritesByCommerce.set(fav.commerce_id, (favoritesByCommerce.get(fav.commerce_id) || 0) + 1);
    });

    // Contar entregas por comércio
    const deliveryByCommerce = new Map<string, number>();
    deliveryData?.forEach(order => {
      deliveryByCommerce.set(order.commerce_id, (deliveryByCommerce.get(order.commerce_id) || 0) + 1);
    });

    // Calcular score de ferramentas por comércio
    const toolsScoreByCommerce = new Map<string, number>();
    // Verificar delivery ativo - buscar do banco
    const { data: commerceDeliveryData } = await supabase
      .from('commerces')
      .select('id, delivery_enabled')
      .in('id', commerceIds);

    const deliveryEnabledMap = new Map<string, boolean>();
    commerceDeliveryData?.forEach(c => deliveryEnabledMap.set(c.id, c.delivery_enabled || false));

    commerceIds.forEach(id => {
      let score = 0;
      if (productsData?.some(p => p.commerce_id === id)) score++;
      if (categoriesData?.some(c => c.commerce_id === id)) score++;
      if (tablesData?.some(t => t.commerce_id === id)) score++;
      if (cashData?.some(c => c.commerce_id === id)) score++;
      if (expensesData?.some(e => e.commerce_id === id)) score++;
      if (paymentMethodsData?.some(p => p.commerce_id === id)) score++;
      if (photosData?.some(p => p.commerce_id === id)) score++;
      if (couponsData?.some(c => c.commerce_id === id)) score++;
      
      // Verificar se tem delivery ativo
      if (deliveryEnabledMap.get(id)) score++;
      
      // Considerar estoque como ferramenta separada não necessário - já está no score base
      
      toolsScoreByCommerce.set(id, score);
    });

    const rankingData: CommerceRankingData[] = (commercesData || []).map(commerce => {
      const reviews = reviewsByCommerce.get(commerce.id) || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((a, b) => a + b, 0) / reviews.length 
        : 0;
      
      return {
        id: commerce.id,
        fantasy_name: commerce.fantasy_name || '',
        logo_url: commerce.logo_url,
        city: commerce.city,
        neighborhood: commerce.neighborhood,
        cep: commerce.cep,
        plan_type: commerce.plan_id ? (planTypesMap.get(commerce.plan_id) || 'basic') : 'basic',
        avg_rating: avgRating,
        review_count: reviews.length,
        favorites_count: favoritesByCommerce.get(commerce.id) || 0,
        zone: getZoneFromCep(commerce.cep),
        delivery_count: deliveryByCommerce.get(commerce.id) || 0,
        tools_usage_score: toolsScoreByCommerce.get(commerce.id) || 0,
      };
    });

    setCommerces(rankingData);
    setLoading(false);
  };

  // Ordenar comércios baseado na categoria ativa
  const getSortedCommerces = (data: CommerceRankingData[]) => {
    const sorted = [...data];
    
    switch (activeCategory) {
      case "delivery":
        sorted.sort((a, b) => {
          if (b.delivery_count !== a.delivery_count) return b.delivery_count - a.delivery_count;
          return b.avg_rating - a.avg_rating;
        });
        break;
      case "gestao":
        sorted.sort((a, b) => {
          if (b.tools_usage_score !== a.tools_usage_score) return b.tools_usage_score - a.tools_usage_score;
          return b.avg_rating - a.avg_rating;
        });
        break;
      default: // rating
        sorted.sort((a, b) => {
          if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
          if (b.favorites_count !== a.favorites_count) return b.favorites_count - a.favorites_count;
          return b.review_count - a.review_count;
        });
    }
    
    return sorted;
  };

  // Filtrar por zona e divisão (apenas para categorias de divisão)
  const getFilteredCommerces = () => {
    let filtered = commerces.filter(c => c.zone === activeZone);
    
    // Categorias especiais não filtram por divisão
    if (activeCategory === "rating") {
      filtered = filtered.filter(c => c.plan_type === activeDivision);
    }
    
    return getSortedCommerces(filtered);
  };

  const filteredCommerces = getFilteredCommerces();

  const getDivisionInfo = (type: string) => DIVISIONS[type as keyof typeof DIVISIONS] || DIVISIONS.basic;

  // Calcular posições do comércio atual em todas as categorias
  const getCurrentCommercePositions = () => {
    if (!currentCommerceId) return null;
    
    const currentCommerce = commerces.find(c => c.id === currentCommerceId);
    if (!currentCommerce) return null;

    const zoneCommerces = commerces.filter(c => c.zone === currentCommerce.zone);
    const divisionCommerces = zoneCommerces.filter(c => c.plan_type === currentCommerce.plan_type);

    // Posição no ranking de avaliação (por divisão)
    const ratingRanked = [...divisionCommerces].sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      if (b.favorites_count !== a.favorites_count) return b.favorites_count - a.favorites_count;
      return b.review_count - a.review_count;
    });
    const ratingPosition = ratingRanked.findIndex(c => c.id === currentCommerceId) + 1;

    // Posição no ranking de delivery (toda a zona, sem filtro de divisão)
    const deliveryRanked = [...zoneCommerces].sort((a, b) => b.delivery_count - a.delivery_count);
    const deliveryPosition = deliveryRanked.findIndex(c => c.id === currentCommerceId) + 1;

    // Posição no ranking de gestão (toda a zona, sem filtro de divisão)
    const gestaoRanked = [...zoneCommerces].sort((a, b) => b.tools_usage_score - a.tools_usage_score);
    const gestaoPosition = gestaoRanked.findIndex(c => c.id === currentCommerceId) + 1;

    return {
      commerce: currentCommerce,
      rating: { position: ratingPosition, total: divisionCommerces.length },
      delivery: { position: deliveryPosition, total: zoneCommerces.length },
      gestao: { position: gestaoPosition, total: zoneCommerces.length },
      divisionInfo: getDivisionInfo(currentCommerce.plan_type),
      zoneName: ALL_ZONES.find(z => z.id === currentCommerce.zone)?.name || currentCommerce.zone,
    };
  };

  const currentPositions = getCurrentCommercePositions();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isSpecialCategory = activeCategory === "delivery" || activeCategory === "gestao";
  const categoryInfo = isSpecialCategory 
    ? SPECIAL_CATEGORIES[activeCategory as keyof typeof SPECIAL_CATEGORIES]
    : getDivisionInfo(activeDivision);
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Ranking Adegas & Tabacarias
          </h2>
          <p className="text-muted-foreground mt-1">
            Veja a classificação dos melhores estabelecimentos
          </p>
        </div>

        {/* Card de Posição Compacto */}
        {currentPositions && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <Card className="w-full lg:w-auto border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Suas Posições</p>
                <div className="space-y-1.5 text-sm">
                  {/* Linha: Divisão */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <currentPositions.divisionInfo.icon className="w-3.5 h-3.5" />
                      Divisão {currentPositions.divisionInfo.name}
                    </span>
                    <Badge className={`text-xs ${currentPositions.divisionInfo.badge} text-white`}>
                      {currentPositions.rating.position}º de {currentPositions.rating.total}
                    </Badge>
                  </div>
                  
                  {/* Linha: Top Delivery */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5" />
                      Top Delivery
                    </span>
                    <Badge className="text-xs bg-blue-600 text-white">
                      {currentPositions.delivery.position}º de {currentPositions.delivery.total}
                    </Badge>
                  </div>
                  
                  {/* Linha: Gestão 10 */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5" />
                      Gestão 10
                    </span>
                    <Badge className="text-xs bg-emerald-600 text-white">
                      {currentPositions.gestao.position}º de {currentPositions.gestao.total}
                    </Badge>
                  </div>

                  {/* Separador */}
                  <div className="border-t border-border/50 pt-1.5 mt-1.5">
                    {/* Linha: Região */}
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        Região
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {currentPositions.zoneName}
                      </Badge>
                    </div>
                    
                    {/* Linha: Avaliação e Favoritos */}
                    <div className="flex items-center justify-between gap-4 mt-1.5">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">
                            {currentPositions.commerce.avg_rating > 0 
                              ? currentPositions.commerce.avg_rating.toFixed(1) 
                              : '-'}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({currentPositions.commerce.review_count})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                        <span className="font-medium">{currentPositions.commerce.favorites_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Category Selector - Divisões + Categorias Especiais */}
      <div className="flex flex-wrap gap-3">
        {/* Divisões por Plano */}
        {Object.entries(DIVISIONS).map(([type, div]) => {
          const Icon = div.icon;
          const isActive = activeCategory === "rating" && activeDivision === type;
          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              className={`gap-2 ${isActive ? `bg-gradient-to-r ${div.color} text-white border-0` : ''}`}
              onClick={() => {
                setActiveCategory("rating");
                setActiveDivision(type as "basic" | "startup" | "business");
              }}
            >
              <Icon className="w-4 h-4" />
              {div.name}
            </Button>
          );
        })}
        
        {/* Categorias Especiais */}
        {Object.entries(SPECIAL_CATEGORIES).map(([type, cat]) => {
          const Icon = cat.icon;
          const isActive = activeCategory === type;
          return (
            <Button
              key={type}
              variant={isActive ? "default" : "outline"}
              className={`gap-2 ${isActive ? `bg-gradient-to-r ${cat.color} text-white border-0` : ''}`}
              onClick={() => setActiveCategory(type as RankingCategory)}
            >
              <Icon className="w-4 h-4" />
              {cat.name}
            </Button>
          );
        })}
      </div>

      {/* Zone Selector */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Região:</span>
        <Select value={activeZone} onValueChange={setActiveZone}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione uma região">
              {ALL_ZONES.find(z => z.id === activeZone)?.name || "Selecione uma região"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-[400px]">
            {ZONE_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                  {group.label}
                </div>
                {group.zones.map((zone) => (
                  <SelectItem key={zone.id} value={zone.id}>
                    {zone.name}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ranking Content */}
      <div className="mt-6">
        <Card className={`mb-6 bg-gradient-to-r ${categoryInfo.color} text-white border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <CategoryIcon className="w-10 h-10" />
              <div>
                <h3 className="text-lg font-bold">
                  {isSpecialCategory 
                    ? `${categoryInfo.name} - ${ALL_ZONES.find(z => z.id === activeZone)?.name || activeZone}`
                    : `Ranking ${ALL_ZONES.find(z => z.id === activeZone)?.name || activeZone}`
                  }
                </h3>
                <p className="text-white/80 text-sm">
                  {isSpecialCategory 
                    ? (categoryInfo as typeof SPECIAL_CATEGORIES.delivery).description
                    : `Divisão ${categoryInfo.name}`
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredCommerces.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">
                Nenhum estabelecimento encontrado nesta categoria e região
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCommerces.map((commerce, index) => {
              const isTop3 = index < 3;
              const positionStyles = {
                0: { 
                  bg: 'bg-gradient-to-r from-yellow-400/20 via-yellow-500/10 to-yellow-400/20 border-yellow-500/50',
                  badge: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white shadow-lg shadow-yellow-500/30',
                  icon: Crown
                },
                1: { 
                  bg: 'bg-gradient-to-r from-gray-300/20 via-gray-400/10 to-gray-300/20 border-gray-400/50',
                  badge: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white shadow-lg shadow-gray-500/30',
                  icon: Trophy
                },
                2: { 
                  bg: 'bg-gradient-to-r from-amber-600/20 via-amber-700/10 to-amber-600/20 border-amber-600/50',
                  badge: 'bg-gradient-to-r from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/30',
                  icon: Medal
                },
              };
              
              const style = positionStyles[index as keyof typeof positionStyles];
              const PositionIcon = style?.icon;

              // Métrica principal baseada na categoria
              const getMainMetric = () => {
                switch (activeCategory) {
                  case "delivery":
                    return (
                      <div className="flex items-center gap-1">
                        <Truck className="w-4 h-4 text-blue-500" />
                        <span className="font-bold">{commerce.delivery_count}</span>
                        <span className="text-xs text-muted-foreground">entregas</span>
                      </div>
                    );
                  case "gestao":
                    return (
                      <div className="flex items-center gap-1">
                        <Settings2 className="w-4 h-4 text-emerald-500" />
                        <span className="font-bold">{commerce.tools_usage_score}/10</span>
                        <span className="text-xs text-muted-foreground">ferramentas</span>
                      </div>
                    );
                  default:
                    return (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-bold">
                          {commerce.avg_rating > 0 ? commerce.avg_rating.toFixed(1) : '-'}
                        </span>
                        <span className="text-xs text-muted-foreground">({commerce.review_count})</span>
                      </div>
                    );
                }
              };

              return (
                <motion.div
                  key={commerce.id}
                  initial={{ opacity: 0, y: 20, scale: isTop3 ? 0.95 : 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.05, type: isTop3 ? "spring" : "tween" }}
                >
                  <Card className={`transition-all duration-300 ${
                    commerce.id === currentCommerceId 
                      ? 'border-primary border-2 bg-primary/5' 
                      : isTop3 
                        ? `border-2 ${style?.bg}` 
                        : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <motion.div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            isTop3 ? style?.badge : 'bg-muted text-muted-foreground'
                          }`}
                          animate={isTop3 ? { scale: [1, 1.05, 1] } : {}}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        >
                          {isTop3 && PositionIcon ? (
                            <PositionIcon className="w-5 h-5" />
                          ) : (
                            index + 1
                          )}
                        </motion.div>

                        <div className={`w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ${
                          isTop3 ? 'ring-2 ring-offset-2 ring-offset-background' : 'bg-muted'
                        } ${index === 0 ? 'ring-yellow-500' : index === 1 ? 'ring-gray-400' : index === 2 ? 'ring-amber-600' : ''}`}>
                          {commerce.logo_url ? (
                            <img src={commerce.logo_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Store className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate flex items-center gap-2 ${isTop3 ? 'text-base' : ''}`}>
                            {commerce.fantasy_name}
                            {commerce.id === currentCommerceId && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                            {index === 0 && (
                              <Badge className="bg-yellow-500 text-white text-xs">🏆 Líder</Badge>
                            )}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">
                              {commerce.neighborhood || commerce.city || 'Local não informado'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          {getMainMetric()}
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Heart className={`w-4 h-4 ${commerce.favorites_count > 0 ? 'fill-red-400 text-red-400' : ''}`} />
                            <span className="text-sm">{commerce.favorites_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rules Explanation */}
      <Card className="mt-8 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            Como funciona o Ranking
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <p className="font-semibold text-foreground mb-2">Categorias de Premiação:</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className="bg-amber-700 text-white">Bronze - Plano Básico</Badge>
              <Badge className="bg-gray-500 text-white">Prata - Plano Startup</Badge>
              <Badge className="bg-yellow-500 text-black">Ouro - Plano Business</Badge>
              <Badge className="bg-blue-600 text-white">Top Delivery</Badge>
              <Badge className="bg-emerald-600 text-white">Gestão 10</Badge>
            </div>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Critérios por Categoria:</p>
            <ul className="space-y-2 ml-2">
              <li><strong>Bronze/Prata/Ouro:</strong> Ordenados por média de avaliações, favoritos e número de reviews. Competem apenas entre o mesmo plano.</li>
              <li><strong>Top Delivery:</strong> Ordenados pela quantidade de entregas realizadas. Todos os planos competem juntos por região.</li>
              <li><strong>Gestão 10:</strong> Ordenados pelo uso das ferramentas do sistema (produtos, categorias, mesas, delivery, caixa, estoque, despesas, pagamentos, fotos, cupons). Todos os planos competem juntos por região.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Regiões:</p>
            <p>Os comércios são organizados por região baseado no CEP cadastrado. Isso permite que clientes encontrem os melhores estabelecimentos perto deles.</p>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <p className="font-semibold text-foreground mb-1">💡 Dica para melhorar sua posição:</p>
            <p>Incentive seus clientes a avaliar e favoritar. Para subir no Top Delivery, invista em entregas. Para o Gestão 10, utilize todas as ferramentas disponíveis!</p>
          </div>

          <div className="bg-destructive/10 p-3 rounded-lg border border-destructive/20 mt-4">
            <p className="font-semibold text-destructive mb-1 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Aviso Importante - Fraudes
            </p>
            <p className="text-sm text-muted-foreground">
              A criação de contas falsas, avaliações fraudulentas ou qualquer tentativa de 
              manipulação do ranking resultará no <strong className="text-destructive">banimento imediato</strong> do 
              estabelecimento da competição, sem direito a recurso. Todas as atividades 
              são monitoradas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceRanking;
