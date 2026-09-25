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
  // Only display results that are checked/selected for the weekend (selectedForWeekend !== false)
  const weekendResults = results.filter((r) => r.selectedForWeekend !== false);
  const activeResults = weekendResults.length > 0 ? weekendResults : results;
  const sortedResults = [...activeResults].sort(sortMatchesChronologically);

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
        pillHeight: 'min-h-[86px]',
        pillText: 'text-4xl',
        centerPill: 'text-4xl px-8 min-h-[86px]',
        badgeSize: 'text-sm px-4 py-1',
        badgeIcon: 'w-5 h-5',
      };
    }
    if (count <= 4) {
      return {
        headerSize: 'text-xl',
        pillHeight: 'min-h-[76px]',
        pillText: 'text-3xl',
        centerPill: 'text-3xl px-6 min-h-[76px]',
        badgeSize: 'text-sm px-3.5 py-1',
        badgeIcon: 'w-4 h-4',
      };
    }
    if (count <= 6) {
      return {
        headerSize: 'text-lg',
        pillHeight: 'min-h-[64px]',
        pillText: 'text-2xl',
        centerPill: 'text-2xl px-5 min-h-[64px]',
        badgeSize: 'text-sm px-3 py-0.5',
        badgeIcon: 'w-3.5 h-3.5',
      };
    }
    if (count <= 8) {
      return {
        headerSize: 'text-base',
        pillHeight: 'min-h-[54px]',
        pillText: 'text-xl',
        centerPill: 'text-xl px-4 min-h-[54px]',
        badgeSize: 'text-xs px-2.5 py-0.5',
        badgeIcon: 'w-3 h-3',
      };
    }
    // Jusqu'à 10 résultats (5 par colonne)
    return {
      headerSize: 'text-xs',
      pillHeight: 'min-h-[48px]',
      pillText: 'text-lg',
      centerPill: 'text-lg px-3.5 min-h-[48px]',
      badgeSize: 'text-[11px] px-2 py-0.5',
      badgeIcon: 'w-3 h-3',
    };
  };

  // =========================================================================
  // MODE AFFICHE OFFICIELLE / PASSERELLE RÉSEAUX (Pill Badges 16:9)
  // =========================================================================
  if (activeStyle === 'poster-red') {
    // Tri chronologique rigoureux : dates puis heures
    const sortedResults = [...results].sort(sortMatchesChronologically);
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

      return (
        <div key={r.id} className="flex flex-col gap-1 w-full flex-1 justify-center min-h-0">
          {/* Intitulé au-dessus : Catégorie • Date (sans heure) et Icône Maison ou Avion */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className={`flex items-center gap-2 font-black uppercase font-montserrat tracking-wider text-white ${scale.headerSize}`}>
              <span className="drop-shadow-sm font-bebas tracking-wide text-2xl text-amber-400">{r.category}</span>
              {dateText ? (
                <>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-200 text-sm font-semibold">{dateText}</span>
                </>
              ) : r.competition ? (
                <>
                  <span className="text-slate-500 text-xs hidden sm:inline">•</span>
                  <span className="text-slate-400 text-xs font-normal truncate max-w-[150px] hidden sm:inline">{r.competition}</span>
                </>
              ) : null}
            </div>

            {/* DISTINCTION CLAIRE : MAISON OU AVION VISIBLE SANS PASTILLE */}
            {isHome ? (
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-400 shadow-md shadow-emerald-500/30 shrink-0"
                title="Match à Domicile"
              >
                <Home className="w-5 h-5 text-emerald-400" />
              </span>
            ) : (
              <span
                className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sky-500/20 border border-sky-400/60 text-sky-400 shadow-md shadow-sky-500/30 shrink-0"
                title="Match à l'Extérieur"
              >
                <Plane className="w-5 h-5 text-sky-400 -rotate-45" />
              </span>
            )}
          </div>

          {/* Rangée de Pilules : Équipe Domicile, Bloc Central [Victoire/Défaite au-dessus du Score], Équipe Extérieur */}
          <div className="flex items-center justify-between gap-2 md:gap-3 w-full">
            {/* Pilule Équipe Domicile (À gauche) */}
            <div
              className={`flex-1 font-black uppercase tracking-wider py-1.5 md:py-2 px-3 md:px-5 rounded-full shadow-lg text-center truncate flex items-center justify-center font-bebas ${scale.pillHeight} ${scale.pillText} ${
                isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate">{r.teamHome}</span>
            </div>

            {/* Bloc Central : VICTOIRE / DÉFAITE AU-DESSUS DU SCORE */}
            <div className="flex flex-col items-center shrink-0">
              <span
                className={`text-xs font-black uppercase tracking-wider px-3 py-0.5 rounded-full mb-1 shadow-md flex items-center gap-1.5 ${
                  isWin
                    ? 'bg-emerald-500 text-slate-950 border border-emerald-400 shadow-emerald-500/20'
                    : 'bg-rose-600 text-white border border-rose-500 shadow-rose-600/30'
                }`}
              >
                {isWin ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                <span>{isWin ? 'VICTOIRE' : 'DÉFAITE'}</span>
              </span>

              {/* Pilule Centrale Blanche (Score) */}
              <div
                className={`bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex items-center justify-center rounded-full ${scale.pillHeight} ${scale.centerPill}`}
              >
                {r.homeScore ?? '-'} &nbsp;-&nbsp; {r.awayScore ?? '-'}
              </div>
            </div>

            {/* Pilule Équipe Extérieur (À droite) */}
            <div
              className={`flex-1 font-black uppercase tracking-wider py-1.5 md:py-2 px-3 md:px-5 rounded-full shadow-lg text-center truncate flex items-center justify-center font-bebas ${scale.pillHeight} ${scale.pillText} ${
                !isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate">{r.teamAway}</span>
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
          <div className="w-full flex flex-col items-center relative shrink-0">
            
            {/* Boutons d'action haut droite (Passerelle Réseaux) */}
            <div className="absolute right-0 top-0 hidden sm:flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-xl shadow-md text-xs">
                <span className="text-emerald-400 font-black">{totalWins} Victoires</span>
                <span className="text-slate-700">|</span>
                <span className="text-rose-400 font-black">{totalLosses} Défaites</span>
              </div>
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
            <div className="px-10 py-2 rounded-full bg-red-600 text-white font-black text-2xl uppercase tracking-wider shadow-xl shadow-red-600/30 border border-red-500/50 font-bebas text-center">
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
              <h3 className="text-xl font-black text-white font-bebas">
                AUCUN RÉSULTAT ENREGISTRÉ
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-montserrat">
                Les résultats apparaîtront dès la fin des rencontres du week-end.
              </p>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-row gap-8 xl:gap-10 my-2 py-0.5 items-stretch min-h-0">
              {/* Colonne 1 : Première moitié ordonnée chronologiquement */}
              <div className="flex-1 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                {leftResults.map(renderPosterResultItem)}
              </div>

              {/* Colonne 2 : Deuxième moitié ordonnée chronologiquement */}
              {rightResults.length > 0 && (
                <div className="flex-1 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                  {rightResults.map(renderPosterResultItem)}
                </div>
              )}
            </div>
          )}

          {/* Bas de page / Signature Club */}
          <div className="w-full flex items-center justify-end text-[10px] md:text-xs font-bold text-slate-400/80 font-montserrat uppercase tracking-widest pt-1 shrink-0">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase ${getFontFamilyClass(headerFont)}`}>
              {customHeaderTitle || theme?.customHeaderTitle || 'RÉSULTATS DU WEEK-END'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Weekend Summary Pill */}
            <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl">
              <div className="flex items-center gap-1.5 text-emerald-400 font-black text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>{totalWins} Victoires</span>
              </div>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1.5 text-rose-400 font-black text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>{totalLosses} Défaites</span>
              </div>
            </div>

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

                  {/* Grand Bandeau Haut : VICTOIRE ou DÉFAITE ou SCORE */}
                  <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80 relative z-10">
                    {resultDisplayMode !== 'score' || (r.homeScore === undefined && r.awayScore === undefined) ? (
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
                      <div
                        className={`inline-flex items-center ${sizing.outcomeBanner} ${getFontFamilyClass(headerFont)} uppercase tracking-wider text-white font-black shadow-md`}
                        style={{
                          background: `linear-gradient(135deg, ${badgeBgColor} 0%, ${badgeBgColor}dd 100%)`,
                          color: badgeTextColor,
                        }}
                      >
                        <span>SCORE : {r.homeScore} - {r.awayScore}</span>
                      </div>
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
                        <div className="flex items-center gap-2">
                          {r.isHomeMatch && clubSettings.logoUrl && (
                            <img src={clubSettings.logoUrl} alt="" className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow" referrerPolicy="no-referrer" />
                          )}
                          <span
                            className={`${sizing.teamName} ${getFontFamilyClass(headerFont)} ${
                              (r.teamHome || '').toLowerCase().includes((clubSettings?.shortName || '').toLowerCase()) || r.isHomeMatch
                                ? 'text-orange-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {r.teamHome}
                          </span>
                        </div>

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
                                className="px-3.5 py-1 rounded-full text-xs md:text-sm font-black tracking-wider uppercase shadow-md"
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
                            className="px-4 py-1.5 rounded-2xl text-base md:text-2xl font-mono font-black tracking-wider shadow-lg border border-slate-700/80"
                            style={{
                              backgroundColor: '#090d16',
                              color: isWin ? '#34d399' : '#f43f5e',
                            }}
                          >
                            {r.homeScore} - {r.awayScore}
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {!r.isHomeMatch && clubSettings.logoUrl && (
                            <img src={clubSettings.logoUrl} alt="" className="w-6 h-6 md:w-8 md:h-8 object-contain drop-shadow" referrerPolicy="no-referrer" />
                          )}
                          <span
                            className={`${sizing.teamName} ${getFontFamilyClass(headerFont)} ${
                              (r.teamAway || '').toLowerCase().includes((clubSettings?.shortName || '').toLowerCase()) || !r.isHomeMatch
                                ? 'text-orange-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {r.teamAway}
                          </span>
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
