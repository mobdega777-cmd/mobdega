import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const PWAInstallPrompt = () => {
  const { shouldShowPrompt, promptInstall, dismissInstallPrompt } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after a short delay
    const timer = setTimeout(() => {
      if (shouldShowPrompt) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [shouldShowPrompt]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
      >
        <div className="bg-card border border-border rounded-2xl shadow-elevated p-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground">Instalar Mobdega</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Adicione à sua tela inicial para acesso rápido!
              </p>
              <div className="flex gap-2 mt-3">
                <Button 
                  size="sm" 
                  className="gap-2" 
                  onClick={handleInstall}
                >
                  <Download className="w-4 h-4" />
                  Instalar
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                >
                  Agora não
                </Button>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
