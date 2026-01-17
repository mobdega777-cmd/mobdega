import { useState, useRef } from "react";
import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import FeaturedStores from "@/components/landing/FeaturedStores";
import Footer from "@/components/landing/Footer";
import AuthModal from "@/components/auth/AuthModal";
import MasterAdminModal from "@/components/auth/MasterAdminModal";

const Index = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const [isMasterAdminModalOpen, setIsMasterAdminModalOpen] = useState(false);
  
  // Track logo clicks for master admin access
  const logoClickCount = useRef(0);
  const logoClickTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleLoginClick = () => {
    setAuthModalMode("login");
    setIsAuthModalOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthModalMode("register");
    setIsAuthModalOpen(true);
  };

  const handleLogoClick = () => {
    logoClickCount.current += 1;

    // Clear existing timeout
    if (logoClickTimeout.current) {
      clearTimeout(logoClickTimeout.current);
    }

    // Check if 3 clicks within time window
    if (logoClickCount.current >= 3) {
      setIsMasterAdminModalOpen(true);
      logoClickCount.current = 0;
    } else {
      // Reset count after 1 second
      logoClickTimeout.current = setTimeout(() => {
        logoClickCount.current = 0;
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
        onLogoClick={handleLogoClick}
      />
      
      <main>
        <Hero onRegisterClick={handleRegisterClick} />
        <FeaturedStores />
        <Benefits />
      </main>

      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />

      {/* Master Admin Modal (Hidden Access) */}
      <MasterAdminModal
        isOpen={isMasterAdminModalOpen}
        onClose={() => setIsMasterAdminModalOpen(false)}
      />
    </div>
  );
};

export default Index;
