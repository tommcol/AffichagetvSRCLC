import { VisualThemePosterRedSection } from '../posterSections/VisualThemePosterRedSection';
import { getClubFirstMatchPresentation } from '../../utils/clubFirstMatchPresentation';
import React from 'react';
import { Trophy, CheckCircle2, XCircle, Share2, Home, Plane, Clock } from 'lucide-react';
import { MatchItem, ClubSettings, SlideDesignTheme, ForegroundMascotConfig, OverlayLayerItem } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { isMatchWin, isClubHomeMatch, getMatchOutcome } from '../../utils/matchStatus';
import { sortMatchesChronologically } from '../../utils/matchDateHelper';
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

  const getOpponentLogo = (r: MatchItem): null => null;

  const totalWins = sortedResults.filter((r) => getMatchOutcome(r, clubSettings.name, clubSettings.shortName) === 'win').length;
  const totalLosses = sortedResults.filter((r) => getMatchOutcome(r, clubSettings.name, clubSettings.shortName) === 'loss').length;
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
  const bgGrayscale = theme?.backgroundGrayscale ?? false;
  const bgContrast = theme?.backgroundContrast ?? 1;
  const bgScale = theme?.backgroundScale ?? 1;
  const bgVignette = theme?.backgroundVignette ?? 0;
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

  // =========================================================================
  // MODE AFFICHE OFFICIELLE / PASSERELLE RÉSEAUX (Pill Badges 16:9)
  // =========================================================================
  if (activeStyle === 'poster-red') {
    // Tri chronologique rigoureux : dates puis heures
    const sortedResults = [...activeResults].sort(sortMatchesChronologically);
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
                style={{ filter: `brightness(${bgBrightness}) blur(${bgBlur}px) grayscale(${bgGrayscale ? 100 : 0}%) contrast(${bgContrast})`, transform: `scale(${bgScale})` }}
              />
            ) : (
              <img
                src={backgroundUrl}
                alt="Fond visuel"
                className="w-full h-full object-cover"
                style={{ filter: `brightness(${bgBrightness}) blur(${bgBlur}px) grayscale(${bgGrayscale ? 100 : 0}%) contrast(${bgContrast})`, transform: `scale(${bgScale})` }}
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `radial-gradient(circle at center, rgba(0,0,0,${(theme?.backgroundVignette ?? 0.8) * 0.25}) 0%, rgba(0,0,0,${theme?.backgroundVignette ?? 0.8}) 100%)`,
            }} />
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
        <div className="absolute -bottom-8 -right-8 pointer-events-none z-10 flex flex-col gap-4 -rotate-45">
          <div className="w-[260px] h-6 bg-white shadow-lg" />
          <div className="w-[260px] h-6 bg-white shadow-lg" />
          <div className="w-[260px] h-6 bg-white shadow-lg" />
        </div>

        {/* Composition partagée avec la passerelle réseaux, canevas 1920 × 1080. */}
        <div className="relative z-20 w-full h-full p-10">
          <VisualThemePosterRedSection
            contentOnly
            aspectRatio="16:9"
            contentType="results"
            displayedMatches={[]}
            displayedResults={sortedResults}
            posterFilter="all"
            badgeTitle={customHeaderTitle || (sortedResults.length > 0 && sortedResults.every(m => isClubHomeMatch(m, clubSettings.name, clubSettings.shortName))
                ? theme?.customHeaderTitleHome || theme?.customHeaderTitle || 'LES RÉSULTATS À DOMICILE'
                : sortedResults.length > 0 && sortedResults.every(m => !(isClubHomeMatch(m, clubSettings.name, clubSettings.shortName)))
                ? theme?.customHeaderTitleAway || theme?.customHeaderTitle || "LES RÉSULTATS À L'EXTÉRIEUR"
                : theme?.customHeaderTitle || 'RÉSULTATS DU WEEK-END')}
            layer2PrimaryColor={primaryColor}
            layer2BadgeBgColor={theme?.badgeBgColor || primaryColor}
            layer2BadgeTextColor={theme?.badgeTextColor || '#ffffff'}
            layer2FontHeader={headerFont}
            layer2FontBody={bodyFont}
            layer2TextColor={textColor}
            safeClubName={clubSettings.name}
            safeShortName={clubSettings.shortName}
            resultDisplayMode={resultDisplayMode}
          />
          {!hideShareButton && <button type="button" onClick={onDownloadVisual}
            className="absolute top-4 right-4 z-30 px-4 py-2 bg-slate-900 text-white rounded-xl">
            Passerelle Réseaux
          </button>}
          {sortedResults.length === 0 && <p role="status" className="absolute inset-0 flex items-center justify-center text-white text-3xl">
            AUCUN RÉSULTAT POUR CETTE PÉRIODE
          </p>}
        </div>

        {/* ========================================================================= */}
        {/* CALQUE 3 : PREMIER PLAN - ÉLÉMENT LIBRE 1 (ÉLÉMENT GRAPHIQUE, LOGO, BADGE, ETC.)  */}
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
              {customHeaderTitle || (
                sortedResults.length > 0 && sortedResults.every((r) => isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? theme?.customHeaderTitleHome || theme?.customHeaderTitle || 'LES RÉSULTATS À DOMICILE'
                  : sortedResults.length > 0 && sortedResults.every((r) => !isClubHomeMatch(r, clubSettings.name, clubSettings.shortName))
                  ? theme?.customHeaderTitleAway || theme?.customHeaderTitle || "LES RÉSULTATS À L'EXTÉRIEUR"
                  : theme?.customHeaderTitle || 'RÉSULTATS DU WEEK-END'
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
              AUCUN RÉSULTAT POUR CETTE PÉRIODE
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
              const outcome = getMatchOutcome(r, clubSettings.name, clubSettings.shortName);
              const isWin = outcome === 'win';
              const isLoss = outcome === 'loss';
              const isFinishedNoScore = outcome === 'finished_no_score';
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
                      : isLoss
                      ? 'border-rose-500/60 shadow-rose-950/40'
                      : 'border-slate-700/80 shadow-slate-950/40'
                  }`}
                >
                  {/* Effet lumineux d'ambiance Victoire / Défaite / Neutre */}
                  <div
                    className={`absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-25 ${
                      isWin ? 'bg-emerald-400' : isLoss ? 'bg-rose-500' : 'bg-slate-600'
                    }`}
                  />

                  {/* Grand Bandeau Haut : VICTOIRE, DÉFAITE ou MATCH FINI */}
                  <div className="flex items-center justify-between gap-3 pb-3 mb-2 border-b border-slate-800/80 relative z-10">
                    {resultDisplayMode !== 'score' ? (
                      <div
                        className={`inline-flex items-center ${sizing.outcomeBanner} ${getFontFamilyClass(headerFont)} uppercase ${
                          isWin
                            ? 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white ring-2 ring-emerald-400/80 shadow-emerald-500/50'
                            : isLoss
                            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white ring-2 ring-rose-400/80 shadow-rose-600/50'
                            : 'bg-slate-800 text-slate-200 border border-slate-700 ring-1 ring-slate-600'
                        }`}
                      >
                        {isWin ? (
                          <Trophy className={`${sizing.outcomeIcon} animate-bounce shrink-0 text-amber-300 drop-shadow`} />
                        ) : isLoss ? (
                          <XCircle className={`${sizing.outcomeIcon} shrink-0 text-white/90`} />
                        ) : (
                          <Clock className={`${sizing.outcomeIcon} shrink-0 text-slate-300`} />
                        )}
                        <span>{isWin ? 'VICTOIRE' : isLoss ? 'DÉFAITE' : 'MATCH FINI'}</span>
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
                          : isLoss
                          ? 'bg-gradient-to-b from-white via-slate-100 to-rose-200 drop-shadow-[0_2px_12px_rgba(244,63,94,0.3)]'
                          : 'bg-gradient-to-b from-white via-slate-200 to-slate-400 drop-shadow-[0_2px_12px_rgba(148,163,184,0.3)]'
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
                            const label = isWin ? 'VICTOIRE' : isLoss ? 'DÉFAITE' : 'MATCH FINI';
                            const bg = isWin ? '#065f46' : isLoss ? '#9f1239' : '#334155';
                            const textCol = '#ffffff';
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
                              color: isWin ? '#34d399' : isLoss ? '#f43f5e' : '#e2e8f0',
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
      {/* CALQUE 3 : PREMIER PLAN - ÉLÉMENT LIBRE 1 (ÉLÉMENT GRAPHIQUE, LOGO, BADGE, ETC.)  */}
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
