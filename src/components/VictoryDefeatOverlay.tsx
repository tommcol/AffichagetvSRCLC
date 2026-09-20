import React, { useEffect, useState } from 'react';
import { Trophy, Frown, Sparkles, Clock, Share2, Download, X, Eye, EyeOff } from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinishedMatchNotification } from '../types';
import { isVideoMedia } from '../utils/mediaUtils';

interface VictoryDefeatOverlayProps {
  notification: FinishedMatchNotification | null;
  onDismiss: () => void;
  onDownloadVisual: (notif: FinishedMatchNotification) => void;
}

export const VictoryDefeatOverlay: React.FC<VictoryDefeatOverlayProps> = ({
  notification,
  onDismiss,
  onDownloadVisual,
}) => {
  const [minimized, setMinimized] = useState<boolean>(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number>(60);

  // Trigger confetti and update countdown
  useEffect(() => {
    if (!notification) return;

    if (notification.isWin) {
      // Fire confetti cannons
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#f59e0b', '#ffffff', '#ea580c'],
        });
      } catch (err) {
        console.error('Confetti error:', err);
      }
    }

    const checkTime = () => {
      const now = Date.now();
      const diffMs = notification.expiresAt - now;
      if (diffMs <= 0) {
        onDismiss();
      } else {
        setRemainingMinutes(Math.max(1, Math.ceil(diffMs / 60000)));
      }
    };

    checkTime();
    const timer = setInterval(checkTime, 10000);
    return () => clearInterval(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;

  const { isWin, category, competition, ourTeam, opponent, ourScore, opponentScore, gymnasium } = notification;

  if (minimized) {
    return (
      <div
        id="minimized-match-notification"
        className={`fixed top-20 right-6 z-50 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all animate-bounce cursor-pointer flex items-center gap-4 ${
          isWin
            ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-100 shadow-emerald-500/30'
            : 'bg-rose-950/90 border-rose-500/60 text-rose-100 shadow-rose-500/30'
        }`}
        onClick={() => setMinimized(false)}
        title="Cliquer pour réafficher en grand sur la TV"
      >
        <div className={`p-2.5 rounded-xl ${isWin ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
          {isWin ? <Trophy className="w-6 h-6" /> : <Frown className="w-6 h-6" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider font-bebas text-amber-400">
              {isWin ? 'VICTOIRE !' : 'DÉFAITE'}
            </span>
            <span className="text-[11px] text-slate-300">({remainingMinutes} min restantes)</span>
          </div>
          <div className="font-bold text-sm">
            {category} : {ourScore} - {opponentScore}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(false);
          }}
          className="p-1 rounded-lg bg-black/30 hover:bg-black/50 text-white text-xs px-2 py-1"
        >
          Agrandir
        </button>
      </div>
    );
  }

  return (
    <div
      id="full-match-finished-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-300"
    >
      {/* Decorative ambient background glows */}
      <div
        className={`absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[140px] opacity-40 pointer-events-none ${
          isWin ? 'bg-emerald-500' : 'bg-rose-600'
        }`}
      />
      <div
        className={`absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[140px] opacity-40 pointer-events-none ${
          isWin ? 'bg-amber-400' : 'bg-orange-600'
        }`}
      />

      <div className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-3xl border border-slate-700/60 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-8 md:p-12 shadow-2xl text-center">
        {/* Optional background custom media (image or video) */}
        {notification.customImageUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            {isVideoMedia(notification.customImageUrl) ? (
              <video
                src={notification.customImageUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={notification.customImageUrl}
                alt="Visuel match"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-slate-950/60" />
          </div>
        )}

        {/* Top Header Bar inside card */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300">
            <Clock className="w-3.5 h-3.5 text-orange-400" />
            <span>DIFFUSION SPÉCIALE • EN COURS PENDANT 1H ({remainingMinutes} min restantes)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMinimized(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Réduire pour laisser passer le carrousel sur la TV"
            >
              <EyeOff className="w-3.5 h-3.5" />
              <span>Réduire</span>
            </button>
            <button
              onClick={onDismiss}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/50 hover:text-rose-300 text-slate-400 transition-colors"
              title="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Victory / Defeat Badge */}
        <div className="inline-flex items-center justify-center mb-6">
          <div
            className={`relative flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-3xl shadow-2xl ${
              isWin
                ? 'bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white shadow-emerald-500/40 ring-4 ring-emerald-400/30 animate-pulse-slow'
                : 'bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white shadow-rose-600/40 ring-4 ring-rose-500/30'
            }`}
          >
            {isWin ? (
              <Trophy className="w-14 h-14 md:w-18 md:h-18 drop-shadow-md text-amber-200" />
            ) : (
              <Frown className="w-14 h-14 md:w-18 md:h-18 drop-shadow-md text-rose-100" />
            )}
          </div>
        </div>

        {/* Big Banner Title */}
        <div className="mb-4">
          <span
            className={`inline-block px-4 py-1 rounded-full text-xs md:text-sm font-bold tracking-widest uppercase mb-2 ${
              isWin ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}
          >
            COUP DE SIFFLET FINAL FFBB
          </span>
          <h2
            className={`text-6xl md:text-8xl lg:text-9xl font-black tracking-tight uppercase font-bebas leading-none ${
              isWin
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-100 to-amber-200 drop-shadow-lg'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-red-100 to-orange-200'
            }`}
          >
            {isWin ? 'VICTOIRE !' : 'DÉFAITE'}
          </h2>
          <div className="mt-3 inline-block px-8 py-2 rounded-2xl bg-black/60 border border-white/20 shadow-xl">
            <span className="text-3xl md:text-5xl font-black text-white uppercase font-bebas tracking-wide">
              {category}
            </span>
          </div>
          <p className="text-slate-300 text-sm md:text-base font-medium mt-2">
            <span className="text-orange-400 font-bold">{competition}</span>
          </p>
        </div>

        {/* Scoreboard Component */}
        <div className="my-8 max-w-2xl mx-auto bg-slate-950/80 rounded-3xl border border-slate-800 p-6 md:p-8 shadow-inner">
          <div className="grid grid-cols-5 items-center gap-4">
            {/* Our Team */}
            <div className="col-span-2 text-right">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Notre Équipe</div>
              <div className="text-xl md:text-2xl font-black text-white truncate font-bebas tracking-wide">
                {ourTeam}
              </div>
              <div className="text-xs text-emerald-400 font-semibold mt-1">
                {isWin ? 'Victoire validée' : 'Match terminé'}
              </div>
            </div>

            {/* Score Digit Display */}
            <div className="col-span-1 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-2xl border border-slate-700 shadow-xl">
                <span
                  className={`text-4xl md:text-6xl font-black font-teko ${
                    isWin ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {ourScore}
                </span>
                <span className="text-2xl font-black text-slate-500">:</span>
                <span
                  className={`text-4xl md:text-6xl font-black font-teko ${
                    !isWin ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {opponentScore}
                </span>
              </div>
            </div>

            {/* Opponent Team */}
            <div className="col-span-2 text-left">
              <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Adversaire</div>
              <div className="text-xl md:text-2xl font-black text-slate-200 truncate font-bebas tracking-wide">
                {opponent}
              </div>
              <div className="text-xs text-slate-400 mt-1">{gymnasium}</div>
            </div>
          </div>
        </div>

        {/* Motivational message */}
        <p className="text-sm md:text-base text-slate-300 italic mb-8 max-w-lg mx-auto">
          {isWin
            ? '🔥 Énorme prestation de nos joueurs ! Félicitations à toute l\'équipe et au staff pour cette superbe victoire !'
            : '💪 Bravo pour le combat et l\'engagement ! Rendez-vous au prochain entraînement pour repartir plus fort !'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onDownloadVisual(notification)}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl shadow-orange-600/30 transition-all hover:scale-105"
            id="btn-download-victory-visual"
          >
            <Download className="w-4 h-4" />
            <span>Télécharger le Visuel (Instagram / Réseaux)</span>
          </button>

          <button
            onClick={() => setMinimized(true)}
            className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm flex items-center gap-2 transition-colors"
            id="btn-minimize-overlay"
          >
            <EyeOff className="w-4 h-4" />
            <span>Passer en mode discret (Continuer le carrousel)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
