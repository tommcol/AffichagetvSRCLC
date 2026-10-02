import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Move, Pencil, Check } from 'lucide-react';
import { ActiveMatchAlert, TeamVisualItem, VisualTemplatesConfig, ClubSettings, VisualTitleConfig } from '../../types';
import { isVideoMedia } from '../../utils/mediaUtils';
import { getFontFamilyClass } from '../../utils/fontUtils';
import { formatAlertTitle } from '../../utils/alertUtils';

/**
 * Résout la configuration graphique effective du titre pour un média donné.
 * Si le média possède une configuration individuelle (isCustomized: true), elle est appliquée.
 * Sinon, elle retombe proprement sur la configuration globale par défaut du club.
 */
export function getEffectiveTitleConfig(
  visualUrl: string | undefined,
  isWin: boolean,
  visualTemplates?: VisualTemplatesConfig,
  alertTitleConfig?: VisualTitleConfig
): VisualTitleConfig & { isCustomized: boolean } {
  const directConfig = visualUrl && visualTemplates?.visualTitleConfigs?.[visualUrl];
  const candidate = directConfig || alertTitleConfig;

  const defaultTitle = isWin
    ? (visualTemplates?.alertCustomWinTitle ?? 'VICTOIRE DES {CATEGORIE}')
    : (visualTemplates?.alertCustomLossTitle ?? 'DÉFAITE DES {CATEGORIE}');
  const defaultColor = isWin
    ? (visualTemplates?.alertWinColor || visualTemplates?.alertTextColor || '#10b981')
    : (visualTemplates?.alertLossColor || visualTemplates?.alertTextColor || '#ef4444');

  if (candidate && candidate.isCustomized) {
    return {
      customTitle: candidate.customTitle ?? defaultTitle,
      font: candidate.font ?? visualTemplates?.alertTextFont ?? 'Bebas Neue',
      color: candidate.color ?? defaultColor,
      scale: candidate.scale ?? visualTemplates?.alertTextScale ?? 1.0,
      x: candidate.x ?? visualTemplates?.alertTextX ?? 50,
      y: candidate.y ?? visualTemplates?.alertTextY ?? 82,
      align: candidate.align ?? visualTemplates?.alertTextAlign ?? 'center',
      bgOpacity: candidate.bgOpacity ?? visualTemplates?.alertTextBgOpacity ?? 0,
      glowEffect: candidate.glowEffect ?? visualTemplates?.alertGlowEffect ?? true,
      isCustomized: true,
    };
  }

  // Fallback vers les réglages globaux par défaut
  return {
    customTitle: candidate?.customTitle ?? defaultTitle,
    font: candidate?.font ?? visualTemplates?.alertTextFont ?? 'Bebas Neue',
    color: candidate?.color ?? defaultColor,
    scale: candidate?.scale ?? visualTemplates?.alertTextScale ?? 1.0,
    x: candidate?.x ?? visualTemplates?.alertTextX ?? 50,
    y: candidate?.y ?? visualTemplates?.alertTextY ?? 82,
    align: candidate?.align ?? visualTemplates?.alertTextAlign ?? 'center',
    bgOpacity: candidate?.bgOpacity ?? visualTemplates?.alertTextBgOpacity ?? 0,
    glowEffect: candidate?.glowEffect ?? visualTemplates?.alertGlowEffect ?? true,
    isCustomized: false,
  };
}

interface MatchAlertSlideProps {
  alert: ActiveMatchAlert;
  teamVisual?: TeamVisualItem;
  visualTemplates?: VisualTemplatesConfig;
  clubSettings?: ClubSettings;
  overrideImageUrl?: string; // Média forcé (ex: sélection directe dans l'atelier d'administration)
  overrideTitleConfig?: VisualTitleConfig; // Configuration directe forcée en cours d'édition
  onVideoEnded?: () => void;
  onVideoTimeUpdate?: (progressPercent: number) => void;
  // Mode édition interactif pour l'aperçu dans l'administration
  interactive?: boolean;
  onUpdatePosition?: (x: number, y: number) => void;
  onUpdateTemplate?: (template: string) => void;
}

export const MatchAlertSlide: React.FC<MatchAlertSlideProps> = ({
  alert,
  teamVisual,
  visualTemplates,
  overrideImageUrl,
  overrideTitleConfig,
  onVideoEnded,
  onVideoTimeUpdate,
  interactive = false,
  onUpdatePosition,
  onUpdateTemplate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(1920);
  const [autoFitScale, setAutoFitScale] = useState<number>(1.0);

  const [isSelected, setIsSelected] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // 1. Détermination du média de fond (Photo ou Vidéo)
  const visualImage =
    overrideImageUrl ||
    alert.customImageUrl ||
    (alert.isWin ? teamVisual?.winVisualUrl : teamVisual?.lossVisualUrl) ||
    (alert.isWin ? visualTemplates?.defaultVictoryBackgroundUrl : visualTemplates?.defaultDefeatBackgroundUrl);

  // 2. Configuration graphique effective (attachée au visuel ou globale)
  const effectiveConfig = overrideTitleConfig || getEffectiveTitleConfig(
    visualImage,
    alert.isWin,
    visualTemplates,
    alert.titleConfig
  );

  const dragStartRef = useRef<{ clientX: number; clientY: number; startX: number; startY: number }>({
    clientX: 0,
    clientY: 0,
    startX: effectiveConfig.x ?? 50,
    startY: effectiveConfig.y ?? 82,
  });

  // Détection dynamique et réactive de la taille du conteneur 16:9 (Admin ou TV)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateContainerSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0) {
        setContainerWidth(rect.width);
      }
    };

    updateContainerSize();
    const observer = new ResizeObserver(updateContainerSize);
    observer.observe(el);
    window.addEventListener('resize', updateContainerSize);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateContainerSize);
    };
  }, []);

  // 3. Modèle de titre dynamique
  const titleTemplate = effectiveConfig.customTitle || (alert.isWin ? 'VICTOIRE DES {CATEGORIE}' : 'DÉFAITE DES {CATEGORIE}');
  const titleText = formatAlertTitle(titleTemplate, alert.isWin, alert.team);
  const lines = titleText.split('\n');

  // 4. Réglages graphiques résolus
  const textX = effectiveConfig.x ?? 50;
  const textY = effectiveConfig.y ?? 82;
  const textAlign = effectiveConfig.align || 'center';
  const textScale = effectiveConfig.scale ?? 1.0;
  const titleFont = effectiveConfig.font || 'Bebas Neue';
  const glowEffect = effectiveConfig.glowEffect ?? true;
  const bgOpacity = effectiveConfig.bgOpacity ?? 0;
  const titleColor = effectiveConfig.color || (alert.isWin ? '#10b981' : '#ef4444');

  // Taille de base strictement proportionnelle au conteneur 16:9
  // (~111px sur TV 1920x1080, ~45px sur preview admin 768px, ~22px sur mobile 380px)
  const baseFontSize = Math.max(14, containerWidth * 0.058);

  // Mesure réelle et ajustement automatique de sécurité au rendu (sans altérer la valeur enregistrée)
  useLayoutEffect(() => {
    const measureEl = measureRef.current;
    if (!measureEl || containerWidth <= 0) return;

    const measureAndFit = () => {
      const lineEls = measureEl.querySelectorAll('.alert-title-measure-line');
      let maxLineWidth = 0;
      lineEls.forEach((el) => {
        const w = (el as HTMLElement).getBoundingClientRect().width;
        if (w > maxLineWidth) maxLineWidth = w;
      });

      if (maxLineWidth <= 0) {
        setAutoFitScale(1.0);
        return;
      }

      // Zone de sécurité horizontale : 5% de marge à gauche et 5% à droite (max 90% du visuel)
      const minMargin = 0.05;
      const maxMargin = 0.95;
      const maxOverallSafeWidth = containerWidth * (maxMargin - minMargin); // 90%

      // Prise en compte du padding additionnel si le fond protecteur est activé
      const bgPadding = bgOpacity > 0 ? containerWidth * 0.06 : 0;
      const effectiveSafeWidth = Math.max(40, maxOverallSafeWidth - bgPadding);

      // Calcul de la largeur admissible en fonction du point d'ancrage textX et de l'alignement
      const posX = textX / 100;
      let positionSafeWidth = effectiveSafeWidth;

      if (textAlign === 'left') {
        const availRight = Math.max(0.1, maxMargin - posX) * containerWidth - bgPadding;
        positionSafeWidth = Math.min(effectiveSafeWidth, availRight);
      } else if (textAlign === 'right') {
        const availLeft = Math.max(0.1, posX - minMargin) * containerWidth - bgPadding;
        positionSafeWidth = Math.min(effectiveSafeWidth, availLeft);
      } else {
        // center
        const distToEdge = Math.min(posX - minMargin, maxMargin - posX);
        const availCenter = Math.max(0.1, 2 * distToEdge) * containerWidth - bgPadding;
        positionSafeWidth = Math.min(effectiveSafeWidth, availCenter);
      }

      const targetSafeWidth = Math.max(40, positionSafeWidth);

      // Largeur voulue par l'utilisateur à son échelle choisie
      const desiredWidth = maxLineWidth * textScale;

      if (desiredWidth > targetSafeWidth) {
        // Dépasse la zone de sécurité -> réduction automatique uniquement au rendu
        const autoReduction = targetSafeWidth / desiredWidth;
        setAutoFitScale(Math.min(1.0, Math.max(0.1, autoReduction)));
      } else {
        // Tient dans la zone de sécurité -> 100% de la taille voulue
        setAutoFitScale(1.0);
      }
    };

    measureAndFit();

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measureAndFit);
    }
  }, [titleText, titleFont, textScale, textX, textAlign, containerWidth, bgOpacity]);

  // Échelle finale au rendu
  const effectiveScale = textScale * autoFitScale;

  const translateX = textAlign === 'left' ? '0%' : textAlign === 'right' ? '-100%' : '-50%';

  // Gestion du glisser-déplacer direct (Mouse et Touch tactile)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || isEditing) return;
    e.stopPropagation();
    setIsSelected(true);
    setIsDragging(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}

    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: textX,
      startY: textY,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !isDragging || !containerRef.current) return;
    e.preventDefault(); // Empêche le défilement de page sur mobile

    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = ((e.clientX - dragStartRef.current.clientX) / rect.width) * 100;
    const deltaY = ((e.clientY - dragStartRef.current.clientY) / rect.height) * 100;

    const newX = Math.round(Math.max(5, Math.min(95, dragStartRef.current.startX + deltaX)));
    const newY = Math.round(Math.max(5, Math.min(95, dragStartRef.current.startY + deltaY)));

    if (onUpdatePosition) {
      onUpdatePosition(newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive || !isDragging) return;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (interactive) {
          setIsSelected(false);
          setIsEditing(false);
        }
      }}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 select-none"
    >
      {/* ========================================================================= */}
      {/* 0. ÉLÉMENT INVISIBLE DE MESURE DU TEXTE AVEC POLICE RÉELLE                 */}
      {/* ========================================================================= */}
      <div
        ref={measureRef}
        aria-hidden="true"
        className={`pointer-events-none select-none uppercase font-black tracking-wider leading-[1.08] ${getFontFamilyClass(
          titleFont
        )}`}
        style={{
          position: 'absolute',
          visibility: 'hidden',
          top: -99999,
          left: -99999,
          fontSize: `${baseFontSize}px`,
          whiteSpace: 'nowrap',
        }}
      >
        {lines.map((line, idx) => (
          <div key={idx} className="alert-title-measure-line">
            {line}
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. MÉDIA DE FOND : PHOTO OU VIDÉO PLEIN ÉCRAN                              */}
      {/* ========================================================================= */}
      {visualImage ? (
        <div className="absolute inset-0 z-0">
          {isVideoMedia(visualImage) ? (
            <video
              key={`alert-vid-${alert.id}-${visualImage}`}
              src={visualImage}
              autoPlay
              loop={!onVideoEnded}
              muted
              playsInline
              preload="auto"
              onCanPlay={(e) => {
                e.currentTarget.play().catch(() => {});
              }}
              onTimeUpdate={(e) => {
                const vid = e.currentTarget;
                if (onVideoTimeUpdate && vid.duration) {
                  onVideoTimeUpdate((vid.currentTime / vid.duration) * 100);
                }
              }}
              onEnded={onVideoEnded}
              onError={() => {
                console.warn('Erreur lecture vidéo alerte victoire/défaite, passage au suivant');
                if (onVideoEnded) onVideoEnded();
              }}
              className="w-full h-full object-cover brightness-[0.88] contrast-105"
            />
          ) : (
            <img
              src={visualImage}
              alt={`${alert.team} - ${alert.isWin ? 'Victoire' : 'Défaite'}`}
              className="w-full h-full object-cover brightness-[0.88] contrast-105 scale-100"
            />
          )}

          {/* Dégradé subtil assurant un contraste optimal pour le titre */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/40 pointer-events-none" />
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

      {/* ========================================================================= */}
      {/* 2. TITRE DYNAMIQUE SUPERPOSÉ (POSITIONNABLE LIBREMENT & ÉDITABLE)         */}
      {/* ========================================================================= */}
      <div
        className={`absolute z-10 transition-all ${
          interactive ? 'pointer-events-auto cursor-move touch-none' : 'pointer-events-none'
        }`}
        style={{
          left: `${textX}%`,
          top: `${textY}%`,
          transform: `translate(${translateX}, -50%) scale(${effectiveScale})`,
          transformOrigin: `${textAlign} center`,
          textAlign,
          maxWidth: '90%',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={(e) => {
          if (interactive) {
            e.stopPropagation();
            setIsEditing(true);
          }
        }}
      >
        {/* Barre d'outils discrète lors de la sélection dans l'aperçu */}
        {interactive && isSelected && !isEditing && (
          <div
            className="absolute -top-11 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/95 border border-orange-500/80 shadow-2xl text-[11px] font-bold text-white whitespace-nowrap z-30 pointer-events-auto backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-1 text-slate-300">
              <Move className="w-3 h-3 text-orange-400" />
              <span>Glisser pour déplacer</span>
            </span>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1 text-amber-300 hover:text-amber-200 transition-colors cursor-pointer px-1 py-0.5 rounded hover:bg-white/10"
            >
              <Pencil className="w-3 h-3 text-amber-400" />
              <span>Modifier texte</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-orange-400 text-[10px]">
              X:{textX}% Y:{textY}%
            </span>
            {autoFitScale < 0.999 && (
              <>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 text-[10px] font-semibold">
                  Ajusté auto ({Math.round(effectiveScale * 100)}%)
                </span>
              </>
            )}
          </div>
        )}

        {/* Boîte de rendu / conteneur de fond optionnel */}
        <div
          className={`transition-all relative ${
            bgOpacity > 0
              ? 'px-8 py-4 rounded-3xl backdrop-blur-md border border-white/15 shadow-2xl'
              : ''
          } ${
            interactive && isSelected
              ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-black/70 rounded-2xl'
              : ''
          }`}
          style={{
            backgroundColor: bgOpacity > 0 ? `rgba(0, 0, 0, ${bgOpacity})` : 'transparent',
          }}
        >
          {isEditing ? (
            /* Éditeur de texte in-place multi-lignes */
            <div
              className="flex flex-col items-center gap-2 pointer-events-auto min-w-[280px] max-w-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                rows={Math.max(2, (titleTemplate || '').split('\n').length)}
                value={titleTemplate}
                onChange={(e) => {
                  if (onUpdateTemplate) {
                    onUpdateTemplate(e.target.value);
                  }
                }}
                autoFocus
                placeholder={alert.isWin ? 'VICTOIRE DES {CATEGORIE}' : 'DÉFAITE DES {CATEGORIE}'}
                className={`w-full bg-black/90 text-white border-2 border-orange-500 rounded-2xl p-3 shadow-2xl focus:outline-none resize-none uppercase font-black tracking-wider leading-[1.08] ${getFontFamilyClass(
                  titleFont
                )} text-2xl sm:text-3xl`}
                style={{
                  color: titleColor,
                  textAlign,
                }}
              />
              <div className="flex items-center justify-between w-full px-3 py-1.5 rounded-xl bg-slate-900/95 border border-slate-700 text-[10px] text-slate-300">
                <span>💡 <strong>Entrée</strong> = saut de ligne • Conservez <strong>{'{CATEGORIE}'}</strong></span>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-colors cursor-pointer flex items-center gap-1 text-[11px]"
                >
                  <Check className="w-3 h-3" />
                  <span>Terminé</span>
                </button>
              </div>
            </div>
          ) : (
            /* Rendu du titre avec respect strict des retours à la ligne */
            <h1
              className={`font-black uppercase tracking-wider leading-[1.08] drop-shadow-[0_8px_24px_rgba(0,0,0,0.95)] ${getFontFamilyClass(
                titleFont
              )}`}
              style={{
                color: titleColor,
                fontSize: `${baseFontSize}px`,
                textShadow: glowEffect
                  ? `0 0 35px ${titleColor}99, 0 6px 20px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.95)`
                  : '0 6px 20px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.95)',
              }}
            >
              {lines.map((line, idx) => (
                <span
                  key={idx}
                  className="block whitespace-nowrap"
                  style={{ textAlign }}
                >
                  {line}
                </span>
              ))}
            </h1>
          )}

          {/* Badge de score réel (uniquement si score fourni dans le message Telegram ou la saisie, aucun score fictif) */}
          {alert.ourScore !== undefined && alert.opponentScore !== undefined && (
            <div className="mt-4 flex items-center justify-center pointer-events-none">
              <div className="inline-flex items-center gap-3 px-6 py-2 rounded-2xl bg-black/85 border border-white/20 shadow-2xl backdrop-blur-md">
                <span className="text-2xl md:text-3xl font-black text-amber-300 font-mono tracking-wider">
                  {alert.ourScore} - {alert.opponentScore}
                </span>
                {alert.opponent && (
                  <span className="text-sm md:text-base text-slate-300 font-semibold">
                    vs {alert.opponent}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
