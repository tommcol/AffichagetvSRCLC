import type { AppDataPayload, VisualTemplatesConfig } from '../types';

export const normalizeLoadedVisualTemplates = (
  visualTemplates: VisualTemplatesConfig
): VisualTemplatesConfig => {
  const normalized = { ...visualTemplates };

  if (normalized.matchesSettings) {
    const scope = (normalized.matchesSettings as any).matchDisplayScope;
    normalized.matchesSettings = {
      ...normalized.matchesSettings,
      matchDisplayScope:
        scope === 'home' || scope === 'away'
          ? 'split'
          : normalized.matchesSettings.matchDisplayScope,
    };
  }

  if (normalized.resultsSettings) {
    const scope = (normalized.resultsSettings as any).matchDisplayScope;
    normalized.resultsSettings = {
      ...normalized.resultsSettings,
      matchDisplayScope:
        scope === 'home' || scope === 'away'
          ? 'split'
          : normalized.resultsSettings.matchDisplayScope,
    };
  }

  return normalized;
};

export const getServerDataVersion = (
  data: AppDataPayload,
  responseVersion?: number
): number =>
  typeof data.version === 'number'
    ? data.version
    : typeof responseVersion === 'number'
      ? responseVersion
      : 0;
