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
  ArrowLeft,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "@/lib/formatCurrency";

interface CommerceRanking {
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
}

// Divisões baseadas nos tipos de plano
const DIVISIONS = {
  basic: { name: "Bronze", color: "from-amber-700 to-amber-900", badge: "bg-amber-700", icon: Medal },
  startup: { name: "Prata", color: "from-gray-400 to-gray-600", badge: "bg-gray-500", icon: Trophy },
  business: { name: "Ouro", color: "from-yellow-400 to-yellow-600", badge: "bg-yellow-500", icon: Crown },
};

// Zonas de SP e Região Metropolitana
const ZONES = [
  { id: "centro", name: "Centro" },
  { id: "norte", name: "Zona Norte" },
  { id: "sul", name: "Zona Sul" },
  { id: "leste", name: "Zona Leste" },
  { id: "oeste", name: "Zona Oeste" },
  { id: "abc", name: "ABC Paulista" },
  { id: "alto_tiete", name: "Alto Tietê" },
  { id: "guarulhos", name: "Guarulhos" },
  { id: "osasco", name: "Osasco e Região" },
  { id: "outros", name: "Outras Regiões" },
];

// Função para determinar a zona baseado no CEP
const getZoneFromCep = (cep: string | null): string => {
  if (!cep) return "outros";
  
  const numCep = parseInt(cep.replace(/\D/g, ''));
  
  // Centro de SP
  if (numCep >= 1000000 && numCep <= 1599999) return "centro";
  
  // Zona Norte
  if (numCep >= 2000000 && numCep <= 2999999) return "norte";
  
  // Zona Leste
  if ((numCep >= 3000000 && numCep <= 3999999) || (numCep >= 8000000 && numCep <= 8499999)) return "leste";
  
  // Zona Sul
  if (numCep >= 4000000 && numCep <= 4999999) return "sul";
  
  // Zona Oeste
  if (numCep >= 5000000 && numCep <= 5899999) return "oeste";
  
  // ABC Paulista (Santo André, São Bernardo, São Caetano, Diadema, Mauá, Ribeirão Pires, Rio Grande da Serra)
  if (numCep >= 9000000 && numCep <= 9999999) return "abc";
  
  // Guarulhos
  if (numCep >= 7000000 && numCep <= 7199999) return "guarulhos";
  
  // Alto Tietê (Mogi das Cruzes, Suzano, Poá, Ferraz, Itaquaquecetuba, etc.)
  if (numCep >= 8500000 && numCep <= 8799999) return "alto_tiete";
  
  // Osasco e Região (Osasco, Barueri, Carapicuíba, etc.)
  if (numCep >= 6000000 && numCep <= 6999999) return "osasco";
  
  return "outros";
};

const Ranking = () => {
  const navigate = useNavigate();
  const [commerces, setCommerces] = useState<CommerceRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState("centro");
  const [activeDivision, setActiveDivision] = useState<"basic" | "startup" | "business">("business");

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    setLoading(true);

    // Fetch commerces using public view for security (excludes sensitive owner data)
    // Note: plan info not available in view, will default to 'basic' for public ranking
    const { data: commercesData, error: commercesError } = await supabase
      .from('commerces_public')
      .select('id, fantasy_name, logo_url, city, neighborhood, cep')
      .eq('is_open', true);

    if (commercesError) {
      console.error('Error fetching commerces:', commercesError);
      setLoading(false);
      return;
    }

    // Fetch reviews for ratings
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('commerce_id, rating');

    // Fetch favorites count
    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('commerce_id');

    // Calculate ratings and favorites for each commerce
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

    // Build ranking data (plan_type defaults to 'basic' for public view)
    const rankingData: CommerceRanking[] = (commercesData || []).map(commerce => {
      const reviews = reviewsByCommerce.get(commerce.id) || [];
      const avgRating = reviews.length > 0 
        ? reviews.reduce((a, b) => a + b, 0) / reviews.length 
        : 0;
      
      return {
        id: commerce.id,
        fantasy_name: commerce.fantasy_name,
        logo_url: commerce.logo_url,
        city: commerce.city,
        neighborhood: commerce.neighborhood,
        cep: commerce.cep,
        plan_type: 'basic', // Plan info not available in public view
        avg_rating: avgRating,
        review_count: reviews.length,
        favorites_count: favoritesByCommerce.get(commerce.id) || 0,
        zone: getZoneFromCep(commerce.cep),
      };
    });

    // Sort by rating (primary) and favorites (secondary)
    rankingData.sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      return b.favorites_count - a.favorites_count;
    });

    setCommerces(rankingData);
    setLoading(false);
  };

  const filteredCommerces = commerces.filter(
    c => c.zone === activeZone && c.plan_type === activeDivision
  );

  const getDivisionInfo = (type: string) => DIVISIONS[type as keyof typeof DIVISIONS] || DIVISIONS.basic;
  const getZoneName = (zoneId: string) => ZONES.find(z => z.id === zoneId)?.name || "Região";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const divisionInfo = getDivisionInfo(activeDivision);
  const DivisionIcon = divisionInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Ranking Adegas & Tabacarias</h1>
              <p className="text-sm text-muted-foreground">Os melhores estabelecimentos por região</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Division Selector */}
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(DIVISIONS).map(([type, div]) => {
            const Icon = div.icon;
            return (
              <Button
                key={type}
                variant={activeDivision === type ? "default" : "outline"}
                className={`gap-2 ${activeDivision === type ? `bg-gradient-to-r ${div.color} text-white border-0` : ''}`}
                onClick={() => setActiveDivision(type as "basic" | "startup" | "business")}
              >
                <Icon className="w-4 h-4" />
                Divisão {div.name}
              </Button>
            );
          })}
        </div>

        {/* Zone Tabs */}
        <Tabs value={activeZone} onValueChange={setActiveZone} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent">
            {ZONES.map((zone) => (
              <TabsTrigger
                key={zone.id}
                value={zone.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {zone.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {ZONES.map((zone) => (
            <TabsContent key={zone.id} value={zone.id} className="mt-6">
              {/* Title Card */}
              <Card className={`mb-6 bg-gradient-to-r ${divisionInfo.color} text-white border-0`}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <DivisionIcon className="w-12 h-12" />
                    <div>
                      <h2 className="text-2xl font-bold">
                        Ranking Adega Tabacaria {zone.name}
                      </h2>
                      <p className="text-white/80">
                        Divisão {divisionInfo.name} • Melhores avaliados
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ranking List */}
              {filteredCommerces.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      Nenhum estabelecimento encontrado nesta divisão e região
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {filteredCommerces.map((commerce, index) => (
                    <motion.div
                      key={commerce.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {/* Position */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              index === 0 ? 'bg-yellow-500 text-white' :
                              index === 1 ? 'bg-gray-400 text-white' :
                              index === 2 ? 'bg-amber-700 text-white' :
                              'bg-muted text-muted-foreground'
                            }`}>
                              {index + 1}
                            </div>

                            {/* Logo */}
                            <div className="w-14 h-14 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                              {commerce.logo_url ? (
                                <img src={commerce.logo_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Store className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold truncate">{commerce.fantasy_name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">
                                  {commerce.neighborhood || commerce.city || 'Local não informado'}
                                </span>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-bold">{commerce.avg_rating.toFixed(1)}</span>
                                <span className="text-xs text-muted-foreground">({commerce.review_count})</span>
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Heart className="w-4 h-4" />
                                <span className="text-sm">{commerce.favorites_count}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Como funciona o Ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              <strong className="text-foreground">Divisões:</strong> Os estabelecimentos são separados por divisões baseadas em seus planos:
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-amber-700">Bronze - Plano Básico</Badge>
              <Badge className="bg-gray-500">Prata - Plano Startup</Badge>
              <Badge className="bg-yellow-500 text-black">Ouro - Plano Business</Badge>
            </div>
            <p>
              <strong className="text-foreground">Critérios:</strong> A posição é determinada pela média de avaliações (critério principal) e quantidade de favoritos (critério secundário).
            </p>
            <p>
              <strong className="text-foreground">Zonas:</strong> As regiões são baseadas no CEP do estabelecimento, incluindo São Paulo capital e região metropolitana.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;
