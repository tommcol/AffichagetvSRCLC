import React from 'react';
import { Trophy, CheckCircle2, XCircle, Share2, Home, Plane } from 'lucide-react';
import { MatchItem, ClubSettings, SlideDesignTheme, ForegroundMascotConfig, OverlayLayerItem } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { isMatchWin, isClubHomeMatch } from '../../utils/matchStatus';
import { formatMatchDayAndDate, sortMatchesChronologically } from '../../utils/matchDateHelper';
import { ChromaKeyMascot } from '../ChromaKeyMascot';
import { FreeOverlayLayer } from '../FreeOverlayLayer';
import { getFontFamilyClass } from '../../utils/fontUtils';

interface ResultsSlideProps {
  results: MatchItem[];
  clubSettings: ClubSettings;
  onDownloadVisual: () => void;
  backgroundUrl?: string;
  hideShareButton?: boolean;
  theme?: SlideDesignTheme;
  mascot?: ForegroundMascotConfig;
  layer3?: OverlayLayerItem;
  layer4?: OverlayLayerItem;
  customHeaderTitle?: string;
  isInteractiveOverlay?: boolean;
  onLayerPositionChange?: (layerNum: 3 | 4, x: number, y: number) => void;
  selectedLayerNum?: 3 | 4 | null;
  onSelectLayer?: (layerNum: 3 | 4) => void;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (percent: number) => void;
}

export const ResultsSlide: React.FC<ResultsSlideProps> = ({
  results,
  clubSettings,
  onDownloadVisual,
  backgroundUrl,
  hideShareButton,
  theme,
  mascot,
  layer3,
  layer4,
  customHeaderTitle,
  isInteractiveOverlay = false,
  onLayerPositionChange,
  selectedLayerNum,
  onSelectLayer,
  onVideoEnded,
  onVideoTimeUpdate,
}) => {
  // Use the results directly since they are already pre-filtered externally
  const activeResults = results;
  const sortedResults = [...activeResults].sort(sortMatchesChronologically);

  const getOpponentLogo = (r: MatchItem): string | null => {
    if (r.opponentLogo) return r.opponentLogo;
    const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
    const oppName = isHome ? r.teamAway : r.teamHome;
    try {
      const rawCache = localStorage.getItem('club_opponent_logos_cache');
      if (rawCache) {
        const cache = JSON.parse(rawCache);
        if (cache && oppName && cache[oppName]) return cache[oppName];
      }
    } catch (e) {}
    if (r.teamLogo && r.teamLogo !== clubSettings.logoUrl) return r.teamLogo;
    return null;
  };

  const totalWins = sortedResults.filter((r) => isMatchWin(r, clubSettings.name, clubSettings.shortName)).length;
  const totalLosses = sortedResults.filter((r) => !isMatchWin(r, clubSettings.name, clubSettings.shortName)).length;
  const hasVictory = totalWins > 0;

  // Video priority and synchronization determination
  const isBgVideo = Boolean(
    backgroundUrl && (theme?.backgroundMediaType === 'video' || isVideoMedia(backgroundUrl))
  );
  const isLayer3Video = Boolean(
    layer3?.enabled && (layer3.mediaType === 'video' || isVideoMedia(layer3.mediaUrl))
  );
  const isLayer4Video = Boolean(
    layer4?.enabled && (layer4.mediaType === 'video' || isVideoMedia(layer4.mediaUrl))
  );
  const isMascotVideo = Boolean(
    !layer3 && mascot?.enabled && mascot.mediaType === 'video' && mascot.mediaUrl
  );

  const layer3HasControl = isLayer3Video;
  const layer4HasControl = !isLayer3Video && isLayer4Video;
  const mascotHasControl = !isLayer3Video && !isLayer4Video && isMascotVideo;
  const bgHasControl = !isLayer3Video && !isLayer4Video && !isMascotVideo && isBgVideo;

  // Visual Theme resolution
  const primaryColor = theme?.primaryColor || clubSettings.primaryColor || '#ea580c';
  const textColor = theme?.textColor || '#ffffff';
  const badgeBgColor = theme?.badgeBgColor || primaryColor;
  const badgeTextColor = theme?.badgeTextColor || '#ffffff';
  const resultDisplayMode = theme?.resultDisplayMode || 'both';
  const cardBg = theme?.cardBgColor || '#020617';
  const cardOpacity = theme?.cardOpacity ?? 0.85;
  const cardBlur = theme?.cardBlur ?? 8;
  const headerFont = theme?.fontFamilyHeader || 'Bebas Neue';
  const scoreFont = theme?.fontFamilyScore || 'Teko';
  const bodyFont = theme?.fontFamilyBody || 'Montserrat';
  const bgBrightness = theme?.backgroundBrightness ?? 0.35;
  const bgBlur = theme?.backgroundBlur ?? 0;
  const titleAlign = theme?.headerTitleAlignment || 'left';

  const cardBackdropStyle = {
    backgroundColor: `${cardBg}${Math.round(cardOpacity * 255).toString(16).padStart(2, '0')}`,
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
  };

  // Adaptive sizing helper based on results count for clear TV visibility from afar
  const getResultsSizing = (count: number) => {
    if (count <= 2) {
      return {
        gridClass: 'grid-cols-1 md:grid-cols-2',
        cardPadding: 'p-8 md:p-10 lg:p-12',
        outcomeBanner: 'px-7 py-3 md:px-10 md:py-4 rounded-3xl text-3xl md:text-5xl lg:text-6xl font-black tracking-wider gap-4 shadow-2xl',
        outcomeIcon: 'w-8 h-8 md:w-12 md:h-12',
        categoryDisplay: 'text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-none',
        matchupBox: 'p-6 md:p-8 my-auto rounded-3xl bg-slate-950/80 border-2 border-slate-700/80 shadow-2xl',
        teamName: 'text-2xl md:text-3xl lg:text-4xl font-black tracking-wide leading-tight',
        footerText: 'text-sm md:text-base lg:text-lg text-slate-400 font-semibold mt-4 pt-3 border-t border-slate-800/80',
      };
    }
    if (count === 3) {
      return {
        gridClass: 'grid-cols-1 md:grid-cols-3',
        cardPadding: 'p-6 md:p-8',
        outcomeBanner: 'px-5 py-2.5 md:px-7 md:py-3.5 rounded-2xl text-2xl md:text-3xl lg:text-4xl font-black tracking-wider gap-3 shadow-xl',
        outcomeIcon: 'w-7 h-7 md:w-9 md:h-9',
        categoryDisplay: 'text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none',
        matchupBox: 'p-5 md:p-6 my-auto rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-xl',
        teamName: 'text-xl md:text-2xl lg:text-3xl font-black tracking-wide leading-snug',
        footerText: 'text-xs md:text-sm lg:text-base text-slate-400 mt-3 pt-2.5 border-t border-slate-800/60',
      };
    }
    if (count === 4) {
      return {
        gridClass: 'grid-cols-1 sm:grid-cols-2 grid-rows-2',
        cardPadding: 'p-5 md:p-6',
        outcomeBanner: 'px-4 py-2 md:px-6 md:py-2.5 rounded-2xl text-xl md:text-2xl lg:text-3xl font-black tracking-wider gap-2.5 shadow-lg',
        outcomeIcon: 'w-6 h-6 md:w-7 md:h-7',
        categoryDisplay: 'text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none',
        matchupBox: 'p-4 md:p-5 my-auto rounded-2xl bg-slate-950/80 border border-slate-700/80 shadow-lg',
        teamName: 'text-lg md:text-xl lg:text-2xl font-black tracking-wide',
        footerText: 'text-xs md:text-sm text-slate-400 mt-2.5 pt-2 border-t border-slate-800/60',
      };
    }
    return {
      gridClass: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      cardPadding: 'p-4 md:p-5',
      outcomeBanner: 'px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-lg md:text-xl font-black tracking-wider gap-2 shadow-md',
      outcomeIcon: 'w-5 h-5 md:w-6 md:h-6',
      categoryDisplay: 'text-2xl md:text-3xl lg:text-4xl font-black tracking-tight leading-none',
      matchupBox: 'p-3 md:p-4 my-auto rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-md',
      teamName: 'text-base md:text-lg font-black tracking-wide',
      footerText: 'text-xs text-slate-500 mt-2 pt-2 border-t border-slate-800/60',
    };
  };

  const sizing = getResultsSizing(sortedResults.length);

  const activeStyle = theme?.visualStyle || 'poster-red';

  // Helper pour dimensionner et adapter automatiquement la disposition 16:9 selon le nombre de résultats (jusqu'à 10)
  const getPosterAdaptiveScale = (count: number) => {
    if (count <= 2) {
      return {
        headerSize: 'text-2xl',
        pillHeight: 'min-h-[76px] md:min-h-[82px]',
        pillText: 'text-2xl md:text-3xl',
        centerPill: 'text-2xl md:text-3xl px-6 md:px-8 min-h-[76px] md:min-h-[82px]',
        badgeSize: 'text-sm px-4 py-1',
        badgeIcon: 'w-5 h-5',
      };
    }
    if (count <= 4) {
      return {
        headerSize: 'text-base md:text-lg',
        pillHeight: 'min-h-[60px] md:min-h-[66px]',
        pillText: 'text-xl md:text-2xl',
        centerPill: 'text-xl md:text-2xl px-3.5 md:px-5 min-h-[60px] md:min-h-[66px]',
        badgeSize: 'text-xs md:text-sm px-3 py-1',
        badgeIcon: 'w-4 h-4',
      };
    }
    if (count <= 6) {
      return {
        headerSize: 'text-sm md:text-base',
        pillHeight: 'min-h-[50px] md:min-h-[56px]',
        pillText: 'text-lg md:text-xl',
        centerPill: 'text-lg md:text-xl px-3 md:px-4 min-h-[50px] md:min-h-[56px]',
        badgeSize: 'text-xs px-2.5 py-0.5',
        badgeIcon: 'w-3.5 h-3.5',
      };
    }
    if (count <= 8) {
      return {
        headerSize: 'text-xs md:text-sm',
        pillHeight: 'min-h-[44px] md:min-h-[48px]',
        pillText: 'text-base md:text-lg',
        centerPill: 'text-base md:text-lg px-2.5 md:px-3 min-h-[44px] md:min-h-[48px]',
        badgeSize: 'text-xs px-2.5 py-0.5',
        badgeIcon: 'w-3 h-3',
      };
    }
    // Jusqu'à 10 résultats (5 par colonne)
    return {
      headerSize: 'text-xs',
      pillHeight: 'min-h-[38px] md:min-h-[42px]',
      pillText: 'text-sm md:text-base',
      centerPill: 'text-sm md:text-base px-2 min-h-[38px] md:min-h-[42px]',
      badgeSize: 'text-[11px] px-2 py-0.5',
      badgeIcon: 'w-3 h-3',
    };
  };

  // =========================================================================
  // MODE AFFICHE OFFICIELLE / PASSERELLE RÉSEAUX (Pill Badges 16:9)
  // =========================================================================
  if (activeStyle === 'poster-red') {
    // Tri chronologique rigoureux : dates puis heures
    const sortedResults = [...activeResults].sort(sortMatchesChronologically);
    const scale = getPosterAdaptiveScale(sortedResults.length);

    // Répartition en 2 colonnes verticales s'il y a plus de 2 résultats
    const half = Math.ceil(sortedResults.length / 2);
    const leftResults = sortedResults.length <= 2 ? sortedResults : sortedResults.slice(0, half);
    const rightResults = sortedResults.length <= 2 ? [] : sortedResults.slice(half);

    const renderPosterResultItem = (r: MatchItem) => {
      const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
      const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
      const dateObj = formatMatchDayAndDate(r.date);
      const dayDisplay = dateObj?.display || dateObj?.dayName || '';
      // Heures supprimées des résultats comme demandé
      const dateText = dayDisplay.trim();

      const teamLeft = isHome ? r.category : (r.teamHome || 'Notre Club');
      const teamRight = isHome ? (r.teamAway || 'Adversaire') : r.category;

      return (
        <div key={r.id} className="flex flex-col gap-1 w-full flex-1 justify-center min-h-0 min-w-0">
          {/* Intitulé au-dessus : Date en grand et Icône Maison ou Avion */}
          <div className="flex items-center justify-between gap-2 px-1 w-full min-w-0">
            <div className={`flex items-center gap-2 font-black uppercase tracking-wider text-white ${scale.headerSize} ${getFontFamilyClass(bodyFont)} min-w-0 truncate`}>
              <span className={`drop-shadow-sm tracking-wide text-amber-400 ${getFontFamilyClass(headerFont)} truncate`}>{dateText || 'Match'}</span>
            </div>

            {/* DISTINCTION CLAIRE : MAISON OU AVION VISIBLE SANS PASTILLE */}
            {isHome ? (
              <span
                className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 shadow-md shadow-emerald-500/30 shrink-0"
                title="Match à Domicile"
              >
                <Home className="w-4 h-4 md:w-5 md:h-5 text-emerald-400" />
              </span>
            ) : (
              <span
                className="inline-flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded-full bg-sky-500/20 border border-sky-400/60 text-sky-400 shadow-md shadow-sky-500/30 shrink-0"
                title="Match à l'Extérieur"
              >
                <Plane className="w-4 h-4 md:w-5 md:h-5 text-sky-400 -rotate-45" />
              </span>
            )}
          </div>

          {/* Rangée de Pilules : Équipe Domicile (ou catégorie), Bloc Central [Victoire/Défaite au-dessus du Score], Équipe Extérieur (ou catégorie) */}
          <div className="flex items-center justify-between gap-1.5 md:gap-2.5 w-full min-w-0">
            {/* Pilule Équipe Domicile (À gauche) */}
            <div
              className={`flex-1 min-w-0 font-black uppercase tracking-wider py-1.5 md:py-2 px-2.5 md:px-4 rounded-full shadow-lg text-center flex items-center justify-center ${getFontFamilyClass(headerFont)} ${scale.pillHeight} ${scale.pillText} ${
                isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate block w-full text-center">{teamLeft}</span>
            </div>

            {/* Bloc Central : VICTOIRE / DÉFAITE ET / OU SCORE SELON RESULTDISPLAYMODE */}
            <div className="flex flex-col items-center shrink-0">
              {resultDisplayMode !== 'score' && (
                <span
                  className={`text-[10px] md:text-xs font-black uppercase tracking-wider px-2 md:px-3 py-0.5 rounded-full mb-1 shadow-md flex items-center gap-1 ${getFontFamilyClass(bodyFont)} ${
                    isWin
                      ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-500/20'
                      : 'bg-rose-600 text-white border border-rose-500 shadow-rose-600/30'
                  }`}
                >
                  {isWin ? <CheckCircle2 className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <XCircle className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                  <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
                </span>
              )}

              {resultDisplayMode !== 'status' && (
                <div
                  className={`bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex items-center justify-center rounded-full ${scale.pillHeight} ${scale.centerPill}`}
                >
                  {r.homeScore ?? '-'} &nbsp;-&nbsp; {r.awayScore ?? '-'}
                </div>
              )}
            </div>

            {/* Pilule Équipe Extérieur (À droite) */}
            <div
              className={`flex-1 min-w-0 font-black uppercase tracking-wider py-1.5 md:py-2 px-2.5 md:px-4 rounded-full shadow-lg text-center flex items-center justify-center ${getFontFamilyClass(headerFont)} ${scale.pillHeight} ${scale.pillText} ${
                !isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate block w-full text-center">{teamRight}</span>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none bg-[#111111]">
        {/* Calque 1 : Arrière-plan photo / vidéo */}
        {backgroundUrl && (
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            {isVideoMedia(backgroundUrl) ? (
              <video
                src={backgroundUrl}
                autoPlay
                loop={!bgHasControl || !onVideoEnded}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{ filter: `brightness(${bgBrightness}) blur(${bgBlur}px)` }}
              />
            ) : (
              <img
                src={backgroundUrl}
                alt="Fond visuel"
                className="w-full h-full object-cover"
                style={{ filter: `brightness(${bgBrightness}) blur(${bgBlur}px)` }}
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-slate-950/70 pointer-events-none" />
          </div>
        )}

        {/* Filigrane central Logo du Club (Optionnel, désactivé par défaut) */}
        {theme?.showClubLogoWatermark && clubSettings.logoUrl && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-15">
            <img
              src={clubSettings.logoUrl}
              alt=""
              className="w-[440px] h-[440px] object-contain filter grayscale contrast-200"
              referrerPolicy="no-referrer"
            />
          </div>
        )}

        {/* Rayures Zebra Blancs en bas à droite */}
        <div className="absolute -bottom-4 -right-4 pointer-events-none z-10 flex flex-col gap-1.5 -rotate-45">
          <div className="w-24 h-2.5 bg-white shadow-md" />
          <div className="w-24 h-2.5 bg-white shadow-md" />
          <div className="w-24 h-2.5 bg-white shadow-md" />
        </div>

        {/* CONTENU DE L'AFFICHE (EN TÊTE & GRILLE DES RÉSULTATS ÉTENDUE 16:9) */}
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-4 md:p-6 lg:p-7 xl:p-8">
          
          {/* EN-TÊTE : 6 BARRES ROUGES & PILULE DE TITRE */}
          <div className={`w-full flex flex-col relative shrink-0 ${
            titleAlign === 'center' ? 'items-center' : titleAlign === 'right' ? 'items-end' : 'items-start'
          }`}>
            
            {/* Boutons d'action haut droite (Passerelle Réseaux) */}
            <div className="absolute right-0 top-0 hidden sm:flex items-center gap-2.5">
              {!hideShareButton && (
                <button
                  onClick={onDownloadVisual}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-emerald-600 hover:from-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                  title="Passerelle Réseaux Sociaux : Exporter pour Instagram, TikTok et Facebook"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Passerelle Réseaux</span>
                </button>
              )}
            </div>

            {/* 6 Traits Rouges Inclinés (Signature Graphique) */}
            <div className="flex gap-1.5 transform -skew-x-[25deg] mb-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2 md:w-2.5 h-3 md:h-3.5 bg-red-600 rounded-[1px] shadow-md" />
              ))}
            </div>

            {/* Pastille Pilule de Titre Rouge */}
            <div className={`px-10 py-2 rounded-full bg-red-600 text-white font-black text-2xl uppercase tracking-wider shadow-xl shadow-red-600/30 border border-red-500/50 text-center ${getFontFamilyClass(headerFont)}`}>
              {customHeaderTitle || theme?.customHeaderTitle || (
                sortedResults.length > 0 && sortedResults.every((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? 'LES RÉSULTATS À DOMICILE'
                  : sortedResults.length > 0 && sortedResults.every((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? "LES RÉSULTATS À L'EXTÉRIEUR"
                  : 'RÉSULTATS DU WEEK-END'
              )}
            </div>
          </div>

          {/* LISTE ADAPTATIVE DES RÉSULTATS OCCUPANT TOUT L'ESPACE 16:9 */}
          {sortedResults.length === 0 ? (
            <div className="my-auto text-center py-10 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 max-w-xl mx-auto backdrop-blur-sm">
              <Trophy className="w-10 h-10 text-emerald-400/60 mx-auto mb-2" />
              <h3 className={`text-xl font-black text-white ${getFontFamilyClass(headerFont)}`}>
                AUCUN RÉSULTAT ENREGISTRÉ
              </h3>
              <p className={`text-slate-400 text-xs mt-1 ${getFontFamilyClass(bodyFont)}`}>
                Les résultats apparaîtront dès la fin des rencontres du week-end.
              </p>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-row gap-5 xl:gap-8 my-2 py-0.5 items-stretch min-h-0 min-w-0 overflow-hidden">
              {/* Colonne 1 : Première moitié ordonnée chronologiquement */}
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                {leftResults.map(renderPosterResultItem)}
              </div>

              {/* Colonne 2 : Deuxième moitié ordonnée chronologiquement */}
              {rightResults.length > 0 && (
                <div className="flex-1 min-w-0 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                  {rightResults.map(renderPosterResultItem)}
                </div>
              )}
            </div>
          )}

          {/* Bas de page / Signature Club */}
          <div className={`w-full flex items-center justify-end text-[10px] md:text-xs font-bold text-slate-400/80 uppercase tracking-widest pt-1 shrink-0 ${getFontFamilyClass(bodyFont)}`}>
            <span>SRC BASKET LA CLAYETTE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden">
      {/* ========================================================================= */}
      {/* CALQUE 1 : ARRIÈRE-PLAN (IMAGE OU VIDÉO AVEC FLOU & ASSOMBRISSEMENT) */}
      {/* ========================================================================= */}
      {backgroundUrl && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {isVideoMedia(backgroundUrl) ? (
            <video
              src={backgroundUrl}
              autoPlay
              loop={!bgHasControl || !onVideoEnded}
              muted
              playsInline
              onTimeUpdate={(e) => {
                const vid = e.currentTarget;
                if (bgHasControl && onVideoTimeUpdate && vid.duration) {
                  onVideoTimeUpdate((vid.currentTime / vid.duration) * 100);
                }
              }}
              onEnded={() => {
                if (bgHasControl && onVideoEnded) onVideoEnded();
              }}
              onError={() => {
                if (bgHasControl && onVideoEnded) onVideoEnded();
              }}
              className="w-full h-full object-cover"
              style={{
                filter: `brightness(${bgBrightness}) blur(${bgBlur}px)`,
              }}
            />
          ) : (
            <img
              src={backgroundUrl}
              alt="Support Visuel Résultats"
              className="w-full h-full object-cover"
              style={{
                filter: `brightness(${bgBrightness}) blur(${bgBlur}px)`,
              }}
              referrerPolicy="no-referrer"
            />
          )}
          {bgBrightness < 0.9 && (
            <div
              className="absolute inset-0 bg-slate-950 pointer-events-none"
              style={{ opacity: Math.max(0, 0.65 - bgBrightness * 0.4) }}
            />
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* CALQUE 2 : SECOND PLAN - GRILLE DES SCORES DU CLUB */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-8 lg:p-10 xl:p-12">
        {/* Slide Header */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-4 ${
          titleAlign === 'center' ? 'sm:justify-center text-center' : titleAlign === 'right' ? 'sm:justify-end text-right' : ''
        }`}>
          <div className={titleAlign === 'center' ? 'w-full text-center' : titleAlign === 'right' ? 'w-full text-right' : ''}>
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase ${getFontFamilyClass(headerFont)}`}>
              {customHeaderTitle || theme?.customHeaderTitle || (
                sortedResults.length > 0 && sortedResults.every((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? 'LES RÉSULTATS À DOMICILE'
                  : sortedResults.length > 0 && sortedResults.every((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? "LES RÉSULTATS À L'EXTÉRIEUR"
                  : 'RÉSULTATS DU WEEK-END'
              )}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Passerelle Réseaux Sociaux Button */}
            {!hideShareButton && (
              <button
                onClick={onDownloadVisual}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-emerald-600 hover:from-pink-500 hover:to-emerald-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                id="btn-download-results-visual"
                title="Passerelle Réseaux Sociaux : Exporter pour Instagram, TikTok et Facebook"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Passerelle Réseaux (Insta • TikTok • FB)</span>
                <span className="sm:hidden">Réseaux</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Cards Grid */}
        {sortedResults.length === 0 ? (
          <div className="my-auto text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto backdrop-blur-sm">
            <Trophy className="w-12 h-12 text-emerald-400/60 mx-auto mb-3" />
            <h3 className={`text-2xl font-black text-white ${getFontFamilyClass(headerFont)}`}>
              AUCUN RÉSULTAT ENREGISTRÉ
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Les résultats apparaîtront dès la fin des rencontres du week-end.
            </p>
          </div>
        ) : (
          <div
            className={`grid gap-6 my-4 md:my-6 flex-1 items-stretch overflow-y-auto pr-1 min-h-0 ${sizing.gridClass}`}
          >
            {sortedResults.map((r) => {
              const isWin = isMatchWin(r, clubSettings.name, clubSettings.shortName);
              const isHome = isClubHomeMatch(r, clubSettings.name, clubSettings.shortName);
              const clubShort = (clubSettings?.shortName || '').toLowerCase();
              const clubName = (clubSettings?.name || '').toLowerCase();
              const isHomeTeamClub = clubShort
                ? (r.teamHome || '').toLowerCase().includes(clubShort) || (r.teamHome || '').toLowerCase().includes(clubName)
                : isHome;
              const isAwayTeamClub = clubShort
                ? (r.teamAway || '').toLowerCase().includes(clubShort) || (r.teamAway || '').toLowerCase().includes(clubName)
                : !isHome;

              return (
                <div
                  key={r.id}
                  style={cardBackdropStyle}
                  className={`relative rounded-3xl ${sizing.cardPadding} border shadow-2xl transition-all flex flex-col justify-between overflow-hidden ${
                    isWin
                      ? 'border-emerald-500/60 shadow-emerald-950/40'
                      : 'border-rose-500/60 shadow-rose-950/40'
                  }`}
                >
                  {/* Effet lumineux d'ambiance Victoire / Défaite */}
                  <div
                    className={`absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-25 ${
                      isWin ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                  />

                  {/* Grand Bandeau Haut : VICTOIRE ou DÉFAITE (masqué en mode score seul) */}
                  <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80 relative z-10">
                    {resultDisplayMode !== 'score' ? (
                      <div
                        className={`inline-flex items-center ${sizing.outcomeBanner} ${getFontFamilyClass(headerFont)} uppercase ${
                          isWin
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400/80 shadow-emerald-500/50'
                            : 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white ring-2 ring-rose-400/80 shadow-rose-600/50'
                        }`}
                      >
                        {isWin ? (
                          <Trophy className={`${sizing.outcomeIcon} animate-bounce shrink-0 text-amber-300 drop-shadow`} />
                        ) : (
                          <XCircle className={`${sizing.outcomeIcon} shrink-0 text-white/90`} />
                        )}
                        <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <span className="px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs md:text-sm lg:text-base text-slate-300 font-bold shrink-0">
                      {isHome ? '🏠 Domicile' : '🚗 Extérieur'}
                    </span>
                  </div>

                  {/* Zone Centrale : LA CATÉGORIE EN TRÈS GROS */}
                  <div className="my-auto py-3 text-center flex flex-col items-center justify-center relative z-10">
                    <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-slate-400 mb-1">
                      Catégorie
                    </span>
                    <div
                      className={`${sizing.categoryDisplay} ${getFontFamilyClass(headerFont)} font-black text-transparent bg-clip-text ${
                        isWin
                          ? 'bg-gradient-to-b from-white via-slate-100 to-emerald-200 drop-shadow-[0_2px_12px_rgba(52,211,153,0.3)]'
                          : 'bg-gradient-to-b from-white via-slate-100 to-rose-200 drop-shadow-[0_2px_12px_rgba(244,63,94,0.3)]'
                      }`}
                    >
                      {r.category}
                    </div>

                    {/* Rencontre / Adversaires & Score */}
                    <div className={`w-full mt-3 ${sizing.matchupBox}`}>
                      <div className="flex items-center justify-center gap-3 md:gap-5 flex-wrap">
                        {/* Équipe Domicile avec Logo (Club uniquement) */}
                        <div className="flex items-center gap-2">
                          {isHome && clubSettings.logoUrl && (
                            <img
                              src={clubSettings.logoUrl}
                              alt=""
                              className={`w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow shrink-0 ${theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : ''}`}
                              referrerPolicy="no-referrer"
                            />
                          )}
                          <span
                            className={`${sizing.teamName} ${getFontFamilyClass(headerFont)}`}
                            style={{ color: isHomeTeamClub ? primaryColor : textColor }}
                          >
                            {isHomeTeamClub ? r.category : r.teamHome}
                          </span>
                        </div>

                        {/* Affichage Central (Score ou Statut ou les Deux) */}
                        {resultDisplayMode === 'status' || (r.homeScore === undefined && r.awayScore === undefined) ? (
                          (() => {
                            const hasScore = r.homeScore !== undefined && r.awayScore !== undefined;
                            const hasExplicitResult = r.result === 'win' || r.result === 'loss';
                            const isPending = !hasScore && !hasExplicitResult;
                            const label = isPending ? 'EN ATTENTE' : (isWin ? 'VICTOIRE' : 'DÉFAITE');
                            const bg = isPending ? '#78350f' : (badgeBgColor || (isWin ? '#065f46' : '#9f1239'));
                            const textCol = isPending ? '#fde68a' : (badgeTextColor || '#ffffff');
                            return (
                              <span
                                className="px-3.5 py-1 rounded-full text-xs md:text-sm font-black tracking-wider uppercase shadow-md shrink-0"
                                style={{
                                  backgroundColor: bg,
                                  color: textCol,
                                }}
                              >
                                {label}
                              </span>
                            );
                          })()
                        ) : (
                          <span
                            className="px-4 py-1.5 rounded-2xl text-base md:text-2xl font-mono font-black tracking-wider shadow-lg border border-slate-700/80 shrink-0"
                            style={{
                              backgroundColor: '#090d16',
                              color: isWin ? '#34d399' : '#f43f5e',
                            }}
                          >
                            {r.homeScore} - {r.awayScore}
                          </span>
                        )}

                        {/* Équipe Extérieur avec Logo (Club uniquement) */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`${sizing.teamName} ${getFontFamilyClass(headerFont)}`}
                            style={{ color: isAwayTeamClub ? primaryColor : textColor }}
                          >
                            {isAwayTeamClub ? r.category : r.teamAway}
                          </span>
                          {!isHome && clubSettings.logoUrl && (
                            <img
                              src={clubSettings.logoUrl}
                              alt=""
                              className={`w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow shrink-0 ${theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : ''}`}
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      </div>

                      {r.competition && (
                        <div className="mt-2 text-xs md:text-sm text-slate-400 font-medium truncate">
                          {r.competition}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer info */}
                  <div className={`${sizing.footerText} relative z-10`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-300 truncate">
                        📍 {r.gymnasium || clubSettings.gymnasiumDefault || 'Gymnase'}
                      </span>
                      {r.date && (
                        <span className="font-mono text-slate-400 font-bold tracking-wider shrink-0">
                          🗓️ {r.date.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* CALQUE 3 : PREMIER PLAN - ÉLÉMENT LIBRE 1 (MASCOTTE, LOGO, BADGE, ETC.)  */}
      {/* ========================================================================= */}
      {layer3 ? (
        <FreeOverlayLayer
          layer={layer3}
          layerNumber={3}
          isVictoryContext={hasVictory}
          interactive={isInteractiveOverlay}
          isSelected={selectedLayerNum === 3}
          onSelect={() => onSelectLayer?.(3)}
          onPositionChange={(x, y) => onLayerPositionChange?.(3, x, y)}
          onVideoEnded={layer3HasControl ? onVideoEnded : undefined}
          onVideoTimeUpdate={layer3HasControl ? onVideoTimeUpdate : undefined}
        />
      ) : (
        <ChromaKeyMascot
          mascot={mascot}
          isVictoryContext={hasVictory}
          slideType="results"
          onVideoEnded={mascotHasControl ? onVideoEnded : undefined}
          onVideoTimeUpdate={mascotHasControl ? onVideoTimeUpdate : undefined}
        />
      )}

      {/* ========================================================================= */}
      {/* CALQUE 4 : PREMIER PLAN - ÉLÉMENT LIBRE 2 (IDENTIQUE CALQUE 3)           */}
      {/* ========================================================================= */}
      {layer4 && (
        <FreeOverlayLayer
          layer={layer4}
          layerNumber={4}
          isVictoryContext={hasVictory}
          interactive={isInteractiveOverlay}
          isSelected={selectedLayerNum === 4}
          onSelect={() => onSelectLayer?.(4)}
          onPositionChange={(x, y) => onLayerPositionChange?.(4, x, y)}
          onVideoEnded={layer4HasControl ? onVideoEnded : undefined}
          onVideoTimeUpdate={layer4HasControl ? onVideoTimeUpdate : undefined}
        />
      )}
    </div>
  );
};
