import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Home, Navigation, Plane, CheckCircle2, XCircle, Share2 } from 'lucide-react';
import { MatchItem, ClubSettings, SlideDesignTheme, ForegroundMascotConfig, OverlayLayerItem } from '../../types';
import { isMatchLive, isMatchFinished } from '../../utils/matchStatus';
import { isVideoMedia } from '../../utils/mediaUtils';
import { formatMatchDayAndDate, sortMatchesChronologically } from '../../utils/matchDateHelper';
import { ChromaKeyMascot } from '../ChromaKeyMascot';
import { FreeOverlayLayer } from '../FreeOverlayLayer';
import { getFontFamilyClass } from '../../utils/fontUtils';

interface MatchesSlideProps {
  matches: MatchItem[];
  customHomeMatches?: MatchItem[];
  customAwayMatches?: MatchItem[];
  pageNumber?: number;
  totalPages?: number;
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

export const MatchesSlide: React.FC<MatchesSlideProps> = ({
  matches,
  customHomeMatches,
  customAwayMatches,
  pageNumber,
  totalPages,
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

  // Horloge en temps réel pour actualiser automatiquement le statut "EN COURS"
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000); // vérification toutes les 30 secondes
    return () => clearInterval(timer);
  }, []);

  // Visual Theme resolution
  const primaryColor = theme?.primaryColor || clubSettings.primaryColor || '#ea580c';
  const textColor = theme?.textColor || '#ffffff';
  const badgeBgColor = theme?.badgeBgColor || primaryColor;
  const badgeTextColor = theme?.badgeTextColor || '#ffffff';
  const cardBg = theme?.cardBgColor || '#020617';
  const cardOpacity = theme?.cardOpacity ?? 0.85;
  const cardBlur = theme?.cardBlur ?? 8;
  const headerFont = theme?.fontFamilyHeader || 'Bebas Neue';
  const bodyFont = theme?.fontFamilyBody || 'Montserrat';
  const bgBrightness = theme?.backgroundBrightness ?? 0.35;
  const bgBlur = theme?.backgroundBlur ?? 0;
  const titleAlign = theme?.headerTitleAlignment || 'left';

  const cardBackdropStyle = {
    backgroundColor: `${cardBg}${Math.round(cardOpacity * 255).toString(16).padStart(2, '0')}`,
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
  };

  const getOpponentLogo = (m: MatchItem): string | null => {
    if (m.opponentLogo) return m.opponentLogo;
    const oppName = m.isHomeMatch ? m.teamAway : m.teamHome;
    try {
      const rawCache = localStorage.getItem('club_opponent_logos_cache');
      if (rawCache) {
        const cache = JSON.parse(rawCache);
        if (cache && oppName && cache[oppName]) return cache[oppName];
      }
    } catch (e) {}
    if (m.teamLogo && m.teamLogo !== clubSettings.logoUrl) return m.teamLogo;
    return null;
  };

  // Only display matches that are checked/selected for the weekend (selectedForWeekend !== false)
  const weekendMatches = matches.filter((m) => m.selectedForWeekend !== false);
  const homeMatches = customHomeMatches !== undefined
    ? customHomeMatches
    : weekendMatches.filter((m) => m.isHomeMatch).sort(sortMatchesChronologically);
  const awayMatches = customAwayMatches !== undefined
    ? customAwayMatches
    : weekendMatches.filter((m) => !m.isHomeMatch).sort(sortMatchesChronologically);

  // Adaptive sizing helper: cards automatically expand (flex-1) to fill 100% of vertical height
  const getColumnSizing = (count: number) => {
    if (count <= 1) {
      return {
        containerLayout: 'flex-1 flex flex-col gap-3 min-h-0',
        cardPadding: 'p-6 md:p-8 lg:p-10 rounded-3xl',
        categoryBadge: 'text-base md:text-lg lg:text-xl px-5 py-2 rounded-2xl font-black tracking-wider',
        competitionText: 'text-sm md:text-base lg:text-lg font-bold text-slate-200',
        teamNames: 'text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black tracking-wide leading-tight',
        vsBadge: 'text-xl md:text-2xl lg:text-3xl font-black px-3',
        metaRow: 'mt-4 gap-4 md:gap-6 text-base md:text-lg lg:text-xl',
        metaDateText: 'text-lg md:text-xl lg:text-2xl xl:text-3xl font-black uppercase',
        metaIcon: 'w-5 h-5 md:w-6 md:h-6',
        timeText: 'font-mono font-black text-white text-xl md:text-2xl lg:text-3xl',
        gymnasiumText: 'text-base md:text-lg lg:text-xl font-semibold text-slate-200',
        statusBadge: 'px-5 py-2.5 rounded-2xl text-sm md:text-base lg:text-lg font-black uppercase tracking-wider shadow-lg',
        statusIcon: 'w-5 h-5 md:w-6 md:h-6',
      };
    }
    if (count === 2) {
      return {
        containerLayout: 'flex-1 flex flex-col gap-3 min-h-0',
        cardPadding: 'p-5 md:p-6 lg:p-8 rounded-2xl',
        categoryBadge: 'text-sm md:text-base lg:text-lg px-4 py-1.5 rounded-xl font-black tracking-wider',
        competitionText: 'text-xs md:text-sm lg:text-base font-bold text-slate-200',
        teamNames: 'text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-black tracking-wide leading-tight',
        vsBadge: 'text-lg md:text-xl lg:text-2xl font-black px-2.5',
        metaRow: 'mt-3 gap-3 md:gap-5 text-sm md:text-base lg:text-lg',
        metaDateText: 'text-base md:text-lg lg:text-xl xl:text-2xl font-black uppercase',
        metaIcon: 'w-4 h-4 md:w-5 md:h-5',
        timeText: 'font-mono font-black text-white text-lg md:text-xl lg:text-2xl',
        gymnasiumText: 'text-sm md:text-base lg:text-lg font-semibold text-slate-200',
        statusBadge: 'px-4 py-2 rounded-xl text-xs md:text-sm lg:text-base font-black uppercase tracking-wide shadow-md',
        statusIcon: 'w-4 h-4 md:w-5 md:h-5',
      };
    }
    if (count === 3) {
      return {
        containerLayout: 'flex-1 flex flex-col gap-2.5 min-h-0',
        cardPadding: 'p-4 md:p-5 lg:p-6 rounded-2xl',
        categoryBadge: 'text-xs md:text-sm lg:text-base px-3.5 py-1 rounded-xl font-black tracking-wider',
        competitionText: 'text-xs md:text-sm lg:text-base font-bold text-slate-200 truncate max-w-[340px]',
        teamNames: 'text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black tracking-wide leading-tight',
        vsBadge: 'text-base md:text-lg lg:text-xl font-black px-2',
        metaRow: 'mt-2.5 gap-3 md:gap-4 text-xs md:text-sm lg:text-base',
        metaDateText: 'text-sm md:text-base lg:text-lg xl:text-xl font-black uppercase',
        metaIcon: 'w-4 h-4 md:w-5 md:h-5',
        timeText: 'font-mono font-black text-white text-sm md:text-base lg:text-lg xl:text-xl',
        gymnasiumText: 'text-xs md:text-sm lg:text-base font-semibold text-slate-200',
        statusBadge: 'px-4 py-1.5 rounded-xl text-xs md:text-sm lg:text-base font-black uppercase tracking-wide shadow-md',
        statusIcon: 'w-4 h-4 md:w-5 md:h-5',
      };
    }
    // 4 matches
    return {
      containerLayout: 'flex-1 flex flex-col gap-2 min-h-0',
      cardPadding: 'p-3 md:p-4 lg:p-4.5 rounded-xl',
      categoryBadge: 'text-xs md:text-sm lg:text-base px-3 py-1 rounded-lg font-black tracking-wider',
      competitionText: 'text-xs md:text-sm font-bold text-slate-200 truncate max-w-[280px]',
      teamNames: 'text-lg md:text-xl lg:text-2xl xl:text-3xl font-black tracking-wide leading-tight',
      vsBadge: 'text-sm md:text-base lg:text-lg font-black px-1.5',
      metaRow: 'mt-2 gap-2.5 md:gap-3.5 text-xs md:text-sm lg:text-base',
      metaDateText: 'text-xs md:text-sm lg:text-base xl:text-lg font-black uppercase',
      metaIcon: 'w-3.5 h-3.5 md:w-4 md:h-4',
      timeText: 'font-mono font-black text-white text-xs md:text-sm lg:text-base xl:text-lg',
      gymnasiumText: 'text-xs md:text-sm lg:text-base font-semibold text-slate-200',
      statusBadge: 'px-3 py-1 rounded-lg text-xs md:text-sm font-black uppercase tracking-wide shadow-sm',
      statusIcon: 'w-3.5 h-3.5 md:w-4 md:h-4',
    };
  };

  const homeSizing = getColumnSizing(homeMatches.length);
  const awaySizing = getColumnSizing(awayMatches.length);

  const activeStyle = theme?.visualStyle || 'poster-red';

  // Helper pour dimensionner et adapter automatiquement la disposition 16:9 selon le nombre de matchs (jusqu'à 10)
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
    // Jusqu'à 10 matchs (5 par colonne)
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
    const allMatches = customHomeMatches !== undefined && customAwayMatches !== undefined
      ? [...customHomeMatches, ...customAwayMatches]
      : weekendMatches;
    // Tri chronologique rigoureux : dates puis heures
    const sortedMatches = [...allMatches].sort(sortMatchesChronologically);
    const scale = getPosterAdaptiveScale(sortedMatches.length);

    // Répartition en 2 colonnes verticales s'il y a plus de 2 matchs
    const half = Math.ceil(sortedMatches.length / 2);
    const leftMatches = sortedMatches.length <= 2 ? sortedMatches : sortedMatches.slice(0, half);
    const rightMatches = sortedMatches.length <= 2 ? [] : sortedMatches.slice(half);

    const renderPosterMatchItem = (m: MatchItem) => {
      const isHome = Boolean(m.isHomeMatch);
      const dateObj = formatMatchDayAndDate(m.date);
      const dayDisplay = dateObj?.display || dateObj?.dayName || '';
      const timeDisplay = m.time ? ` à ${m.time}` : '';
      const dateTimeText = `${dayDisplay}${timeDisplay}`.trim();

      return (
        <div key={m.id} className="flex flex-col gap-1 w-full flex-1 justify-center min-h-0">
          {/* Intitulé au-dessus : Catégorie • Date & Heure • Badge Domicile / Extérieur distinct */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className={`flex items-center gap-2 font-black uppercase font-montserrat tracking-wider text-white ${scale.headerSize}`}>
              <span className="drop-shadow-sm font-bebas tracking-wide text-2xl text-amber-400">{m.category}</span>
              {dateTimeText && (
                <>
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-200 text-sm font-semibold">{dateTimeText}</span>
                </>
              )}
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

          {/* Rangée de Pilules : Notre Club en ROUGE OFFICIEL, Adversaire en ANTHRACITE CONTRASTÉ */}
          <div className="flex items-center justify-between gap-2 md:gap-3 w-full">
            {/* Pilule Équipe Domicile (À gauche) */}
            <div
              className={`flex-1 font-black uppercase tracking-wider py-1.5 md:py-2 px-3 md:px-5 rounded-full shadow-lg text-center truncate flex items-center justify-center font-bebas ${scale.pillHeight} ${scale.pillText} ${
                isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate">{m.teamHome}</span>
            </div>

            {/* Pilule Centrale Blanche (Heure / VS) */}
            <div
              className={`shrink-0 bg-white text-slate-950 font-mono font-black shadow-xl text-center border-2 border-white flex items-center justify-center rounded-full ${scale.pillHeight} ${scale.centerPill}`}
            >
              {m.time || 'VS'}
            </div>

            {/* Pilule Équipe Extérieur (À droite) */}
            <div
              className={`flex-1 font-black uppercase tracking-wider py-1.5 md:py-2 px-3 md:px-5 rounded-full shadow-lg text-center truncate flex items-center justify-center font-bebas ${scale.pillHeight} ${scale.pillText} ${
                !isHome
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 text-white ring-2 ring-red-400/80 shadow-red-600/40 border border-red-500'
                  : 'bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-black/40'
              }`}
            >
              <span className="truncate">{m.teamAway}</span>
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

        {/* CONTENU DE L'AFFICHE (EN TÊTE & GRILLE DES MATCHS ÉTENDUE 16:9) */}
        <div className="relative z-20 w-full h-full flex flex-col justify-between p-4 md:p-6 lg:p-7 xl:p-8">
          
          {/* EN-TÊTE : 6 BARRES ROUGES & PILULE DE TITRE */}
          <div className={`w-full flex flex-col relative shrink-0 ${
            titleAlign === 'center' ? 'items-center' : titleAlign === 'right' ? 'items-end' : 'items-start'
          }`}>
            
            {/* Boutons d'action haut droite (Passerelle Réseaux) */}
            {!hideShareButton && (
              <div className="absolute right-0 top-0 hidden sm:flex items-center gap-2.5">
                <button
                  onClick={onDownloadVisual}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
                  title="Passerelle Réseaux Sociaux : Exporter pour Instagram, TikTok et Facebook"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Passerelle Réseaux</span>
                </button>
              </div>
            )}

            {/* 6 Traits Rouges Inclinés (Signature Graphique) */}
            <div className="flex gap-1.5 transform -skew-x-[25deg] mb-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-2 md:w-2.5 h-3 md:h-3.5 bg-red-600 rounded-[1px] shadow-md" />
              ))}
            </div>

            {/* Pastille Pilule de Titre Rouge */}
            <div className="px-10 py-2 rounded-full bg-red-600 text-white font-black text-2xl uppercase tracking-wider shadow-xl shadow-red-600/30 border border-red-500/50 font-bebas text-center">
              {customHeaderTitle || theme?.customHeaderTitle || (
                sortedMatches.length > 0 && sortedMatches.every((m) => m.isHomeMatch)
                  ? 'LES RENCONTRES À DOMICILE'
                  : sortedMatches.length > 0 && sortedMatches.every((m) => !m.isHomeMatch)
                  ? "LES RENCONTRES À L'EXTÉRIEUR"
                  : 'LES RENCONTRES DU WEEK-END'
              )}
            </div>
          </div>

          {/* LISTE ADAPTATIVE DES MATCHS OCCUPANT TOUT L'ESPACE 16:9 */}
          {sortedMatches.length === 0 ? (
            <div className="my-auto text-center py-10 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 max-w-xl mx-auto backdrop-blur-sm">
              <Calendar className="w-10 h-10 text-orange-400/60 mx-auto mb-2" />
              <h3 className="text-xl font-black text-white font-bebas">
                AUCUNE RENCONTRE CE WEEK-END
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-montserrat">
                Le calendrier sera mis à jour dès la programmation des prochains matchs.
              </p>
            </div>
          ) : (
            <div className="w-full flex-1 flex flex-row gap-8 xl:gap-10 my-2 py-0.5 items-stretch min-h-0">
              {/* Colonne 1 : Première moitié ordonnée chronologiquement */}
              <div className="flex-1 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                {leftMatches.map(renderPosterMatchItem)}
              </div>

              {/* Colonne 2 : Deuxième moitié ordonnée chronologiquement */}
              {rightMatches.length > 0 && (
                <div className="flex-1 flex flex-col justify-between h-full gap-2 md:gap-3 min-h-0">
                  {rightMatches.map(renderPosterMatchItem)}
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
      {/* CALQUE 1 : ARRIÈRE-PLAN (IMAGE OU VIDÉO AVEC RÉGLAGES DE FLOU & OPACITÉ) */}
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
              alt="Support Visuel Matchs"
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
      {/* CALQUE 2 : SECOND PLAN - DONNÉES DYNAMIQUES DU CLUB (MATCHS & HEURES) */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-4 md:p-6 lg:p-7 xl:p-8">
        {/* Slide Header */}
        <div className={`flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800/80 pb-2 md:pb-3 ${
          titleAlign === 'center' ? 'sm:justify-center text-center' : titleAlign === 'right' ? 'sm:justify-end text-right' : ''
        }`}>
          <div className={`flex items-center gap-3 ${titleAlign === 'center' ? 'w-full justify-center text-center' : titleAlign === 'right' ? 'w-full justify-end text-right' : ''}`}>
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase ${getFontFamilyClass(headerFont)}`}>
              {customHeaderTitle || theme?.customHeaderTitle || 'LES RENCONTRES DU WEEK-END'}
            </h2>
            {totalPages && totalPages > 1 && (
              <span
                className="px-3.5 py-1 rounded-full text-xs md:text-sm font-black font-mono tracking-wider border shadow-md"
                style={{
                  backgroundColor: `${primaryColor}30`,
                  color: primaryColor,
                  borderColor: `${primaryColor}70`,
                }}
              >
                PAGE {pageNumber || 1} / {totalPages}
              </span>
            )}
          </div>

          {/* Passerelle Réseaux Sociaux Button */}
          {!hideShareButton && (
            <button
              onClick={onDownloadVisual}
              className="self-start sm:self-center px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-orange-600 hover:from-pink-500 hover:to-orange-500 text-white font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg shadow-pink-600/20 transition-all hover:scale-105"
              id="btn-download-matches-visual"
              title="Passerelle Réseaux Sociaux : Générer pour Instagram, TikTok et Facebook"
            >
              <Share2 className="w-4 h-4" />
              <span>Passerelle Réseaux (Insta • TikTok • FB)</span>
            </button>
          )}
        </div>

        {/* Main Grid: Domicile vs Extérieur */}
        {weekendMatches.length === 0 ? (
          <div className="my-auto text-center py-16 bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-xl mx-auto backdrop-blur-sm">
            <Calendar className="w-12 h-12 text-orange-400/60 mx-auto mb-3" />
            <h3 className={`text-2xl font-black text-white ${getFontFamilyClass(headerFont)}`}>
              AUCUN MATCH SÉLECTIONNÉ POUR CE WEEK-END
            </h3>
            <p className="text-slate-400 text-sm mt-1">
              Dans le panneau de configuration (onglet Matchs), cochez les rencontres que vous souhaitez afficher sur l'écran TV.
            </p>
          </div>
        ) : (
          (() => {
            const renderHomeCol = homeMatches.length > 0 && theme?.matchDisplayScope !== 'away';
            const renderAwayCol = awayMatches.length > 0 && theme?.matchDisplayScope !== 'home';
            const gridColsClass = renderHomeCol && renderAwayCol ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1';

            return (
              <div className={`grid ${gridColsClass} gap-4 lg:gap-6 my-2 md:my-3 flex-1 items-stretch min-h-0`}>
                {/* DOMICILE COLUMN */}
                {renderHomeCol && (
                  <div
                    style={cardBackdropStyle}
                    className="border border-slate-800/90 rounded-2xl p-3.5 md:p-4 lg:p-5 shadow-xl flex flex-col h-full min-h-0"
                  >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div
                    className="p-1.5 md:p-2 rounded-xl text-white shadow-md"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Home className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-xl lg:text-2xl font-black uppercase text-white ${getFontFamilyClass(headerFont)}`}>
                      À DOMICILE • {clubSettings.gymnasiumDefault}
                    </h3>
                  </div>
                </div>
                <span
                  className="px-3 py-0.5 rounded-full text-xs md:text-sm font-bold font-mono border"
                  style={{
                    backgroundColor: `${primaryColor}25`,
                    color: primaryColor,
                    borderColor: `${primaryColor}50`,
                  }}
                >
                  {homeMatches.length} Matchs
                </span>
              </div>

              <div className={homeSizing.containerLayout}>
                {homeMatches.length === 0 ? (
                  <div className="my-auto text-center py-8 text-slate-500 text-base md:text-lg">
                    Aucun match à domicile ce weekend
                  </div>
                ) : (
                  homeMatches.map((m) => {
                    const isLive = isMatchLive(m, currentTime);
                    const isFinished = isMatchFinished(m, currentTime);
                    const isWin = m.result === 'win';
                    const clubShort = (clubSettings?.shortName || '').toLowerCase();
                    const isClubHome = clubShort ? (m.teamHome || '').toLowerCase().includes(clubShort) : false;
                    const isClubAway = clubShort ? (m.teamAway || '').toLowerCase().includes(clubShort) : false;
                    const dateInfo = formatMatchDayAndDate(m.date);

                    return (
                      <div
                        key={m.id}
                        className={`relative flex-1 min-h-0 ${homeSizing.cardPadding} border shadow-lg transition-all flex flex-col justify-between ${
                          isFinished
                            ? isWin
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                              : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                          <span
                            className={`${homeSizing.categoryBadge} ${getFontFamilyClass(headerFont)}`}
                            style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                          >
                            {m.category}
                          </span>
                          <span className={`${homeSizing.competitionText} ${getFontFamilyClass(bodyFont)}`} style={{ color: textColor }}>{m.competition}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 my-auto">
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center gap-2 flex-wrap ${homeSizing.teamNames} ${getFontFamilyClass(headerFont)}`}>
                              {/* Équipe Domicile */}
                              {(() => {
                                const logo = isClubHome ? clubSettings.logoUrl : getOpponentLogo(m);
                                const logoClass = theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : '';
                                return logo ? (
                                  <img src={logo} alt="" className={`w-7 h-7 md:w-9 md:h-9 object-contain inline-block shrink-0 drop-shadow-md ${logoClass}`} referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">🏀</div>
                                );
                              })()}
                              <span style={{ color: isClubHome ? primaryColor : textColor }}>
                                {m.teamHome}
                              </span>
                              <span className={homeSizing.vsBadge} style={{ color: primaryColor }}>
                                VS
                              </span>
                              {/* Équipe Extérieur */}
                              {(() => {
                                const logo = isClubAway ? clubSettings.logoUrl : getOpponentLogo(m);
                                const logoClass = theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : '';
                                return logo ? (
                                  <img src={logo} alt="" className={`w-7 h-7 md:w-9 md:h-9 object-contain inline-block shrink-0 drop-shadow-md ${logoClass}`} referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">🏀</div>
                                );
                              })()}
                              <span style={{ color: isClubAway ? primaryColor : textColor }}>
                                {m.teamAway}
                              </span>
                            </div>
                            <div className={`flex items-center flex-wrap ${homeSizing.metaRow}`}>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Calendar className={`${homeSizing.metaIcon} shrink-0`} style={{ color: primaryColor }} />
                                <span className={`font-black uppercase ${homeSizing.metaDateText} ${getFontFamilyClass(headerFont)}`} style={{ color: primaryColor }}>
                                  {dateInfo.display}
                                </span>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Clock className={`${homeSizing.metaIcon} text-slate-400 shrink-0`} />
                                <span className={homeSizing.timeText}>
                                  {m.time}
                                </span>
                              </span>
                              {m.gymnasium && (
                                <>
                                  <span className="text-slate-600 hidden sm:inline">•</span>
                                  <span className={`flex items-center gap-1.5 text-slate-200 ${homeSizing.gymnasiumText} truncate`}>
                                    <MapPin className={`${homeSizing.metaIcon} text-slate-400 shrink-0`} />
                                    <span>{m.gymnasium}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {isLive ? (
                              <div className={`${homeSizing.statusBadge} bg-red-600/90 text-white animate-pulse flex items-center gap-2 border border-red-400/50`}>
                                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                <span>EN DIRECT</span>
                              </div>
                            ) : isFinished ? (
                              m.homeScore !== undefined && m.awayScore !== undefined ? (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm md:text-base lg:text-lg border ${
                                  isWin ? 'bg-emerald-900/60 border-emerald-500/60 text-emerald-300' : 'bg-rose-900/60 border-rose-500/60 text-rose-300'
                                }`}>
                                  {isWin ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  <span>{m.homeScore} - {m.awayScore}</span>
                                </div>
                              ) : (
                                <div className={`${homeSizing.statusBadge} ${isWin ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                  {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                                </div>
                              )
                            ) : (
                              <div className={`${homeSizing.statusBadge} bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-2`}>
                                <Clock className={homeSizing.statusIcon} />
                                <span>À venir</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

            {/* EXTÉRIEUR COLUMN */}
            {renderAwayCol && (
              <div
                style={cardBackdropStyle}
                className="border border-slate-800/90 rounded-2xl p-3.5 md:p-4 lg:p-5 shadow-xl flex flex-col h-full min-h-0"
              >
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 md:p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    <Plane className="w-4 h-4 md:w-5 md:h-5" />
                  </div>
                  <div>
                    <h3 className={`text-lg md:text-xl lg:text-2xl font-black uppercase text-white ${getFontFamilyClass(headerFont)}`}>
                      À L'EXTÉRIEUR
                    </h3>
                  </div>
                </div>
                <span className="px-3 py-0.5 rounded-full bg-blue-500/15 text-blue-300 text-xs md:text-sm font-bold font-mono">
                  {awayMatches.length} Matchs
                </span>
              </div>

              <div className={awaySizing.containerLayout}>
                {awayMatches.length === 0 ? (
                  <div className="my-auto text-center py-8 text-slate-500 text-base md:text-lg">
                    Aucun match à l'extérieur ce weekend
                  </div>
                ) : (
                  awayMatches.map((m) => {
                    const isLive = isMatchLive(m, currentTime);
                    const isFinished = isMatchFinished(m, currentTime);
                    const isWin = m.result === 'win';
                    const clubShort = (clubSettings?.shortName || '').toLowerCase();
                    const isClubHome = clubShort ? (m.teamHome || '').toLowerCase().includes(clubShort) : false;
                    const isClubAway = clubShort ? (m.teamAway || '').toLowerCase().includes(clubShort) : false;
                    const dateInfo = formatMatchDayAndDate(m.date);

                    return (
                      <div
                        key={m.id}
                        className={`relative flex-1 min-h-0 ${awaySizing.cardPadding} border shadow-lg transition-all flex flex-col justify-between ${
                          isFinished
                            ? isWin
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-50'
                              : 'bg-rose-950/40 border-rose-500/50 text-rose-50'
                            : 'bg-slate-950/70 border-slate-800/90 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800/60">
                          <span
                            className={`${awaySizing.categoryBadge} ${getFontFamilyClass(headerFont)}`}
                            style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                          >
                            {m.category}
                          </span>
                          <span className={`${awaySizing.competitionText} ${getFontFamilyClass(bodyFont)}`} style={{ color: textColor }}>{m.competition}</span>
                        </div>

                        <div className="flex items-center justify-between gap-4 my-auto">
                          <div className="flex-1 min-w-0">
                            <div className={`flex items-center gap-2 flex-wrap ${awaySizing.teamNames} ${getFontFamilyClass(headerFont)}`}>
                              {/* Équipe Domicile */}
                              {(() => {
                                const logo = isClubHome ? clubSettings.logoUrl : getOpponentLogo(m);
                                const logoClass = theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : '';
                                return logo ? (
                                  <img src={logo} alt="" className={`w-7 h-7 md:w-9 md:h-9 object-contain inline-block shrink-0 drop-shadow-md ${logoClass}`} referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">🏀</div>
                                );
                              })()}
                              <span style={{ color: isClubHome ? primaryColor : textColor }}>
                                {m.teamHome}
                              </span>
                              <span className={awaySizing.vsBadge} style={{ color: primaryColor }}>
                                VS
                              </span>
                              {/* Équipe Extérieur */}
                              {(() => {
                                const logo = isClubAway ? clubSettings.logoUrl : getOpponentLogo(m);
                                const logoClass = theme?.removeWhiteBgLogos !== false ? 'mix-blend-multiply bg-white/10 rounded-full p-0.5' : '';
                                return logo ? (
                                  <img src={logo} alt="" className={`w-7 h-7 md:w-9 md:h-9 object-contain inline-block shrink-0 drop-shadow-md ${logoClass}`} referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-slate-800/80 border border-slate-700/80 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0">🏀</div>
                                );
                              })()}
                              <span style={{ color: isClubAway ? primaryColor : textColor }}>
                                {m.teamAway}
                              </span>
                            </div>
                            <div className={`flex items-center flex-wrap ${awaySizing.metaRow}`}>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Calendar className={`${awaySizing.metaIcon} text-blue-400 shrink-0`} />
                                <span className={`font-black uppercase ${awaySizing.metaDateText} text-blue-300 ${getFontFamilyClass(headerFont)}`}>
                                  {dateInfo.display}
                                </span>
                              </span>
                              <span className="text-slate-600">•</span>
                              <span className="flex items-center gap-1.5 shrink-0">
                                <Clock className={`${awaySizing.metaIcon} text-slate-400 shrink-0`} />
                                <span className={awaySizing.timeText}>
                                  {m.time}
                                </span>
                              </span>
                              {m.city && (
                                <>
                                  <span className="text-slate-600 hidden sm:inline">•</span>
                                  <span className={`flex items-center gap-1.5 text-slate-200 ${awaySizing.gymnasiumText} truncate`}>
                                    <MapPin className={`${awaySizing.metaIcon} text-slate-400 shrink-0`} />
                                    <span>{m.city}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {isLive ? (
                              <div className={`${awaySizing.statusBadge} bg-red-600/90 text-white animate-pulse flex items-center gap-2 border border-red-400/50`}>
                                <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                                <span>EN DIRECT</span>
                              </div>
                            ) : isFinished ? (
                              m.homeScore !== undefined && m.awayScore !== undefined ? (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-sm md:text-base lg:text-lg border ${
                                  isWin ? 'bg-emerald-900/60 border-emerald-500/60 text-emerald-300' : 'bg-rose-900/60 border-rose-500/60 text-rose-300'
                                }`}>
                                  {isWin ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                  <span>{m.homeScore} - {m.awayScore}</span>
                                </div>
                              ) : (
                                <div className={`${awaySizing.statusBadge} ${isWin ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                  {isWin ? 'VICTOIRE' : 'DÉFAITE'}
                                </div>
                              )
                            ) : (
                              <div className={`${awaySizing.statusBadge} bg-slate-800/90 border border-slate-700 text-slate-300 flex items-center gap-2`}>
                                <Clock className={awaySizing.statusIcon} />
                                <span>À venir</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      );
    })()
  )}
</div>

      {/* ========================================================================= */}
      {/* CALQUE 3 : PREMIER PLAN - ÉLÉMENT LIBRE 1 (MASCOTTE, LOGO, BADGE, ETC.)  */}
      {/* ========================================================================= */}
      {layer3 ? (
        <FreeOverlayLayer
          layer={layer3}
          layerNumber={3}
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
          slideType="matches"
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
