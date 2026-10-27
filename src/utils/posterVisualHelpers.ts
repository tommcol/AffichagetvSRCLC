import { VisualTemplatesConfig } from '../types';

export function resolvePosterBackgroundUrl({
  customBgImage,
  bgSource,
  categoryBackgroundUrl,
  visualTemplates,
  defaultPosterBg,
}: {
  customBgImage: string | null;
  bgSource: 'default' | 'studio' | 'custom';
  categoryBackgroundUrl?: string;
  visualTemplates?: VisualTemplatesConfig;
  defaultPosterBg: string;
}): string {
  if (customBgImage) return customBgImage;

  if (bgSource === 'studio' && categoryBackgroundUrl) {
    return categoryBackgroundUrl;
  }

  if (visualTemplates?.matchesBackgroundUrl) {
    return visualTemplates.matchesBackgroundUrl;
  }

  return defaultPosterBg;
}

export function resolveLayerMediaUrl(
  customUrl: string | null,
  configuredUrl?: string
): string {
  if (customUrl) return customUrl;
  if (configuredUrl) return configuredUrl;
  return '';
}
