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
  Info
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
}

const DIVISIONS = {
  basic: { name: "Bronze", color: "from-amber-700 to-amber-900", badge: "bg-amber-700", icon: Medal },
  startup: { name: "Prata", color: "from-gray-400 to-gray-600", badge: "bg-gray-500", icon: Trophy },
  business: { name: "Ouro", color: "from-yellow-400 to-yellow-600", badge: "bg-yellow-500", icon: Crown },
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

// Flat list for lookup
const ALL_ZONES = ZONE_GROUPS.flatMap(g => g.zones);

const getZoneFromCep = (cep: string | null): string => {
  if (!cep) return "centro";
  
  const numCep = parseInt(cep.replace(/\D/g, ''));
  
  // São Paulo Capital
  if (numCep >= 1000000 && numCep <= 1599999) return "centro";
  if (numCep >= 2000000 && numCep <= 2999999) return "norte";
  if (numCep >= 3000000 && numCep <= 3999999) return "leste";
  if (numCep >= 8000000 && numCep <= 8499999) return "leste";
  if (numCep >= 4000000 && numCep <= 4999999) return "sul";
  if (numCep >= 5000000 && numCep <= 5899999) return "oeste";
  
  // Grande São Paulo - Oeste
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
  
  // Grande São Paulo - Norte
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
  
  // Grande São Paulo - Leste
  if (numCep >= 8500000 && numCep <= 8549999) return "ferraz";
  if (numCep >= 8550000 && numCep <= 8569999) return "poa";
  if (numCep >= 8570000 && numCep <= 8599999) return "itaquaquecetuba";
  if (numCep >= 8600000 && numCep <= 8699999) return "suzano";
  if (numCep >= 8700000 && numCep <= 8899999) return "mogi";
  if (numCep >= 8900000 && numCep <= 8999999) return "guararema";
  
  // ABC Paulista
  if (numCep >= 9000000 && numCep <= 9299999) return "santo_andre";
  if (numCep >= 9300000 && numCep <= 9399999) return "maua";
  if (numCep >= 9400000 && numCep <= 9449999) return "ribeirao_pires";
  if (numCep >= 9450000 && numCep <= 9499999) return "rio_grande_serra";
  if (numCep >= 9500000 && numCep <= 9599999) return "sao_caetano";
  if (numCep >= 9600000 && numCep <= 9899999) return "sao_bernardo";
  if (numCep >= 9900000 && numCep <= 9999999) return "diadema";
  
  return "centro";
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

    // Fetch ALL approved commerces (not just open ones) for ranking
    const { data: commercesData, error: commercesError } = await supabase
      .from('commerces')
      .select('id, fantasy_name, logo_url, city, neighborhood, cep, plan_id, plans(type)')
      .eq('status', 'approved');

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

    // Sort by: 1st avg_rating (desc), 2nd favorites_count (desc), 3rd review_count (desc)
    rankingData.sort((a, b) => {
      if (b.avg_rating !== a.avg_rating) return b.avg_rating - a.avg_rating;
      if (b.favorites_count !== a.favorites_count) return b.favorites_count - a.favorites_count;
      return b.review_count - a.review_count;
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

      {/* Zone Selector Dropdown */}
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
        <Card className={`mb-6 bg-gradient-to-r ${divisionInfo.color} text-white border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <DivisionIcon className="w-10 h-10" />
              <div>
                <h3 className="text-lg font-bold">
                  Ranking {ALL_ZONES.find(z => z.id === activeZone)?.name || activeZone}
                </h3>
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
            <p className="font-semibold text-foreground mb-2">Divisões por Plano:</p>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge className="bg-amber-700 text-white">Bronze - Plano Básico</Badge>
              <Badge className="bg-gray-500 text-white">Prata - Plano Startup</Badge>
              <Badge className="bg-yellow-500 text-black">Ouro - Plano Business</Badge>
            </div>
            <p>Os estabelecimentos competem apenas com outros do mesmo plano, garantindo uma competição justa entre negócios de porte similar.</p>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Critérios de Classificação:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li><strong>Média de Avaliações</strong> - Principal critério. Quanto maior a nota média (1-5 estrelas), melhor a posição.</li>
              <li><strong>Quantidade de Favoritos</strong> - Em caso de empate na nota, quem tem mais favoritos fica à frente.</li>
              <li><strong>Número de Avaliações</strong> - Como desempate final, mais avaliações indicam maior engajamento.</li>
            </ol>
          </div>

          <div>
            <p className="font-semibold text-foreground mb-2">Regiões:</p>
            <p>Os comércios são organizados por região baseado no CEP cadastrado. Isso permite que clientes encontrem os melhores estabelecimentos perto deles.</p>
          </div>

          <div className="bg-primary/10 p-3 rounded-lg border border-primary/20">
            <p className="font-semibold text-foreground mb-1">💡 Dica para melhorar sua posição:</p>
            <p>Incentive seus clientes a avaliar e favoritar seu estabelecimento. Um bom atendimento e produtos de qualidade naturalmente geram melhores avaliações!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CommerceRanking;
