import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

interface OfflineIndicatorProps {
  showInTvMode?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ showInTvMode = false }) => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className={`fixed z-50 flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold shadow-xl border backdrop-blur-md animate-in fade-in transition-all ${
        showInTvMode
          ? 'top-4 right-4 bg-amber-950/80 border-amber-500/50 text-amber-200'
          : 'bottom-4 left-4 bg-amber-950/90 border-amber-500/60 text-amber-200'
      }`}
      title="Aucune connexion Internet détectée. L'écran fonctionne normalement grâce au cache de secours local."
    >
      <WifiOff className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
      <span>Mode Hors-Ligne (Données locales en cache)</span>
    </div>
  );
};
