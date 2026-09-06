import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

interface PWAInstallButtonProps {
  onOpenGuide: () => void;
  className?: string;
  variant?: 'header' | 'hero';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  onOpenGuide,
  className = '',
  variant = 'header',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        onOpenGuide();
      }
    } else {
      onOpenGuide();
    }
  };

  if (isInstalled) {
    return (
      <button
        type="button"
        onClick={onOpenGuide}
        title="App is installed and offline-ready. Click for Trial Run details."
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors ${className}`}
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        <span className="hidden sm:inline">Installed App</span>
      </button>
    );
  }

  if (variant === 'hero') {
    return (
      <button
        type="button"
        onClick={handleAction}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] ${className}`}
      >
        <Download className="w-4 h-4 text-emerald-300" />
        <span>Download / Install App for Trial Run</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleAction}
      title="Download & Install for Offline Field Trial Run"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs transition-colors ${className}`}
    >
      <Download className="w-3.5 h-3.5 text-emerald-200" />
      <span>Install / Download App</span>
    </button>
  );
};
