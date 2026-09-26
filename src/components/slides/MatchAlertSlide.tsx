import React, { useState, useEffect } from 'react';
import { Trophy, Frown, Sparkles, Clock, Flame, ShieldAlert } from 'lucide-react';
import { ActiveMatchAlert, TeamVisualItem, VisualTemplatesConfig } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { getFontFamilyClass } from '../../utils/fontUtils';

interface MatchAlertSlideProps {
  alert: ActiveMatchAlert;
  teamVisual?: TeamVisualItem;
  visualTemplates?: VisualTemplatesConfig;
}

export const MatchAlertSlide: React.FC<MatchAlertSlideProps> = ({ alert, teamVisual, visualTemplates }) => {
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
  const visualImage =
    alert.customImageUrl ||
    (alert.isWin ? teamVisual?.winVisualUrl : teamVisual?.lossVisualUrl) ||
    (alert.isWin ? visualTemplates?.defaultVictoryBackgroundUrl : visualTemplates?.defaultDefeatBackgroundUrl);

  const hasScores = alert.ourScore !== undefined && alert.opponentScore !== undefined;

  // Custom positioning & typography settings from visualTemplates
  const textX = visualTemplates?.alertTextX ?? 50;
  const textY = visualTemplates?.alertTextY ?? 50;
  const textColor = visualTemplates?.alertTextColor || '#ffffff';
  const textFont = visualTemplates?.alertTextFont || 'Bebas Neue';
  const textScale = visualTemplates?.alertTextScale ?? 1.0;
  const bgOpacity = visualTemplates?.alertTextBgOpacity ?? 0.65;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 select-none">
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
              className="w-full h-full object-cover brightness-[0.88] contrast-105"
            />
          ) : (
            <img
              src={visualImage}
              alt={`${alert.team} - ${alert.isWin ? 'Victoire' : 'Défaite'}`}
              className="w-full h-full object-cover brightness-[0.85] contrast-105 scale-100 transition-transform duration-10000 ease-out animate-pulse-slow"
            />
          )}
          <div className="absolute inset-0 bg-slate-950/35 pointer-events-none" />
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

      {/* Top Badges */}
      <div className="absolute top-4 left-6 right-6 z-20 flex items-center justify-between pointer-events-none">
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

      {/* Bottom Bar Info */}
      <div className="absolute bottom-4 left-6 right-6 z-20 flex items-center justify-between pt-2 border-t border-white/10 text-xs md:text-sm text-slate-400 pointer-events-none">
        <span>Visuel officiel du club • Affiché en boucle sur la TV pendant 60 minutes</span>
        <span className="font-bold text-orange-400">#AllezLeClub</span>
      </div>

      {/* Montage Libre : Bloc de Texte Positionnable en X/Y */}
      <div
        className="absolute z-10 flex flex-col items-center text-center transition-all duration-300"
        style={{
          left: `${textX}%`,
          top: `${textY}%`,
          transform: `translate(-50%, -50%) scale(${textScale})`,
          maxWidth: '90%',
        }}
      >
        <div
          className="p-6 md:p-8 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-md flex flex-col items-center"
          style={{
            backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
          }}
        >
          {/* Win / Loss Icon Badge */}
          <div
            className={`inline-flex items-center justify-center w-20 h-20 md:w-28 md:h-28 rounded-2xl mb-4 shadow-xl border-2 backdrop-blur-xl ${
              alert.isWin
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-emerald-500/40'
                : 'bg-red-500/20 border-red-400 text-red-400 shadow-red-500/40'
            }`}
          >
            {alert.isWin ? (
              <Trophy className="w-12 h-12 md:w-16 md:h-16 animate-bounce text-amber-300" />
            ) : (
              <Frown className="w-12 h-12 md:w-16 md:h-16 text-rose-300" />
            )}
          </div>

          {/* Outcome Title : VICTOIRE ! ou DÉFAITE */}
          <h1
            className={`text-5xl md:text-8xl font-black uppercase tracking-wider drop-shadow-2xl ${getFontFamilyClass(textFont)}`}
            style={{ color: textColor }}
          >
            {alert.isWin ? 'VICTOIRE !' : 'DÉFAITE'}
          </h1>

          {/* Category / Team Name in highlighted box */}
          <div className="mt-3 px-8 py-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/25 shadow-lg">
            <h2
              className={`text-2xl md:text-5xl font-black tracking-wider uppercase ${getFontFamilyClass(textFont)}`}
              style={{ color: alert.isWin ? '#34d399' : '#f87171' }}
            >
              {alert.team}
            </h2>
          </div>

          {/* Score Display if available */}
          {hasScores && (
            <div className="mt-3 px-6 py-1.5 rounded-xl bg-black/80 border border-white/30 text-xl md:text-3xl font-mono font-black text-amber-400">
              {alert.ourScore} - {alert.opponentScore}
            </div>
          )}

          {/* Encouraging Subtitle */}
          <p className="mt-4 text-sm md:text-lg font-semibold text-slate-200 drop-shadow max-w-xl">
            {alert.isWin
              ? 'Félicitations à toute l’équipe pour cette belle performance ! 🏀🔥'
              : 'Bravo aux joueurs pour leur engagement et combativité ! 🏀💪'}
          </p>
        </div>
      </div>
    </div>
  );
};
