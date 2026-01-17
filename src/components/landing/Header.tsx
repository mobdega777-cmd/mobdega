import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import logoMobdega from "@/assets/logo-mobdega.png";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoClick: () => void;
}

const Header = ({ onLoginClick, onRegisterClick, onLogoClick }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  if (typeof window !== "undefined") {
    window.addEventListener("scroll", () => {
      setIsScrolled(window.scrollY > 20);
    });
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-card/95 backdrop-blur-md shadow-card"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={onLogoClick}
          >
            <img
              src={logoMobdega}
              alt="Mobdega - Adegas e Tabacarias na sua mão"
              className="h-12 md:h-14 w-auto"
            />
          </motion.div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a
              href="#beneficios"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Benefícios
            </a>
            <a
              href="#comercios"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Comércios
            </a>
            <a
              href="#contato"
              className="text-foreground/80 hover:text-primary transition-colors font-medium"
            >
              Contato
            </a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={onLoginClick}
              className="hidden sm:inline-flex"
            >
              Login
            </Button>
            <Button variant="hero" onClick={onRegisterClick}>
              Cadastre-se
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;
