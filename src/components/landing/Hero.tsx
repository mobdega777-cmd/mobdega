import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroProps {
  onRegisterClick: () => void;
}

interface HeroCustomization {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  cta_text: string | null;
  cta_link: string | null;
}

const Hero = ({ onRegisterClick }: HeroProps) => {
  const [customization, setCustomization] = useState<HeroCustomization | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCustomization = async () => {
      const { data } = await supabase
        .from('site_customizations')
        .select('title, subtitle, description, cta_text, cta_link')
        .eq('section', 'hero')
        .eq('is_active', true)
        .maybeSingle();
      
      setCustomization(data);
      setIsLoading(false);
    };
    fetchCustomization();
  }, []);

  // Use customization data only when loaded
  const heroTitle = customization?.title || "Sua adega favorita";
  const heroSubtitle = customization?.subtitle || "na palma da mão";
  const heroDescription = customization?.description || "Encontre as melhores adegas e tabacarias perto de você. Peça bebidas, narguilés e muito mais com entrega rápida e segura.";
  const ctaText = customization?.cta_text || "Começar agora";

  return (
    <section className="relative min-h-screen gradient-hero overflow-hidden pt-20">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center min-h-[calc(100vh-5rem)] gap-12 py-12">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex-1 text-center lg:text-left"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6"
            >
              <Star className="w-4 h-4 fill-current" />
              A plataforma #1 para adegas e tabacarias
            </motion.div>

            {isLoading ? (
              <>
                <Skeleton className="h-14 w-3/4 mb-2" />
                <Skeleton className="h-14 w-1/2 mb-6" />
                <Skeleton className="h-6 w-full max-w-xl mb-8" />
              </>
            ) : (
              <>
                <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight mb-6">
                  {heroTitle}
                  <span className="text-gradient-primary block">{heroSubtitle}</span>
                </h1>

                <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-8">
                  {heroDescription}
                </p>
              </>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Button variant="hero" size="xl" onClick={onRegisterClick}>
                <ShoppingBag className="w-5 h-5" />
                {ctaText}
              </Button>
              <Button variant="outline" size="xl">
                Sou comerciante
              </Button>
            </div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-3 gap-6 max-w-lg mx-auto lg:mx-0"
            >
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-foreground">500+</div>
                <div className="text-sm text-muted-foreground">Comércios</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-foreground">50k+</div>
                <div className="text-sm text-muted-foreground">Pedidos</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-foreground">4.9</div>
                <div className="text-sm text-muted-foreground">Avaliação</div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 }}
            className="flex-1 relative"
          >
            <div className="relative w-full max-w-md mx-auto">
              {/* Main Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-card rounded-3xl shadow-elevated p-6 mb-4"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Pedido em andamento</h3>
                    <p className="text-muted-foreground">Adega do João</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-secondary font-medium">
                  <Clock className="w-4 h-4" />
                  Chegando em 25 min
                </div>
              </motion.div>

              {/* Floating Cards */}
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -left-8 top-1/2 bg-card rounded-2xl shadow-card p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-secondary/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-secondary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">Entrega rápida</div>
                    <div className="text-xs text-muted-foreground">Até 30 min</div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -right-4 bottom-8 bg-card rounded-2xl shadow-card p-4"
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 gradient-primary rounded-full border-2 border-card" />
                    <div className="w-8 h-8 gradient-secondary rounded-full border-2 border-card" />
                    <div className="w-8 h-8 bg-accent rounded-full border-2 border-card" />
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-foreground">+2.5k</span>
                    <span className="text-muted-foreground"> avaliações</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <path
            d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="hsl(var(--background))"
          />
        </svg>
      </div>
    </section>
  );
};

export default Hero;
