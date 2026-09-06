import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { 
  X, 
  Download, 
  Laptop, 
  Smartphone, 
  WifiOff, 
  ExternalLink, 
  CheckCircle2, 
  Terminal, 
  Printer, 
  Table, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface TrialRunModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrialRunModal: React.FC<TrialRunModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  if (!isOpen) return null;

  const handleTriggerInstall = async () => {
    if (isInstallable) {
      await install();
    } else {
      // Direct user to browser install icon
      alert('To install in your current browser, look for the "Install" icon (computer screen with a down arrow) in your browser address bar at the top right, or click the browser menu (⋮) -> "Install DCS Milk Collection System".');
    }
  };

  const handleOpenStandaloneTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/65 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Download & Trial Run Guide
              </h3>
              <p className="text-xs text-stone-500">
                Run this DCS Milk Procurement system at your collection booth or local machine
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-stone-800">
          {/* Method 1: Install App on Device (PWA) */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-5 h-5 text-emerald-700" />
                <span className="text-sm font-bold text-emerald-950">
                  Method 1: Install as Desktop / Mobile App (Recommended for Trial Run)
                </span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold rounded-full">
                Zero Setup • Offline Ready
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Install the application directly to your dairy booth laptop, PC, tablet, or Android/iOS phone. It runs in a standalone window, stores entries offline in the local database, and works even without internet connectivity at rural milk centers.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              {isInstallable ? (
                <button
                  type="button"
                  onClick={handleTriggerInstall}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  <span>Click to Install App Now</span>
                </button>
              ) : isIOS ? (
                <div className="text-xs bg-white p-3 rounded-lg border border-emerald-200 text-stone-700">
                  <strong>iPhone/iPad Installation:</strong> Tap the Safari <strong>Share</strong> button (square with arrow) and select <strong>"Add to Home Screen"</strong>.
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerInstall}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App in Browser</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenStandaloneTab}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open in Full Tab</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Method 2: Download Source Code ZIP */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-stone-700" />
              <span className="text-sm font-bold text-stone-900">
                Method 2: Download Full Project ZIP (For Developers & Local Server)
              </span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              To download the full source code (TypeScript, React, Tailwind CSS, Vite) onto your personal computer or server:
            </p>

            <ol className="list-decimal list-inside text-xs text-stone-700 space-y-1.5 pl-1 font-sans">
              <li>
                Click the <strong>Settings / Menu (⋮)</strong> at the top right header of the Google AI Studio interface.
              </li>
              <li>
                Select <strong>"Export"</strong> &rarr; <strong>"Download ZIP"</strong> (or export to your GitHub repository).
              </li>
              <li>
                Extract the downloaded ZIP file to any folder on your machine.
              </li>
              <li>
                Open your terminal inside the folder and run:
                <div className="mt-1.5 p-2.5 bg-stone-900 text-emerald-400 font-mono text-xs rounded-lg select-all">
                  npm install<br />
                  npm run dev
                </div>
              </li>
              <li>
                Open <span className="font-mono text-emerald-800 font-bold">http://localhost:3000</span> in Chrome or Edge to run locally!
              </li>
            </ol>
          </div>

          {/* Trial Run Checklist */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wider block">
              Recommended 5-Step Trial Run Checklist
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">1. Test Collection Entry</strong>
                  <span className="text-stone-500 text-[11px]">Select farmer, enter liters, Fat %, and SNF % to test live rate computation.</span>
                </div>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-2">
                <Printer className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">2. Thermal Receipt Printing</strong>
                  <span className="text-stone-500 text-[11px]">Click "Print Slip" to test output formatted for 2-inch or 3-inch POS printers.</span>
                </div>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-2">
                <Table className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">3. Rate Chart Matrix</strong>
                  <span className="text-stone-500 text-[11px]">Inspect the 2D Fat × SNF matrix or export CSV for local notice board display.</span>
                </div>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-lg border border-stone-200 flex items-start gap-2">
                <WifiOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-stone-900 block">4. Offline Persistence</strong>
                  <span className="text-stone-500 text-[11px]">All entries and farmers stay saved in local storage without network dependencies.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            DCS Milk Procurement • Ready for field trial
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
