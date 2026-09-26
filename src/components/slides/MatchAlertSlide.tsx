import React, { useState, useEffect } from 'react';
import { Trophy, Frown, Sparkles, Clock, Flame, ShieldAlert, Swords } from 'lucide-react';
import { ActiveMatchAlert, TeamVisualItem, VisualTemplatesConfig, ClubSettings } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { getFontFamilyClass } from '../../utils/fontUtils';

interface MatchAlertSlideProps {
  alert: ActiveMatchAlert;
  teamVisual?: TeamVisualItem;
  visualTemplates?: VisualTemplatesConfig;
  clubSettings?: ClubSettings;
}

export const MatchAlertSlide: React.FC<MatchAlertSlideProps> = ({
  alert,
  teamVisual,
  visualTemplates,
  clubSettings,
}) => {
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
  const layoutStyle = visualTemplates?.alertLayoutStyle || 'poster';
  const textX = visualTemplates?.alertTextX ?? 50;
  const textY = visualTemplates?.alertTextY ?? 50;
  const textColor = visualTemplates?.alertTextColor || '#ffffff';
  const titleFont = visualTemplates?.alertTextFont || 'Bebas Neue';
  const teamFont = visualTemplates?.alertTeamFont || 'Montserrat';
  const scoreFont = visualTemplates?.alertScoreFont || 'Teko';
  const textScale = visualTemplates?.alertTextScale ?? 1.0;
  const bgOpacity = visualTemplates?.alertTextBgOpacity ?? 0.65;
  const winColor = visualTemplates?.alertWinColor || '#10b981';
  const lossColor = visualTemplates?.alertLossColor || '#ef4444';
  const showIcon = visualTemplates?.alertShowIcon ?? true;
  const showScore = visualTemplates?.alertShowScore ?? true;
  const showSubtitle = visualTemplates?.alertShowSubtitle ?? true;
  const glowEffect = visualTemplates?.alertGlowEffect ?? true;

  const outcomeTitle = alert.isWin
    ? visualTemplates?.alertCustomWinTitle || 'VICTOIRE !'
    : visualTemplates?.alertCustomLossTitle || 'DÉFAITE';

  const accentColor = alert.isWin ? winColor : lossColor;

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
          {/* Subtle gradient overlay to enhance legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
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
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/60 text-xs md:text-sm text-slate-300 shadow-lg">
          <Clock className="w-4 h-4 text-orange-400" />
          <span>Dans la boucle TV • Encore <strong className="text-white">{minutesRemaining} min</strong></span>
        </div>

        <div
          className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg backdrop-blur-md ${
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

      {/* ========================================================================= */}
      {/* RENDERING ACCORDING TO SELECTED LAYOUT STYLE                              */}
      {/* ========================================================================= */}

      {/* 1. LAYOUT : POSTER SPORTIF PRO (High-impact typography) */}
      {layoutStyle === 'poster' && (
        <div
          className="absolute z-10 flex flex-col items-center text-center transition-all duration-300"
          style={{
            left: `${textX}%`,
            top: `${textY}%`,
            transform: `translate(-50%, -50%) scale(${textScale})`,
            maxWidth: '92%',
          }}
        >
          <div
            className="p-6 md:p-10 rounded-3xl border shadow-2xl backdrop-blur-md flex flex-col items-center"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
              borderColor: `${accentColor}40`,
              boxShadow: glowEffect ? `0 20px 50px -10px ${accentColor}30` : undefined,
            }}
          >
            {/* Outcome Icon Badge */}
            {showIcon && (
              <div
                className="inline-flex items-center justify-center w-16 h-16 md:w-24 md:h-24 rounded-2xl mb-3 shadow-xl border-2 backdrop-blur-xl"
                style={{
                  backgroundColor: `${accentColor}25`,
                  borderColor: accentColor,
                  color: accentColor,
                }}
              >
                {alert.isWin ? (
                  <Trophy className="w-10 h-10 md:w-14 md:h-14 animate-bounce text-amber-300 drop-shadow" />
                ) : (
                  <Frown className="w-10 h-10 md:w-14 md:h-14 text-rose-300 drop-shadow" />
                )}
              </div>
            )}

            {/* Outcome Title : VICTOIRE ! ou DÉFAITE */}
            <h1
              className={`text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-wider leading-none drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] ${getFontFamilyClass(titleFont)}`}
              style={{
                color: textColor,
                textShadow: glowEffect ? `0 0 35px ${accentColor}80` : undefined,
              }}
            >
              {outcomeTitle}
            </h1>

            {/* Category / Team Name in Athletic Tag */}
            <div
              className="mt-3 px-8 py-2.5 rounded-2xl backdrop-blur-md border shadow-lg flex items-center gap-3"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}60`,
              }}
            >
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <h2
                className={`text-3xl md:text-5xl lg:text-6xl font-black tracking-wider uppercase ${getFontFamilyClass(teamFont)}`}
                style={{ color: accentColor }}
              >
                {alert.team}
              </h2>
            </div>

            {/* Score Display if available */}
            {showScore && hasScores && (
              <div className="mt-4 px-8 py-2.5 rounded-2xl bg-black/85 border border-white/30 flex items-center gap-4 shadow-xl">
                {alert.opponent && (
                  <span className="text-xs md:text-sm font-bold text-slate-400 uppercase max-w-[140px] truncate">
                    {clubSettings?.shortName || clubSettings?.name || 'SRC'}
                  </span>
                )}
                <div className={`text-3xl md:text-6xl font-black text-amber-400 tracking-widest ${getFontFamilyClass(scoreFont)}`}>
                  {alert.ourScore} <span className="text-slate-500 font-light">:</span> {alert.opponentScore}
                </div>
                {alert.opponent && (
                  <span className="text-xs md:text-sm font-bold text-slate-400 uppercase max-w-[140px] truncate">
                    {alert.opponent}
                  </span>
                )}
              </div>
            )}

            {/* Encouraging Subtitle */}
            {showSubtitle && (
              <p className="mt-4 text-sm md:text-lg font-semibold text-slate-200 drop-shadow max-w-xl">
                {alert.isWin
                  ? 'Félicitations à toute l’équipe pour cette belle performance ! 🏀🔥'
                  : 'Bravo aux joueurs pour leur engagement et combativité ! 🏀💪'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 2. LAYOUT : BANDEAU ATHLÉTIQUE (Horizontal Banner) */}
      {layoutStyle === 'banner' && (
        <div
          className="absolute z-10 w-full px-6 transition-all duration-300"
          style={{
            top: `${textY}%`,
            transform: `translateY(-50%) scale(${textScale})`,
          }}
        >
          <div
            className="w-full max-w-5xl mx-auto rounded-3xl border shadow-2xl backdrop-blur-md p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
              borderColor: `${accentColor}50`,
            }}
          >
            {/* Left: Outcome + Icon */}
            <div className="flex items-center gap-4">
              {showIcon && (
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border-2 shadow-lg shrink-0"
                  style={{ backgroundColor: `${accentColor}25`, borderColor: accentColor, color: accentColor }}
                >
                  {alert.isWin ? <Trophy className="w-9 h-9 text-amber-300 animate-bounce" /> : <Frown className="w-9 h-9 text-rose-300" />}
                </div>
              )}
              <div className="text-left">
                <h1
                  className={`text-4xl md:text-6xl font-black uppercase tracking-wider ${getFontFamilyClass(titleFont)}`}
                  style={{ color: textColor }}
                >
                  {outcomeTitle}
                </h1>
                <div
                  className={`text-2xl md:text-4xl font-black uppercase ${getFontFamilyClass(teamFont)}`}
                  style={{ color: accentColor }}
                >
                  {alert.team}
                </div>
              </div>
            </div>

            {/* Right: Score */}
            {showScore && hasScores && (
              <div className="px-6 py-2 rounded-2xl bg-black/80 border border-white/25 flex items-center gap-3">
                <div className={`text-4xl md:text-6xl font-black text-amber-400 ${getFontFamilyClass(scoreFont)}`}>
                  {alert.ourScore} - {alert.opponentScore}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. LAYOUT : CARTE GLASSMORPHISM */}
      {layoutStyle === 'card' && (
        <div
          className="absolute z-10 flex flex-col items-center text-center transition-all duration-300"
          style={{
            left: `${textX}%`,
            top: `${textY}%`,
            transform: `translate(-50%, -50%) scale(${textScale})`,
            maxWidth: '85%',
          }}
        >
          <div
            className="p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl backdrop-blur-xl flex flex-col items-center"
            style={{
              backgroundColor: `rgba(15, 23, 42, ${bgOpacity})`,
            }}
          >
            {showIcon && (
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center border mb-4"
                style={{ backgroundColor: `${accentColor}20`, borderColor: accentColor }}
              >
                {alert.isWin ? <Trophy className="w-12 h-12 text-amber-300 animate-bounce" /> : <Frown className="w-12 h-12 text-rose-300" />}
              </div>
            )}
            <h1
              className={`text-5xl md:text-7xl font-black uppercase tracking-wider ${getFontFamilyClass(titleFont)}`}
              style={{ color: textColor }}
            >
              {outcomeTitle}
            </h1>
            <div
              className={`mt-2 text-3xl md:text-5xl font-black uppercase ${getFontFamilyClass(teamFont)}`}
              style={{ color: accentColor }}
            >
              {alert.team}
            </div>
            {showScore && hasScores && (
              <div className={`mt-3 text-3xl md:text-5xl font-mono font-black text-amber-400 px-6 py-1 rounded-xl bg-black/60 border border-white/20 ${getFontFamilyClass(scoreFont)}`}>
                {alert.ourScore} : {alert.opponentScore}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. LAYOUT : BADGE & ÉCUSSON SPORT */}
      {layoutStyle === 'badge' && (
        <div
          className="absolute z-10 flex flex-col items-center text-center transition-all duration-300"
          style={{
            left: `${textX}%`,
            top: `${textY}%`,
            transform: `translate(-50%, -50%) scale(${textScale})`,
            maxWidth: '85%',
          }}
        >
          <div
            className="p-8 rounded-[40px] border-2 shadow-2xl backdrop-blur-lg flex flex-col items-center"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
              borderColor: accentColor,
            }}
          >
            {showIcon && (
              <div className="mb-2">
                {alert.isWin ? <Trophy className="w-14 h-14 text-amber-300 animate-bounce" /> : <Frown className="w-14 h-14 text-rose-300" />}
              </div>
            )}
            <div className="px-6 py-1 rounded-full text-xs font-black uppercase tracking-widest text-white mb-2" style={{ backgroundColor: accentColor }}>
              RÉSULTAT DU MATCH
            </div>
            <h1
              className={`text-5xl md:text-8xl font-black uppercase ${getFontFamilyClass(titleFont)}`}
              style={{ color: textColor }}
            >
              {outcomeTitle}
            </h1>
            <h2
              className={`text-2xl md:text-4xl font-black uppercase mt-1 ${getFontFamilyClass(teamFont)}`}
              style={{ color: accentColor }}
            >
              {alert.team}
            </h2>
            {showScore && hasScores && (
              <div className={`mt-3 text-3xl md:text-5xl font-black text-amber-400 font-mono ${getFontFamilyClass(scoreFont)}`}>
                {alert.ourScore} - {alert.opponentScore}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. LAYOUT : BANNIÈRE INFÉRIEURE ÉPURÉE */}
      {layoutStyle === 'minimal' && (
        <div className="absolute bottom-12 left-8 right-8 z-10">
          <div
            className="rounded-2xl border backdrop-blur-md p-4 md:p-6 flex items-center justify-between shadow-2xl"
            style={{
              backgroundColor: `rgba(0, 0, 0, ${bgOpacity})`,
              borderColor: `${accentColor}50`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-xl text-xl md:text-3xl font-black uppercase text-white shadow" style={{ backgroundColor: accentColor }}>
                {outcomeTitle}
              </div>
              <div className={`text-2xl md:text-4xl font-black uppercase ${getFontFamilyClass(teamFont)}`} style={{ color: textColor }}>
                {alert.team}
              </div>
            </div>
            {showScore && hasScores && (
              <div className={`text-3xl md:text-5xl font-black text-amber-400 ${getFontFamilyClass(scoreFont)}`}>
                {alert.ourScore} - {alert.opponentScore}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
