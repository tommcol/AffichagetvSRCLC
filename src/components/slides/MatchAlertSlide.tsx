import React, { useState, useEffect } from 'react';
import { Trophy, Frown, Sparkles, Clock, Flame, ShieldAlert } from 'lucide-react';
import { ActiveMatchAlert, TeamVisualItem } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';

interface MatchAlertSlideProps {
  alert: ActiveMatchAlert;
  teamVisual?: TeamVisualItem;
}

export const MatchAlertSlide: React.FC<MatchAlertSlideProps> = ({ alert, teamVisual }) => {
  const [minutesRemaining, setMinutesRemaining] = useState<number>(() => {
    const diff = alert.expiresAt - Date.now();
    return Math.max(0, Math.ceil(diff / 60000));
  });

  useEffect(() => {
    const updateCountdown = () => {
      const diff = alert.expiresAt - Date.now();
      setMinutesRemaining(Math.max(0, Math.ceil(diff / 60000)));
    };
    const timer = setInterval(updateCountdown, 10000);
    return () => clearInterval(timer);
  }, [alert.expiresAt]);

  // Determine which visual to display
  const visualImage = alert.customImageUrl || (alert.isWin ? teamVisual?.winVisualUrl : teamVisual?.lossVisualUrl);

  const hasScores = alert.ourScore !== undefined && alert.opponentScore !== undefined;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950">
      {/* Background visual (Team victory / defeat image or video) */}
      {visualImage ? (
        <div className="absolute inset-0 z-0">
          {isVideoMedia(visualImage) ? (
            <video
              src={visualImage}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover brightness-[0.85] contrast-110"
            />
          ) : (
            <img
              src={visualImage}
              alt={`${alert.team} - ${alert.isWin ? 'Victoire' : 'Défaite'}`}
              className="w-full h-full object-cover brightness-[0.82] contrast-110 scale-100 transition-transform duration-10000 ease-out animate-pulse-slow"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
        </div>
      ) : (
        <div
          className={`absolute inset-0 z-0 ${
            alert.isWin
              ? 'bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-900'
              : 'bg-gradient-to-br from-red-950 via-slate-950 to-slate-900'
          }`}
        />
      )}

      {/* Decorative Basketball Court Ambient Elements */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px]" />

      {/* Content overlay */}
      <div className="relative z-10 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col items-center text-center justify-between h-full">
        {/* Top Badges */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-xs md:text-sm text-slate-300">
            <Clock className="w-4 h-4 text-orange-400" />
            <span>Dans la boucle TV • Encore <strong className="text-white">{minutesRemaining} min</strong></span>
          </div>

          <div
            className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg ${
              alert.triggeredBy === 'telegram'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{alert.triggeredBy === 'telegram' ? 'Alerte Telegram' : 'Score FFBB Direct'}</span>
          </div>
        </div>

        {/* Central Glory Presentation */}
        <div className="my-auto flex flex-col items-center">
          {/* Win / Loss Icon Badge */}
          <div
            className={`inline-flex items-center justify-center w-24 h-24 md:w-32 md:h-32 rounded-3xl mb-6 shadow-2xl border-2 backdrop-blur-xl ${
              alert.isWin
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-500/40'
                : 'bg-red-500/20 border-red-400 text-red-400 shadow-red-500/40'
            }`}
          >
            {alert.isWin ? (
              <Trophy className="w-14 h-14 md:w-20 md:h-20 animate-bounce" />
            ) : (
              <Frown className="w-14 h-14 md:w-20 md:h-20" />
            )}
          </div>

          {/* Outcome Title */}
          <h1
            className={`text-6xl md:text-9xl font-black uppercase tracking-wider font-bebas drop-shadow-2xl ${
              alert.isWin
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-100 to-green-400'
                : 'text-transparent bg-clip-text bg-gradient-to-r from-red-300 via-orange-100 to-rose-400'
            }`}
          >
            {alert.isWin ? 'VICTOIRE !' : 'DÉFAITE'}
          </h1>

          {/* Category in very large display font as requested */}
          <div className="mt-4 px-10 py-3.5 rounded-3xl bg-black/70 backdrop-blur-md border-2 border-white/20 shadow-2xl">
            <h2 className="text-3xl md:text-6xl font-black text-white font-bebas tracking-wider uppercase">
              {alert.team}
            </h2>
          </div>

          {/* Cheering / Encouraging Subtitle */}
          <p className="mt-6 text-lg md:text-2xl font-semibold text-slate-200 drop-shadow max-w-2xl">
            {alert.isWin
              ? 'Félicitations à toute l’équipe pour cette belle performance ! 🏀🔥'
              : 'Bravo aux joueurs pour leur engagement et combativité ! 🏀💪'}
          </p>
        </div>

        {/* Bottom Bar Info */}
        <div className="w-full flex items-center justify-between pt-4 border-t border-white/10 text-xs md:text-sm text-slate-400">
          <span>Visuel officiel du club • Affiché en boucle sur la TV pendant 60 minutes</span>
          <span className="font-bold text-orange-400">#AllezLeClub</span>
        </div>
      </div>
    </div>
  );
};
