import React, { useState } from 'react';
import { Download, Smartphone, X, Tv } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'button' | 'compact' | 'badge';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'button',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop / Smart TV flow
  if (isInstallable) {
    if (variant === 'compact') {
      return (
        <button
          type="button"
          onClick={install}
          className={`p-2 rounded-xl bg-slate-800 hover:bg-orange-600 text-slate-300 hover:text-white transition-all shadow-sm ${className}`}
          title="Installer l'application TV sur cet appareil"
        >
          <Download className="w-4 h-4" />
        </button>
      );
    }

    return (
      <button
        type="button"
        onClick={install}
        className={`px-3.5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-orange-600/20 transition-all hover:scale-105 cursor-pointer ${className}`}
        title="Installer l'application sur cet écran / tablette"
      >
        <Download className="w-4 h-4" />
        <span>Installer l'App TV</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 ${className}`}
        >
          <Smartphone className="w-3.5 h-3.5 text-orange-400" />
          <span>Installer sur iPad/iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700 p-6 shadow-2xl space-y-4 text-slate-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2 text-white font-bold font-bebas text-lg">
                  <Tv className="w-5 h-5 text-orange-400" />
                  <span>INSTALLATION SUR IPAD / IPHONE</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-xs space-y-2 text-slate-300">
                <p>Pour lancer l'application en plein écran comme une vraie application TV :</p>
                <ol className="list-decimal list-inside space-y-1.5 font-medium bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <li>Touchez le bouton <strong>Partager</strong> (<span className="text-orange-400">carré avec flèche</span>) en bas de Safari.</li>
                  <li>Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong>.</li>
                  <li>Appuyez sur <strong>Ajouter</strong> en haut à droite.</li>
                </ol>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-md shadow-orange-600/25 cursor-pointer"
              >
                J'ai compris
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
