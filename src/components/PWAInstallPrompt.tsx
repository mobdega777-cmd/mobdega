import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstall } from "@/hooks/usePWAInstall";

const PWAInstallPrompt = () => {
  const { shouldShowPrompt, promptInstall, dismissInstallPrompt, isInstalled } = usePWAInstall();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Show prompt after a short delay
    const timer = setTimeout(() => {
      if (isInstalled) return;
      // Show if native prompt available OR if iOS (manual instructions)
      const dismissed = localStorage.getItem('pwa-install-dismissed');
      if (dismissed) return;
      if (shouldShowPrompt || ios) {
        setIsVisible(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [shouldShowPrompt, isInstalled]);

  const handleInstall = async () => {
    if (isIOS) {
      // Can't programmatically install on iOS, just dismiss
      return;
    }
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
              <h3 className="font-semibold text-foreground">Adicionar à Tela Inicial</h3>
              {isIOS ? (
                <p className="text-sm text-muted-foreground mt-1">
                  Toque em <Share className="w-4 h-4 inline-block mx-0.5 -mt-0.5" /> e depois em <strong>"Adicionar à Tela de Início"</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground mt-1">
                  Instale o Mobdega para acesso rápido direto da sua tela inicial!
                </p>
              )}
              <div className="flex gap-2 mt-3">
                {!isIOS && (
                  <Button 
                    size="sm" 
                    className="gap-2" 
                    onClick={handleInstall}
                  >
                    <Download className="w-4 h-4" />
                    Instalar
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={handleDismiss}
                >
                  {isIOS ? "Entendi" : "Agora não"}
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
