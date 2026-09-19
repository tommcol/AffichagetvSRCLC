import React, { useMemo } from 'react';
import { Cake } from 'lucide-react';
import { BirthdayItem, ClubSettings, SlideDesignTheme, ForegroundMascotConfig, OverlayLayerItem } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { ChromaKeyMascot } from '../ChromaKeyMascot';
import { FreeOverlayLayer } from '../FreeOverlayLayer';
import { getFontFamilyClass } from '../../utils/fontUtils';
import { sortBirthdaysByHierarchy, formatDisplayCategory } from '../../utils/excelBirthdayParser';

interface BirthdaysSlideProps {
  birthdays: BirthdayItem[];
  backgroundUrl?: string;
  clubSettings?: ClubSettings;
  theme?: SlideDesignTheme;
  mascot?: ForegroundMascotConfig;
  layer3?: OverlayLayerItem;
  layer4?: OverlayLayerItem;
  isInteractiveOverlay?: boolean;
  onLayerPositionChange?: (layerNum: 3 | 4, x: number, y: number) => void;
  selectedLayerNum?: 3 | 4 | null;
  onSelectLayer?: (layerNum: 3 | 4) => void;
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (percent: number) => void;
}

export const BirthdaysSlide: React.FC<BirthdaysSlideProps> = ({
  birthdays,
  backgroundUrl,
  clubSettings,
  theme,
  mascot,
  layer3,
  layer4,
  isInteractiveOverlay = false,
  onLayerPositionChange,
  selectedLayerNum,
  onSelectLayer,
  onVideoEnded,
  onVideoTimeUpdate,
}) => {
  const primaryColor = theme?.primaryColor || clubSettings?.primaryColor || '#ea580c';
  const textColor = theme?.textColor || '#ffffff';
  const badgeBgColor = theme?.badgeBgColor || primaryColor;
  const badgeTextColor = theme?.badgeTextColor || '#ffffff';
  const cardBg = theme?.cardBgColor || '#020617';
  const cardOpacity = theme?.cardOpacity ?? 0.85;
  const cardBlur = theme?.cardBlur ?? 8;
  const bgBrightness = theme?.backgroundBrightness ?? 0.35;
  const bgBlur = theme?.backgroundBlur ?? 0;
  const headerFont = theme?.fontFamilyHeader || 'Fredoka';
  const bodyFont = theme?.fontFamilyBody || 'Montserrat';

  // Video priority and synchronization determination
  const isBgVideo = Boolean(backgroundUrl && isVideoMedia(backgroundUrl));
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

  const cardBackdropStyle = {
    backgroundColor: `${cardBg}${Math.round(cardOpacity * 255).toString(16).padStart(2, '0')}`,
    backdropFilter: `blur(${cardBlur}px)`,
    WebkitBackdropFilter: `blur(${cardBlur}px)`,
  };

  // Sort strictly by category rank (U7, U8... seniors, coach, membre bureau) and gender (filles first, then garçons)
  const sortedBirthdays = useMemo(() => {
    return sortBirthdaysByHierarchy(birthdays || []);
  }, [birthdays]);

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-slate-950 select-none">
      {/* ========================================================================= */}
      {/* CALQUE 1 : ARRIÈRE-PLAN (IMAGE OU VIDÉO AVEC LUMINOSITÉ & FLOU AVANCÉS)   */}
      {/* ========================================================================= */}
      {backgroundUrl ? (
        <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {isVideoMedia(backgroundUrl) ? (
            <>
              {/* Background ambient fill */}
              <video
                src={backgroundUrl}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover scale-105"
                style={{
                  filter: `brightness(${bgBrightness}) blur(${Math.max(10, bgBlur + 10)}px)`,
                  opacity: 0.5,
                }}
              />
              {/* Main crisp 16:9 video */}
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
                className="relative z-0 w-full h-full max-w-full max-h-full object-contain"
                style={{
                  filter: `brightness(${bgBrightness}) blur(${bgBlur}px)`,
                }}
              />
            </>
          ) : (
            <>
              <img
                src={backgroundUrl}
                alt="Support Visuel Anniversaires"
                className="absolute inset-0 w-full h-full object-cover scale-105"
                style={{
                  filter: `brightness(${bgBrightness}) blur(${Math.max(10, bgBlur + 10)}px)`,
                  opacity: 0.5,
                }}
                referrerPolicy="no-referrer"
              />
              <img
                src={backgroundUrl}
                alt="Support Visuel Anniversaires"
                className="relative z-0 w-full h-full max-w-full max-h-full object-contain"
                style={{
                  filter: `brightness(${bgBrightness}) blur(${bgBlur}px)`,
                }}
                referrerPolicy="no-referrer"
              />
            </>
          )}

          {/* Vignette douce pour lisibilité maximale des prénoms */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />
        </div>
      ) : (
        <div className="absolute inset-0 z-0 bg-gradient-to-br from-purple-950 via-slate-950 to-pink-950">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,88,12,0.15),transparent_50%)]" />
        </div>
      )}

      {/* ========================================================================= */}
      {/* CALQUE 2 : DONNÉES & CARTES DES ANNIVERSAIRES                             */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between p-6 md:p-10 lg:p-14">
        {/* En-tête Titre Anniversaires */}
        <div className="w-full flex items-center justify-start gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shadow-lg border border-white/20 shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <Cake className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse-slow" />
            </div>
            <div>
              <h1
                className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.95)] ${getFontFamilyClass(
                  headerFont
                )}`}
              >
                LES ANNIVERSAIRES DE LA SEMAINE
              </h1>
            </div>
          </div>
        </div>

        {/* Liste des Anniversaires (Prénom et Catégorie uniquement) */}
        <div className="my-auto w-full max-w-4xl py-4">
          {sortedBirthdays.length === 0 ? (
            <div
              className="border border-white/15 rounded-3xl p-8 text-white max-w-xl shadow-2xl"
              style={cardBackdropStyle}
            >
              <Cake className="w-12 h-12 text-pink-400 mb-2" />
              <h3 className="text-2xl font-bold font-bebas">Aucun anniversaire cette semaine</h3>
              <p className="text-sm text-slate-300 mt-1">
                Importez votre fichier d'adhérents dans l'onglet Anniversaires pour générer cette affiche automatiquement.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 max-h-[62vh] overflow-y-auto pr-2">
              {sortedBirthdays.map((b) => {
                // Display strictly the First Name (Prénom) as requested
                const displayName = b.firstName || (b.fullName ? b.fullName.trim().split(/\s+/)[0] : 'Licencié');
                const displayCategory = formatDisplayCategory(b.teamCategory, b.gender, displayName);

                return (
                  <div
                    key={b.id}
                    className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-white/15 shadow-xl transition-all hover:scale-[1.01]"
                    style={cardBackdropStyle}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-black text-white shrink-0 shadow"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Cake className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={`text-2xl sm:text-3xl md:text-4xl font-black truncate drop-shadow tracking-wide ${getFontFamilyClass(
                            headerFont
                          )}`}
                          style={{ color: textColor }}
                        >
                          {displayName}
                        </div>
                      </div>
                    </div>

                    {displayCategory && (
                      <span
                        className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm md:text-base font-black shrink-0 border border-white/20 shadow-md ml-2 tracking-wider uppercase ${getFontFamilyClass(
                          bodyFont
                        )}`}
                        style={{ backgroundColor: badgeBgColor, color: badgeTextColor }}
                      >
                        {displayCategory}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Espace bas aéré */}
        <div className="w-full h-2" />
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
          slideType="birthdays"
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
