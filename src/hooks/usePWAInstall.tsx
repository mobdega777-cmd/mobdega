import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed via localStorage or display-mode
    const checkInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) return true;
      if (localStorage.getItem('pwa-installed') === 'true') return true;
      return false;
    };

    if (checkInstalled()) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
      localStorage.setItem('pwa-installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        localStorage.setItem('pwa-installed', 'true');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error prompting install:', error);
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setIsInstallable(false);
  };

  const shouldShowPrompt = () => {
    if (isInstalled) return false;
    if (!isInstallable) return false;
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return false;
    return true;
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissInstallPrompt,
    shouldShowPrompt: shouldShowPrompt(),
  };
};
