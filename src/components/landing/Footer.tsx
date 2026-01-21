import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Instagram, 
  Facebook, 
  Twitter, 
  Mail, 
  Phone, 
  MapPin 
} from "lucide-react";
import logoMobdega from "@/assets/logo-mobdega.png";
import { supabase } from "@/integrations/supabase/client";

interface FooterCustomization {
  title: string | null;
  subtitle: string | null;
  description: string | null;
  metadata: {
    email?: string;
    phone?: string;
    address?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  } | null;
}

const Footer = () => {
  const [customization, setCustomization] = useState<FooterCustomization | null>(null);

  useEffect(() => {
    const fetchCustomization = async () => {
      const { data } = await supabase
        .from('site_customizations')
        .select('title, subtitle, description, metadata')
        .eq('section', 'footer')
        .eq('is_active', true)
        .maybeSingle();
      
      if (data) {
        setCustomization(data as FooterCustomization);
      }
    };
    fetchCustomization();
  }, []);

  const email = customization?.metadata?.email || "contato@mobdega.com.br";
  const phone = customization?.metadata?.phone || "(11) 99999-9999";
  const address = customization?.metadata?.address || "São Paulo, SP\nBrasil";
  const description = customization?.description || "A plataforma que conecta você às melhores adegas e tabacarias da sua região.";
  const instagramUrl = customization?.metadata?.instagram || "#";
  const facebookUrl = customization?.metadata?.facebook || "#";
  const twitterUrl = customization?.metadata?.twitter || "#";

  return (
    <footer id="contato" className="gradient-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <img
              src={logoMobdega}
              alt="Mobdega"
              className="h-12 w-auto mb-4 brightness-0 invert"
            />
            <p className="text-primary-foreground/70 mb-6">
              {description}
            </p>
            <div className="flex gap-4">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-primary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="font-display text-lg font-semibold mb-6">
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Início
                </a>
              </li>
              <li>
                <a href="#beneficios" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Benefícios
                </a>
              </li>
              <li>
                <a href="#comercios" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Comércios
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Seja um Parceiro
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="font-display text-lg font-semibold mb-6">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Termos de Uso
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Política de Privacidade
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Cookies
                </a>
              </li>
              <li>
                <a href="#" className="text-primary-foreground/70 hover:text-primary transition-colors">
                  Sobre Nós
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h4 className="font-display text-lg font-semibold mb-6">
              Contato
            </h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70">{email}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-primary-foreground/70">{phone}</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <span className="text-primary-foreground/70 whitespace-pre-line">
                  {address}
                </span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-primary-foreground/50 text-sm">
              © 2025 Mobdega. Todos os direitos reservados.
            </p>
            <p className="text-primary-foreground/50 text-sm">
              Feito com ❤️ no Brasil
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
