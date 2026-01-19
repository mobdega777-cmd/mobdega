import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMobdega from "@/assets/logo-mobdega.png";

interface HeaderProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
  onLogoClick: () => void;
}

const Header = ({ onLoginClick, onRegisterClick, onLogoClick }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleMobileNavClick = (href: string) => {
    setIsMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

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

          {/* Desktop Navigation */}
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

          {/* Auth Buttons & Mobile Menu Toggle */}
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
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
              aria-label="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-card/95 backdrop-blur-md border-t border-border"
          >
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <button
                onClick={() => handleMobileNavClick("#beneficios")}
                className="text-left py-3 px-4 rounded-lg text-foreground/80 hover:text-primary hover:bg-muted transition-colors font-medium"
              >
                Benefícios
              </button>
              <button
                onClick={() => handleMobileNavClick("#comercios")}
                className="text-left py-3 px-4 rounded-lg text-foreground/80 hover:text-primary hover:bg-muted transition-colors font-medium"
              >
                Comércios
              </button>
              <button
                onClick={() => handleMobileNavClick("#contato")}
                className="text-left py-3 px-4 rounded-lg text-foreground/80 hover:text-primary hover:bg-muted transition-colors font-medium"
              >
                Contato
              </button>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  onLoginClick();
                }}
                className="sm:hidden justify-start"
              >
                Login
              </Button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
