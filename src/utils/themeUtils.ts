import {
  VisualTemplatesConfig,
  CategorySlideTheme,
  SlideDesignTheme,
  ForegroundMascotConfig,
  OverlayLayerItem,
  ClubSettings,
} from '../types';
import { isVideoMedia } from './mediaUtils';

export const DEFAULT_OVERLAY_LAYER_3: OverlayLayerItem = {
  name: 'Mascotte / Élément 1',
  enabled: false,
  mediaUrl: '',
  mediaType: 'image',
  useChromaKey: true,
  chromaKeyColor: '#00ff00',
  chromaTolerance: 0.35,
  chromaSmoothness: 0.08,
  x: 88, // 88% horizontal (bas droite)
  y: 80, // 80% vertical
  scale: 1.0,
  opacity: 1.0,
  animationStyle: 'float',
  fullScreen: false,
  objectFit: 'cover',
  motionTrajectory: 'none',
  motionDuration: 12,
  flipHorizontal: false,
};

export const DEFAULT_OVERLAY_LAYER_4: OverlayLayerItem = {
  name: 'Logo / Badge 2',
  enabled: false,
  mediaUrl: '',
  mediaType: 'image',
  useChromaKey: false,
  chromaKeyColor: '#00ff00',
  chromaTolerance: 0.35,
  chromaSmoothness: 0.08,
  x: 12, // 12% horizontal (bas gauche)
  y: 80, // 80% vertical
  scale: 0.9,
  opacity: 1.0,
  animationStyle: 'none',
  fullScreen: false,
  objectFit: 'cover',
  motionTrajectory: 'none',
  motionDuration: 12,
  flipHorizontal: false,
};

export const DEFAULT_MATCHES_THEME: CategorySlideTheme = {
  primaryColor: '#ea580c',
  cardBgColor: '#020617',
  cardOpacity: 0.85,
  cardBlur: 8,
  fontFamilyHeader: 'Bebas Neue',
  backgroundBrightness: 0.4,
  backgroundBlur: 0,
  showMascot: true,
  mascotPosition: 'bottom-right',
  layer3: { ...DEFAULT_OVERLAY_LAYER_3, name: 'Mascotte Matchs' },
  layer4: { ...DEFAULT_OVERLAY_LAYER_4, name: 'Badge Derby / Sponsor' },
};

export const DEFAULT_RESULTS_THEME: CategorySlideTheme = {
  primaryColor: '#ea580c',
  cardBgColor: '#020617',
  cardOpacity: 0.85,
  cardBlur: 8,
  fontFamilyHeader: 'Bebas Neue',
  fontFamilyScore: 'Teko',
  backgroundBrightness: 0.4,
  backgroundBlur: 0,
  showMascot: true,
  mascotPosition: 'bottom-right',
  mascotOnlyOnVictory: false,
  layer3: { ...DEFAULT_OVERLAY_LAYER_3, name: 'Mascotte Victoire', onlyOnVictory: false },
  layer4: { ...DEFAULT_OVERLAY_LAYER_4, name: 'Badge MVP / Sponsor' },
};

export const DEFAULT_BIRTHDAYS_THEME: CategorySlideTheme = {
  primaryColor: '#ec4899',
  cardBgColor: '#180410',
  cardOpacity: 0.85,
  cardBlur: 8,
  fontFamilyHeader: 'Fredoka',
  backgroundBrightness: 0.5,
  backgroundBlur: 0,
  showMascot: true,
  mascotPosition: 'bottom-right',
  layer3: { ...DEFAULT_OVERLAY_LAYER_3, name: 'Mascotte Fête' },
  layer4: { ...DEFAULT_OVERLAY_LAYER_4, name: 'Badge Confettis' },
};

/**
 * Extrait et compose la configuration effective pour une catégorie donnée
 * (Matchs, Résultats ou Anniversaires) avec ses 4 calques.
 */
export function getEffectiveCategoryConfig(
  category: 'matches' | 'results' | 'birthdays',
  visualTemplates: VisualTemplatesConfig,
  clubSettings?: ClubSettings
): {
  backgroundUrl: string;
  theme: SlideDesignTheme;
  mascot: ForegroundMascotConfig;
  categoryTheme: CategorySlideTheme;
  layer3: OverlayLayerItem;
  layer4: OverlayLayerItem;
} {
  const globalTheme = visualTemplates?.theme;
  const globalMascot: ForegroundMascotConfig = visualTemplates?.mascot || {
    enabled: false,
    mediaUrl: '',
    mediaType: 'video',
    useChromaKey: true,
    chromaKeyColor: '#00ff00',
    chromaTolerance: 0.35,
    chromaSmoothness: 0.08,
    position: 'bottom-right',
    scale: 1.0,
    opacity: 1.0,
    animationStyle: 'float',
    showOnMatches: true,
    showOnResults: true,
    showOnBirthdays: true,
    onlyOnVictory: false,
  };

  const specific =
    category === 'matches'
      ? visualTemplates?.matchesSettings || {}
      : category === 'results'
      ? visualTemplates?.resultsSettings || {}
      : visualTemplates?.birthdaysSettings || {};

  const backgroundUrl =
    specific.backgroundUrl ||
    (category === 'matches'
      ? visualTemplates?.matchesBackgroundUrl
      : category === 'results'
      ? visualTemplates?.resultsBackgroundUrl
      : visualTemplates?.birthdaysBackgroundUrl) ||
    '';

  const primaryColor =
    specific.primaryColor ||
    globalTheme?.primaryColor ||
    clubSettings?.primaryColor ||
    (category === 'birthdays' ? '#ec4899' : '#ea580c');

  const cardBgColor =
    specific.cardBgColor ||
    globalTheme?.cardBgColor ||
    (category === 'birthdays' ? '#180410' : '#020617');

  const cardOpacity = specific.cardOpacity ?? globalTheme?.cardOpacity ?? 0.85;
  const cardBlur = specific.cardBlur ?? globalTheme?.cardBlur ?? 8;
  const fontFamilyHeader =
    specific.fontFamilyHeader ||
    globalTheme?.fontFamilyHeader ||
    (category === 'birthdays' ? 'Fredoka' : 'Bebas Neue');
  const fontFamilyScore =
    specific.fontFamilyScore ||
    globalTheme?.fontFamilyScore ||
    'Teko';
  const backgroundBrightness =
    specific.backgroundBrightness ??
    globalTheme?.backgroundBrightness ??
    (category === 'birthdays' ? 0.5 : 0.4);
  const backgroundBlur = specific.backgroundBlur ?? globalTheme?.backgroundBlur ?? 0;

  // Rétrocompatibilité Mascotte
  const showMascot =
    specific.showMascot ??
    (category === 'matches'
      ? globalMascot.showOnMatches !== false
      : category === 'results'
      ? globalMascot.showOnResults !== false
      : globalMascot.showOnBirthdays !== false);

  const mascotPosition = specific.mascotPosition || globalMascot.position || 'bottom-right';
  const onlyOnVictory =
    category === 'results'
      ? specific.mascotOnlyOnVictory ?? globalMascot.onlyOnVictory ?? false
      : false;

  // Calcul Calque 3 (Élément libre 1)
  const resolvedLayer3: OverlayLayerItem = specific.layer3 || {
    ...DEFAULT_OVERLAY_LAYER_3,
    enabled: globalMascot.enabled && showMascot,
    mediaUrl: globalMascot.mediaUrl,
    mediaType: globalMascot.mediaType,
    useChromaKey: globalMascot.useChromaKey,
    chromaKeyColor: globalMascot.chromaKeyColor,
    chromaTolerance: globalMascot.chromaTolerance,
    chromaSmoothness: globalMascot.chromaSmoothness,
    scale: globalMascot.scale,
    opacity: globalMascot.opacity,
    animationStyle: globalMascot.animationStyle,
    x: mascotPosition === 'bottom-left' ? 15 : mascotPosition === 'top-right' ? 88 : 88,
    y: mascotPosition === 'top-right' ? 20 : 80,
    onlyOnVictory,
    name: 'Élément 1',
  };

  // Calcul Calque 4 (Élément libre 2)
  const resolvedLayer4: OverlayLayerItem = specific.layer4 || {
    ...DEFAULT_OVERLAY_LAYER_4,
    name: 'Élément 2',
  };

  const backgroundMediaType = specific.backgroundMediaType || (isVideoMedia(backgroundUrl) ? 'video' : 'image');

  const showClubLogoWatermark = specific.showClubLogoWatermark ?? globalTheme?.showClubLogoWatermark ?? false;

  const theme: SlideDesignTheme = {
    primaryColor,
    secondaryColor: '#0f172a',
    cardBgColor,
    cardOpacity,
    cardBlur,
    fontFamilyHeader,
    fontFamilyScore,
    backgroundBrightness,
    backgroundBlur,
    backgroundMediaType,
    customHeaderTitle: specific.customHeaderTitle,
    visualStyle: specific.visualStyle || 'poster-red',
    showClubLogoWatermark,
  };

  const mascot: ForegroundMascotConfig = {
    ...globalMascot,
    showOnMatches: category === 'matches' ? resolvedLayer3.enabled : globalMascot.showOnMatches,
    showOnResults: category === 'results' ? resolvedLayer3.enabled : globalMascot.showOnResults,
    showOnBirthdays: category === 'birthdays' ? resolvedLayer3.enabled : globalMascot.showOnBirthdays,
    position: mascotPosition,
    onlyOnVictory,
  };

  const categoryTheme: CategorySlideTheme = {
    customHeaderTitle: specific.customHeaderTitle,
    visualStyle: specific.visualStyle || 'poster-red',
    backgroundUrl,
    backgroundMediaType,
    backgroundBrightness,
    backgroundBlur,
    showClubLogoWatermark,
    primaryColor,
    cardBgColor,
    cardOpacity,
    cardBlur,
    fontFamilyHeader,
    fontFamilyScore,
    showMascot: resolvedLayer3.enabled,
    mascotPosition,
    mascotOnlyOnVictory: resolvedLayer3.onlyOnVictory,
    layer3: resolvedLayer3,
    layer4: resolvedLayer4,
  };

  return {
    backgroundUrl,
    theme,
    mascot,
    categoryTheme,
    layer3: resolvedLayer3,
    layer4: resolvedLayer4,
  };
}
