import type { AppDataPayload, VisualTemplatesConfig } from '../types';

export const normalizeLoadedVisualTemplates = (
  visualTemplates: VisualTemplatesConfig
): VisualTemplatesConfig => {
  const normalized = { ...visualTemplates };

  if (normalized.matchesSettings) {
    normalized.matchesSettings = {
      ...normalized.matchesSettings,
      matchDisplayScope:
        normalized.matchesSettings.matchDisplayScope === 'home' ||
        normalized.matchesSettings.matchDisplayScope === 'away'
          ? 'split'
          : normalized.matchesSettings.matchDisplayScope,
    };
  }

  if (normalized.resultsSettings) {
    normalized.resultsSettings = {
      ...normalized.resultsSettings,
      matchDisplayScope:
        normalized.resultsSettings.matchDisplayScope === 'home' ||
        normalized.resultsSettings.matchDisplayScope === 'away'
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
