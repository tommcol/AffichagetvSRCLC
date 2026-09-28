import { VisualTemplatesConfig, MediaBankItem, OverlayLayerItem } from '../types';
import { isVideoMedia } from './mediaUtils';

/**
 * Extrait un nom lisible à partir d'une URL de média
 */
export function extractMediaName(url: string, fallbackName?: string): string {
  if (!url) return fallbackName || 'Média sans nom';
  try {
    const cleanUrl = url.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/');
    const last = segments[segments.length - 1];
    if (last) {
      // Décode le nom (ex: "172829292-mon_fichier.mp4" -> "mon_fichier.mp4")
      const decoded = decodeURIComponent(last);
      const parts = decoded.split('-');
      if (parts.length > 2 && /^\d+$/.test(parts[0])) {
        return parts.slice(2).join('-');
      }
      return decoded;
    }
  } catch (e) {}
  return fallbackName || 'Média';
}

/**
 * Détermine les endroits exacts où un média est actuellement utilisé dans l'application
 */
export function getMediaUsages(mediaUrl: string, visualTemplates?: VisualTemplatesConfig): string[] {
  if (!mediaUrl || !visualTemplates) return [];
  const normalizedTarget = mediaUrl.trim();
  const usages: string[] = [];

  const checkMatch = (val?: string) => {
    if (!val) return false;
    return val.trim() === normalizedTarget;
  };

  // 1. MATCHS
  if (
    checkMatch(visualTemplates.matchesBackgroundUrl) ||
    checkMatch(visualTemplates.matchesSettings?.backgroundUrl)
  ) {
    usages.push('Matchs — Fond');
  }
  if (checkMatch(visualTemplates.matchesSettings?.layer3?.mediaUrl)) {
    usages.push('Matchs — Calque 3');
  }
  if (checkMatch(visualTemplates.matchesSettings?.layer4?.mediaUrl)) {
    usages.push('Matchs — Calque 4');
  }

  // 2. RÉSULTATS
  if (
    checkMatch(visualTemplates.resultsBackgroundUrl) ||
    checkMatch(visualTemplates.resultsSettings?.backgroundUrl)
  ) {
    usages.push('Résultats — Fond');
  }
  if (checkMatch(visualTemplates.resultsSettings?.layer3?.mediaUrl)) {
    usages.push('Résultats — Calque 3');
  }
  if (checkMatch(visualTemplates.resultsSettings?.layer4?.mediaUrl)) {
    usages.push('Résultats — Calque 4');
  }

  // 3. ANNIVERSAIRES
  if (
    checkMatch(visualTemplates.birthdaysBackgroundUrl) ||
    checkMatch(visualTemplates.birthdaysSettings?.backgroundUrl)
  ) {
    usages.push('Anniversaires — Fond');
  }
  if (checkMatch(visualTemplates.birthdaysSettings?.layer3?.mediaUrl)) {
    usages.push('Anniversaires — Calque 3');
  }
  if (checkMatch(visualTemplates.birthdaysSettings?.layer4?.mediaUrl)) {
    usages.push('Anniversaires — Calque 4');
  }

  // 4. AUTRES FONDS & VISUELS DU CLUB
  if (checkMatch(visualTemplates.defaultVictoryBackgroundUrl)) {
    usages.push('Victoire — Fond');
  }
  if (checkMatch(visualTemplates.defaultDefeatBackgroundUrl)) {
    usages.push('Défaite — Fond');
  }
  if (visualTemplates.commonVictoryVisuals?.some((u) => checkMatch(u))) {
    usages.push('Visuels Victoire');
  }
  if (visualTemplates.commonDefeatVisuals?.some((u) => checkMatch(u))) {
    usages.push('Visuels Défaite');
  }

  return usages;
}

/**
 * Consolide la banque de médias :
 * - conserve les éléments existants dans visualTemplates.mediaBank
 * - détecte automatiquement tout média déjà configuré dans les calques/fonds
 * - garantit la déduplication stricte par URL
 */
export function getConsolidatedMediaBank(visualTemplates: VisualTemplatesConfig): MediaBankItem[] {
  const map = new Map<string, MediaBankItem>();

  // 1. Ajouter les médias déjà déclarés dans la banque
  const existingList = visualTemplates.mediaBank || [];
  existingList.forEach((item) => {
    if (item && item.url && item.url.trim()) {
      const url = item.url.trim();
      const isVid = item.mediaType === 'video' || isVideoMedia(url);
      map.set(url, {
        ...item,
        url,
        mediaType: isVid ? 'video' : 'image',
        name: item.name || extractMediaName(url),
      });
    }
  });

  // 2. Détecter et intégrer automatiquement les médias déjà utilisés dans les réglages
  const candidates: { url?: string; mediaType?: 'image' | 'video'; defaultName: string }[] = [
    { url: visualTemplates.matchesSettings?.backgroundUrl || visualTemplates.matchesBackgroundUrl, defaultName: 'Fond Matchs' },
    { url: visualTemplates.matchesSettings?.layer3?.mediaUrl, mediaType: visualTemplates.matchesSettings?.layer3?.mediaType, defaultName: visualTemplates.matchesSettings?.layer3?.name || 'Matchs Élément 1' },
    { url: visualTemplates.matchesSettings?.layer4?.mediaUrl, mediaType: visualTemplates.matchesSettings?.layer4?.mediaType, defaultName: visualTemplates.matchesSettings?.layer4?.name || 'Matchs Élément 2' },

    { url: visualTemplates.resultsSettings?.backgroundUrl || visualTemplates.resultsBackgroundUrl, defaultName: 'Fond Résultats' },
    { url: visualTemplates.resultsSettings?.layer3?.mediaUrl, mediaType: visualTemplates.resultsSettings?.layer3?.mediaType, defaultName: visualTemplates.resultsSettings?.layer3?.name || 'Résultats Élément 1' },
    { url: visualTemplates.resultsSettings?.layer4?.mediaUrl, mediaType: visualTemplates.resultsSettings?.layer4?.mediaType, defaultName: visualTemplates.resultsSettings?.layer4?.name || 'Résultats Élément 2' },

    { url: visualTemplates.birthdaysSettings?.backgroundUrl || visualTemplates.birthdaysBackgroundUrl, defaultName: 'Fond Anniversaires' },
    { url: visualTemplates.birthdaysSettings?.layer3?.mediaUrl, mediaType: visualTemplates.birthdaysSettings?.layer3?.mediaType, defaultName: visualTemplates.birthdaysSettings?.layer3?.name || 'Anniversaires Élément 1' },
    { url: visualTemplates.birthdaysSettings?.layer4?.mediaUrl, mediaType: visualTemplates.birthdaysSettings?.layer4?.mediaType, defaultName: visualTemplates.birthdaysSettings?.layer4?.name || 'Anniversaires Élément 2' },
  ];

  candidates.forEach((c) => {
    if (c.url && c.url.trim()) {
      const url = c.url.trim();
      if (!map.has(url)) {
        const isVid = c.mediaType === 'video' || isVideoMedia(url);
        map.set(url, {
          id: `mb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: extractMediaName(url, c.defaultName),
          url,
          mediaType: isVid ? 'video' : 'image',
          dateAdded: new Date().toISOString(),
        });
      }
    }
  });

  return Array.from(map.values());
}

/**
 * Enregistre un nouveau média dans la banque en évitant les doublons
 */
export function addMediaToBank(
  visualTemplates: VisualTemplatesConfig,
  media: { name?: string; url: string; mediaType?: 'image' | 'video'; size?: number }
): VisualTemplatesConfig {
  if (!media.url || !media.url.trim()) return visualTemplates;
  const url = media.url.trim();
  const currentList = getConsolidatedMediaBank(visualTemplates);

  const existingIndex = currentList.findIndex((item) => item.url === url);
  const isVid = media.mediaType === 'video' || isVideoMedia(url);
  const finalName = media.name?.trim() || extractMediaName(url);

  let updatedList: MediaBankItem[];
  if (existingIndex >= 0) {
    // Déjà présent : on met à jour le nom si fourni
    updatedList = [...currentList];
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      name: finalName || updatedList[existingIndex].name,
      mediaType: isVid ? 'video' : 'image',
    };
  } else {
    // Nouveau média
    const newItem: MediaBankItem = {
      id: `mb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: finalName,
      url,
      mediaType: isVid ? 'video' : 'image',
      dateAdded: new Date().toISOString(),
      size: media.size,
    };
    updatedList = [newItem, ...currentList];
  }

  return {
    ...visualTemplates,
    mediaBank: updatedList,
  };
}

/**
 * Supprime un média de la banque UNIQUEMENT s'il n'est utilisé nulle part.
 */
export function removeMediaFromBank(
  visualTemplates: VisualTemplatesConfig,
  mediaIdOrUrl: string
): { success: boolean; visualTemplates: VisualTemplatesConfig; error?: string; usages?: string[] } {
  const currentList = getConsolidatedMediaBank(visualTemplates);
  const item = currentList.find((m) => m.id === mediaIdOrUrl || m.url === mediaIdOrUrl);

  if (!item) {
    return { success: true, visualTemplates };
  }

  // Vérification stricte des utilisations
  const usages = getMediaUsages(item.url, visualTemplates);
  if (usages.length > 0) {
    return {
      success: false,
      visualTemplates,
      usages,
      error: `Impossible de supprimer ce média. Utilisé dans :\n${usages.map((u) => `• ${u}`).join('\n')}`,
    };
  }

  const updatedList = currentList.filter((m) => m.url !== item.url && m.id !== item.id);

  return {
    success: true,
    visualTemplates: {
      ...visualTemplates,
      mediaBank: updatedList,
    },
  };
}

/**
 * Applique un média de la banque à un calque ou un fond cible
 */
export function applyMediaToTarget(
  visualTemplates: VisualTemplatesConfig,
  media: MediaBankItem,
  target:
    | 'matches-bg'
    | 'matches-layer3'
    | 'matches-layer4'
    | 'results-bg'
    | 'results-layer3'
    | 'results-layer4'
    | 'birthdays-bg'
    | 'birthdays-layer3'
    | 'birthdays-layer4'
): VisualTemplatesConfig {
  const next = { ...visualTemplates };
  const isVideo = media.mediaType === 'video';

  const updateLayer = (existingLayer?: OverlayLayerItem, layerNum: 3 | 4 = 3): OverlayLayerItem => {
    return {
      name: existingLayer?.name || (layerNum === 3 ? 'Élément 1' : 'Élément 2'),
      enabled: true,
      mediaUrl: media.url,
      mediaType: isVideo ? 'video' : 'image',
      useChromaKey: existingLayer?.useChromaKey ?? true,
      chromaKeyColor: existingLayer?.chromaKeyColor ?? '#00ff00',
      chromaTolerance: existingLayer?.chromaTolerance ?? 0.35,
      chromaSmoothness: existingLayer?.chromaSmoothness ?? 0.08,
      x: existingLayer?.x ?? (layerNum === 3 ? 88 : 12),
      y: existingLayer?.y ?? 80,
      scale: existingLayer?.scale ?? 1.0,
      opacity: existingLayer?.opacity ?? 1.0,
      animationStyle: existingLayer?.animationStyle ?? (layerNum === 3 ? 'float' : 'none'),
      fullScreen: existingLayer?.fullScreen ?? false,
      motionTrajectory: existingLayer?.motionTrajectory ?? 'none',
      motionDuration: existingLayer?.motionDuration ?? 12,
      flipHorizontal: existingLayer?.flipHorizontal ?? false,
      objectFit: existingLayer?.objectFit ?? 'contain',
    };
  };

  switch (target) {
    case 'matches-bg':
      next.matchesBackgroundUrl = media.url;
      next.matchesSettings = {
        ...next.matchesSettings,
        backgroundUrl: media.url,
        backgroundMediaType: isVideo ? 'video' : 'image',
      };
      break;
    case 'matches-layer3':
      next.matchesSettings = {
        ...next.matchesSettings,
        layer3: updateLayer(next.matchesSettings?.layer3, 3),
      };
      break;
    case 'matches-layer4':
      next.matchesSettings = {
        ...next.matchesSettings,
        layer4: updateLayer(next.matchesSettings?.layer4, 4),
      };
      break;
    case 'results-bg':
      next.resultsBackgroundUrl = media.url;
      next.resultsSettings = {
        ...next.resultsSettings,
        backgroundUrl: media.url,
        backgroundMediaType: isVideo ? 'video' : 'image',
      };
      break;
    case 'results-layer3':
      next.resultsSettings = {
        ...next.resultsSettings,
        layer3: updateLayer(next.resultsSettings?.layer3, 3),
      };
      break;
    case 'results-layer4':
      next.resultsSettings = {
        ...next.resultsSettings,
        layer4: updateLayer(next.resultsSettings?.layer4, 4),
      };
      break;
    case 'birthdays-bg':
      next.birthdaysBackgroundUrl = media.url;
      next.birthdaysSettings = {
        ...next.birthdaysSettings,
        backgroundUrl: media.url,
        backgroundMediaType: isVideo ? 'video' : 'image',
      };
      break;
    case 'birthdays-layer3':
      next.birthdaysSettings = {
        ...next.birthdaysSettings,
        layer3: updateLayer(next.birthdaysSettings?.layer3, 3),
      };
      break;
    case 'birthdays-layer4':
      next.birthdaysSettings = {
        ...next.birthdaysSettings,
        layer4: updateLayer(next.birthdaysSettings?.layer4, 4),
      };
      break;
  }

  return next;
}
