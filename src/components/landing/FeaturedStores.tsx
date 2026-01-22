import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Clock, Search, Loader2, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchAddressByCep, formatCep, getCepProximityScore, isCepInRange } from "@/lib/viaCepService";

interface DeliveryZone {
  id: string;
  commerce_id: string;
  cep_start: string;
  cep_end: string;
  is_active: boolean;
}

interface OpeningHours {
  [key: string]: {
    open: string;
    close: string;
    enabled: boolean;
  };
}

interface FeaturedCustomization {
  title: string | null;
  subtitle: string | null;
  description: string | null;
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
    // Closing time crosses midnight
    closeTime += 24 * 60; // Add 24 hours
    const adjustedCurrentTime = currentTime < openTime ? currentTime + 24 * 60 : currentTime;
    return adjustedCurrentTime >= openTime && adjustedCurrentTime <= closeTime;
  }
  
  return currentTime >= openTime && currentTime <= closeTime;
};

const getTodayHours = (openingHours: OpeningHours | null): string => {
  if (!openingHours) return '';
  const dayKey = getDayKey(new Date());
  const todayHours = openingHours[dayKey];
  if (!todayHours || !todayHours.enabled) return 'Fechado hoje';
  return `${todayHours.open} - ${todayHours.close}`;
};


interface Commerce {
  id: string;
  fantasy_name: string;
  city: string | null;
  cep: string | null;
  logo_url: string | null;
  cover_url: string | null;
  neighborhood: string | null;
  is_open: boolean | null;
  opening_hours: OpeningHours | null;
  whatsapp: string | null;
  phone: string | null;
}

const FeaturedStores = () => {
  const [stores, setStores] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCep, setUserCep] = useState("");
  const [searchCep, setSearchCep] = useState("");
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);
  const [customization, setCustomization] = useState<FeaturedCustomization | null>(null);

  const [deliveryZones, setDeliveryZones] = useState<DeliveryZone[]>([]);
  const [noStoresInArea, setNoStoresInArea] = useState(false);

  // Fetch customization from site_customizations
  useEffect(() => {
    const fetchCustomization = async () => {
      const { data } = await supabase
        .from('site_customizations')
        .select('title, subtitle, description')
        .eq('section', 'featured')
        .eq('is_active', true)
        .single();

      if (data) {
        setCustomization(data);
      }
    };

    fetchCustomization();
  }, []);

  const fetchDeliveryZones = async () => {
    const { data } = await supabase
      .from('delivery_zones')
      .select('id, commerce_id, cep_start, cep_end, is_active')
      .eq('is_active', true);
    
    setDeliveryZones((data || []) as DeliveryZone[]);
    return (data || []) as DeliveryZone[];
  };

  const isCommerceDeliveringToCep = (commerceId: string, userCep: string, zones: DeliveryZone[]): boolean => {
    const commerceZones = zones.filter(z => z.commerce_id === commerceId);
    if (commerceZones.length === 0) return true; // No zones configured = delivers everywhere
    return commerceZones.some(zone => isCepInRange(userCep, zone.cep_start, zone.cep_end));
  };

  const fetchStores = useCallback(async (cepFilter?: string) => {
    setLoading(true);
    setNoStoresInArea(false);

    // Fetch delivery zones first
    const zones = await fetchDeliveryZones();

    // Fetch approved commerces that are open
    const { data: commerces, error } = await supabase
      .from('commerces')
      .select('id, fantasy_name, city, cep, logo_url, cover_url, neighborhood, is_open, opening_hours, whatsapp, phone')
      .eq('status', 'approved')
      .eq('is_open', true)
      .limit(50);

    if (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } else {
      let filteredStores = (commerces || []) as Commerce[];

      // If user provided a CEP, filter stores that deliver to that area
      const compareCep = cepFilter || userCep;
      if (compareCep) {
        filteredStores = filteredStores.filter(store => 
          isCommerceDeliveringToCep(store.id, compareCep, zones)
        );

        // Sort by proximity
        filteredStores = filteredStores.sort((a, b) => {
          if (!a.cep && !b.cep) return 0;
          if (!a.cep) return 1;
          if (!b.cep) return -1;
          
          const scoreA = getCepProximityScore(compareCep, a.cep);
          const scoreB = getCepProximityScore(compareCep, b.cep);
          return scoreA - scoreB;
        });

        if (filteredStores.length === 0) {
          setNoStoresInArea(true);
        }
      }

      // Also filter by actual open status based on hours
      filteredStores = filteredStores.filter(store => 
        isStoreOpen(store.is_open, store.opening_hours as OpeningHours)
      );

      setStores(filteredStores.slice(0, 12));
    }

    setLoading(false);
  }, [userCep]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleCepSearch = async () => {
    const cleanCep = searchCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    setLookingUpCep(true);
    const address = await fetchAddressByCep(cleanCep);
    setLookingUpCep(false);

    if (address) {
      setUserCep(cleanCep);
      setLocationInfo(`${address.city} - ${address.state}`);
      await fetchStores(cleanCep);
    } else {
      setLocationInfo('CEP não encontrado');
    }
  };

  const handleCepInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setSearchCep(formatted);
    
    // Auto-search when 8 digits
    if (formatted.replace(/\D/g, '').length === 8) {
      setTimeout(handleCepSearch, 300);
    }
  };

  // Use customized values or fallbacks
  const sectionTitle = customization?.title || "Adegas e Tabacarias perto de você";
  const sectionSubtitle = customization?.subtitle || "Destaques";
  const sectionDescription = customization?.description || 
    "Encontre as melhores adegas e tabacarias que entregam na sua região.";

  return (
    <section id="comercios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            {sectionSubtitle}
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {sectionTitle.includes('perto de você') ? (
              <>
                {sectionTitle.split('perto de você')[0]}
                <span className="text-gradient-primary">perto de você</span>
              </>
            ) : (
              sectionTitle
            )}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            {sectionDescription}
          </p>

          {/* CEP Search */}
          <div className="max-w-md mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  placeholder="Digite seu CEP"
                  value={searchCep}
                  onChange={handleCepInputChange}
                  className="h-12 text-center text-lg"
                  maxLength={9}
                />
                {lookingUpCep && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />
                )}
              </div>
              <Button 
                onClick={handleCepSearch} 
                size="lg" 
                className="h-12 px-6"
                disabled={lookingUpCep || searchCep.replace(/\D/g, '').length !== 8}
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
            {locationInfo && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1"
              >
                <MapPin className="w-4 h-4" />
                {locationInfo}
              </motion.p>
            )}
          </div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">
              {noStoresInArea 
                ? "Nenhum comércio entrega na sua região" 
                : "Nenhum comércio aberto no momento"}
            </p>
            <p className="text-sm">
              {noStoresInArea 
                ? "Tente buscar com outro CEP ou aguarde novos parceiros" 
                : "Volte mais tarde ou cadastre seu comércio!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stores.map((store, index) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group"
              >
                {/* Store Cover Image */}
                <div className="relative h-28 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  {store.cover_url ? (
                    <img
                      src={store.cover_url}
                      alt={store.fantasy_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : store.logo_url ? (
                    <img
                      src={store.logo_url}
                      alt={store.fantasy_name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary/30">
                        {store.fantasy_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  
                  {/* Logo overlay */}
                  {store.logo_url && (
                    <div className="absolute bottom-2 left-2 w-10 h-10 rounded-lg overflow-hidden border-2 border-card shadow-lg bg-card">
                      <img
                        src={store.logo_url}
                        alt={`Logo ${store.fantasy_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <Badge 
                      className={`${isStoreOpen(store.is_open, store.opening_hours as OpeningHours) 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-red-500/90 text-white'} border-0`}
                    >
                      {isStoreOpen(store.is_open, store.opening_hours as OpeningHours) ? 'Aberto' : 'Fechado'}
                    </Badge>
                    <div className="bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="text-sm font-semibold text-foreground">Novo</span>
                    </div>
                  </div>
                </div>

                {/* Store Info */}
                <div className="p-3">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1 truncate">
                    {store.fantasy_name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {store.neighborhood ? `${store.neighborhood}, ` : ''}{store.city || 'Localização não informada'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <Clock className="w-4 h-4 flex-shrink-0" />
                    <span>{getTodayHours(store.opening_hours as OpeningHours) || 'Horário não informado'}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-secondary text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Entrega rápida
                    </div>
                    {(store.whatsapp || store.phone) && (
                      <a 
                        href={`https://wa.me/55${(store.whatsapp || store.phone)?.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-600 hover:text-green-500 transition-colors"
                      >
                        <Phone className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Mais de <span className="font-semibold text-foreground">{stores.length > 0 ? stores.length : 'muitos'} comércios</span> cadastrados na plataforma
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedStores;