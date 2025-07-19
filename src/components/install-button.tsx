import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";
import { isInstallable, showInstallPrompt, isRunningStandalone } from "@/lib/pwa";

export function InstallButton() {
  const [canInstall, setCanInstall] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app can be installed
    setCanInstall(isInstallable());
    setIsStandalone(isRunningStandalone());

    // Listen for install prompt events
    const handleBeforeInstallPrompt = () => {
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      setIsStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setCanInstall(false);
    }
  };

  // Don't show button if already installed
  if (isStandalone) {
    return null;
  }

  // Don't show button if can't install
  if (!canInstall) {
    return null;
  }

  return (
    <Button
      onClick={handleInstall}
      variant="outline"
      size="sm"
      className="gap-2 text-primary border-primary hover:bg-primary hover:text-primary-foreground"
    >
      <Smartphone className="h-4 w-4" />
      Install App
    </Button>
  );
}

export function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    setIsStandalone(isRunningStandalone());
    
    // Show banner after a short delay if installable
    const timer = setTimeout(() => {
      if (isInstallable() && !isRunningStandalone()) {
        setShowBanner(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleInstall = async () => {
    const installed = await showInstallPrompt();
    if (installed) {
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
  };

  if (!showBanner || isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-primary text-primary-foreground p-4 rounded-lg shadow-lg border">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          <div>
            <p className="font-medium">Install WizSpeek®</p>
            <p className="text-sm opacity-90">Get the app for faster access and offline messaging</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleInstall}
            size="sm"
            variant="secondary"
            className="bg-white text-primary hover:bg-gray-100"
          >
            Install
          </Button>
          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="text-white hover:bg-white/20"
          >
            Later
          </Button>
        </div>
      </div>
    </div>
  );
}