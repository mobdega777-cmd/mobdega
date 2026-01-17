import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Clock, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { fetchAddressByCep, formatCep, getCepProximityScore } from "@/lib/viaCepService";

interface Commerce {
  id: string;
  fantasy_name: string;
  city: string | null;
  cep: string | null;
  logo_url: string | null;
  neighborhood: string | null;
}

const FeaturedStores = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<Commerce[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCep, setUserCep] = useState("");
  const [searchCep, setSearchCep] = useState("");
  const [lookingUpCep, setLookingUpCep] = useState(false);
  const [locationInfo, setLocationInfo] = useState<string | null>(null);

  useEffect(() => {
    fetchUserCepAndStores();
  }, [user]);

  const fetchUserCepAndStores = async () => {
    setLoading(true);

    // If user is logged in, try to get their CEP from profile
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('cep, city')
        .eq('user_id', user.id)
        .single();

      if (profile?.cep) {
        setUserCep(profile.cep);
        setSearchCep(formatCep(profile.cep));
        setLocationInfo(profile.city || null);
      }
    }

    await fetchStores(user ? undefined : undefined);
  };

  const fetchStores = async (cepFilter?: string) => {
    setLoading(true);

    // Fetch approved commerces
    const { data: commerces, error } = await supabase
      .from('commerces')
      .select('id, fantasy_name, city, cep, logo_url, neighborhood')
      .eq('status', 'approved')
      .limit(12);

    if (error) {
      console.error('Error fetching stores:', error);
      setStores([]);
    } else {
      let sortedStores = commerces || [];

      // If we have a CEP to compare, sort by proximity
      const compareCep = cepFilter || userCep;
      if (compareCep) {
        sortedStores = sortedStores.sort((a, b) => {
          if (!a.cep && !b.cep) return 0;
          if (!a.cep) return 1;
          if (!b.cep) return -1;
          
          const scoreA = getCepProximityScore(compareCep, a.cep);
          const scoreB = getCepProximityScore(compareCep, b.cep);
          return scoreA - scoreB;
        });
      }

      setStores(sortedStores);
    }

    setLoading(false);
  };

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
            Destaques
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Comércios <span className="text-gradient-primary">perto de você</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Encontre as melhores adegas e tabacarias que entregam na sua região.
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
            <p className="text-lg">Nenhum comércio encontrado</p>
            <p className="text-sm">Seja o primeiro a se cadastrar na plataforma!</p>
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
                className="bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-300 cursor-pointer group"
              >
                {/* Store Image */}
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20">
                  {store.logo_url ? (
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
                    <div className="absolute bottom-3 left-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-card shadow-lg bg-card">
                      <img
                        src={store.logo_url}
                        alt={`Logo ${store.fantasy_name}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Rating placeholder */}
                  <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    <span className="text-sm font-semibold text-foreground">Novo</span>
                  </div>
                </div>

                {/* Store Info */}
                <div className="p-4">
                  <h3 className="font-display text-lg font-semibold text-foreground mb-1 truncate">
                    {store.fantasy_name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">
                      {store.neighborhood ? `${store.neighborhood}, ` : ''}{store.city || 'Localização não informada'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-secondary text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Entrega rápida
                    </div>
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