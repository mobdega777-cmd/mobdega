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
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
}

const DIVISIONS = {
  basic: { name: "Bronze", color: "from-amber-700 to-amber-900", badge: "bg-amber-700", icon: Medal },
  startup: { name: "Prata", color: "from-gray-400 to-gray-600", badge: "bg-gray-500", icon: Trophy },
  business: { name: "Ouro", color: "from-yellow-400 to-yellow-600", badge: "bg-yellow-500", icon: Crown },
};

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

const getZoneFromCep = (cep: string | null): string => {
  if (!cep) return "outros";
  
  const numCep = parseInt(cep.replace(/\D/g, ''));
  
  if (numCep >= 1000000 && numCep <= 1599999) return "centro";
  if (numCep >= 2000000 && numCep <= 2999999) return "norte";
  if ((numCep >= 3000000 && numCep <= 3999999) || (numCep >= 8000000 && numCep <= 8499999)) return "leste";
  if (numCep >= 4000000 && numCep <= 4999999) return "sul";
  if (numCep >= 5000000 && numCep <= 5899999) return "oeste";
  if (numCep >= 9000000 && numCep <= 9999999) return "abc";
  if (numCep >= 7000000 && numCep <= 7199999) return "guarulhos";
  if (numCep >= 8500000 && numCep <= 8799999) return "alto_tiete";
  if (numCep >= 6000000 && numCep <= 6999999) return "osasco";
  
  return "outros";
};

interface CommerceRankingProps {
  currentCommerceId?: string;
}

const CommerceRanking = ({ currentCommerceId }: CommerceRankingProps) => {
  const [commerces, setCommerces] = useState<CommerceRankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeZone, setActiveZone] = useState("centro");
  const [activeDivision, setActiveDivision] = useState<"basic" | "startup" | "business">("business");

  useEffect(() => {
    fetchRankingData();
  }, []);

  const fetchRankingData = async () => {
    setLoading(true);

    const { data: commercesData, error: commercesError } = await supabase
      .from('commerces')
      .select('id, fantasy_name, logo_url, city, neighborhood, cep, plan_id, plans(type)')
      .eq('status', 'approved')
      .eq('is_open', true);

    if (commercesError) {
      console.error('Error fetching commerces:', commercesError);
      setLoading(false);
      return;
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('commerce_id, rating');

    const { data: favoritesData } = await supabase
      .from('favorites')
      .select('commerce_id');

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

    const rankingData: CommerceRankingData[] = (commercesData || []).map(commerce => {
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
        plan_type: (commerce.plans as any)?.type || 'basic',
        avg_rating: avgRating,
        review_count: reviews.length,
        favorites_count: favoritesByCommerce.get(commerce.id) || 0,
        zone: getZoneFromCep(commerce.cep),
      };
    });

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const divisionInfo = getDivisionInfo(activeDivision);
  const DivisionIcon = divisionInfo.icon;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Ranking Adegas & Tabacarias
        </h2>
        <p className="text-muted-foreground mt-1">
          Veja a classificação dos melhores estabelecimentos
        </p>
      </div>

      {/* Division Selector */}
      <div className="flex flex-wrap gap-3">
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
              {div.name}
            </Button>
          );
        })}
      </div>

      {/* Zone Tabs */}
      <Tabs value={activeZone} onValueChange={setActiveZone}>
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
            <Card className={`mb-6 bg-gradient-to-r ${divisionInfo.color} text-white border-0`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <DivisionIcon className="w-10 h-10" />
                  <div>
                    <h3 className="text-lg font-bold">Ranking {zone.name}</h3>
                    <p className="text-white/80 text-sm">Divisão {divisionInfo.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {filteredCommerces.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">
                    Nenhum estabelecimento nesta divisão e região
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
                    <Card className={`transition-colors ${commerce.id === currentCommerceId ? 'border-primary border-2 bg-primary/5' : 'hover:border-primary/50'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>

                          <div className="w-12 h-12 rounded-xl bg-muted overflow-hidden flex-shrink-0">
                            {commerce.logo_url ? (
                              <img src={commerce.logo_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Store className="w-5 h-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold truncate flex items-center gap-2">
                              {commerce.fantasy_name}
                              {commerce.id === currentCommerceId && (
                                <Badge variant="secondary" className="text-xs">Você</Badge>
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
    </div>
  );
};

export default CommerceRanking;
