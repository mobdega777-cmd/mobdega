import { motion } from "framer-motion";
import { 
  Truck, 
  Store, 
  CreditCard, 
  Clock, 
  Shield, 
  Smartphone,
  BarChart3,
  Users
} from "lucide-react";

const userBenefits = [
  {
    icon: Truck,
    title: "Entrega Rápida",
    description: "Receba seus produtos em até 30 minutos na sua porta."
  },
  {
    icon: CreditCard,
    title: "Pagamento Fácil",
    description: "PIX, cartão de crédito, débito ou dinheiro na entrega."
  },
  {
    icon: Clock,
    title: "Disponível 24h",
    description: "Encontre adegas abertas a qualquer hora do dia."
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Seus dados protegidos e entrega garantida."
  },
];

const businessBenefits = [
  {
    icon: Smartphone,
    title: "PDV Completo",
    description: "Sistema de vendas integrado para balcão e delivery."
  },
  {
    icon: BarChart3,
    title: "Relatórios",
    description: "Acompanhe suas vendas e métricas em tempo real."
  },
  {
    icon: Users,
    title: "Gestão de Clientes",
    description: "Fidelize clientes com histórico completo de pedidos."
  },
  {
    icon: Store,
    title: "Cardápio Digital",
    description: "Gerencie produtos, preços e estoque facilmente."
  },
];

const Benefits = () => {
  return (
    <section id="beneficios" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Users Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Para Consumidores
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Por que usar o <span className="text-gradient-primary">Mobdega</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A melhor experiência para encontrar e pedir das melhores adegas e tabacarias da sua região.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
          {userBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300"
            >
              <div className="w-14 h-14 gradient-primary rounded-xl flex items-center justify-center mb-5">
                <benefit.icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Business Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block text-secondary font-semibold text-sm uppercase tracking-wider mb-4">
            Para Comércios
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Gerencie seu negócio com <span className="text-secondary">eficiência</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Sistema completo de gestão para adegas e tabacarias. PDV, delivery, estoque e muito mais.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {businessBenefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-elevated transition-all duration-300 border-2 border-transparent hover:border-secondary/20"
            >
              <div className="w-14 h-14 gradient-secondary rounded-xl flex items-center justify-center mb-5">
                <benefit.icon className="w-7 h-7 text-secondary-foreground" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
