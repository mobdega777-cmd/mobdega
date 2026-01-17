import { motion } from "framer-motion";
import { MapPin, Star, Clock } from "lucide-react";

// Mock data for featured stores
const featuredStores = [
  {
    id: 1,
    name: "Adega Premium",
    city: "São Paulo, SP",
    rating: 4.9,
    deliveryTime: "25-35 min",
    image: "https://images.unsplash.com/photo-1597290282695-edc43d0e7129?w=400&h=300&fit=crop",
    logo: "https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=100&h=100&fit=crop",
    tags: ["Vinhos", "Destilados"]
  },
  {
    id: 2,
    name: "Tabacaria Central",
    city: "Rio de Janeiro, RJ",
    rating: 4.8,
    deliveryTime: "20-30 min",
    image: "https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=400&h=300&fit=crop",
    logo: "https://images.unsplash.com/photo-1574365569389-a10d488ca3fb?w=100&h=100&fit=crop",
    tags: ["Narguilé", "Essências"]
  },
  {
    id: 3,
    name: "Empório das Bebidas",
    city: "Belo Horizonte, MG",
    rating: 4.7,
    deliveryTime: "30-40 min",
    image: "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&h=300&fit=crop",
    logo: "https://images.unsplash.com/photo-1571950524485-bc8efb6e5c93?w=100&h=100&fit=crop",
    tags: ["Cervejas", "Whisky"]
  },
  {
    id: 4,
    name: "Casa do Vinho",
    city: "Curitiba, PR",
    rating: 4.9,
    deliveryTime: "25-35 min",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop",
    logo: "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=100&h=100&fit=crop",
    tags: ["Vinhos", "Espumantes"]
  },
];

const FeaturedStores = () => {
  return (
    <section id="comercios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Destaques
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Comércios <span className="text-gradient-primary">em destaque</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra as melhores adegas e tabacarias parceiras do Mobdega.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredStores.map((store, index) => (
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
              <div className="relative h-40 overflow-hidden">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                
                {/* Logo */}
                <div className="absolute bottom-3 left-3 w-14 h-14 rounded-xl overflow-hidden border-2 border-card shadow-lg">
                  <img
                    src={store.logo}
                    alt={`Logo ${store.name}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Rating */}
                <div className="absolute top-3 right-3 bg-card/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  <span className="text-sm font-semibold text-foreground">{store.rating}</span>
                </div>
              </div>

              {/* Store Info */}
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold text-foreground mb-1">
                  {store.name}
                </h3>
                
                <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
                  <MapPin className="w-4 h-4" />
                  {store.city}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-secondary text-sm font-medium">
                    <Clock className="w-4 h-4" />
                    {store.deliveryTime}
                  </div>
                  
                  <div className="flex gap-1">
                    {store.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-muted-foreground mb-4">
            Mais de <span className="font-semibold text-foreground">500 comércios</span> cadastrados em todo o Brasil
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturedStores;
