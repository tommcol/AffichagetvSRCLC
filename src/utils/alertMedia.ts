import type { ActiveMatchAlert, TeamVisualItem, VisualTemplatesConfig } from '../types';

/** Même ordre de sélection pour la création FFBB et les alertes déjà enregistrées. */
export function getAlertMediaCandidates(
  alert: Pick<ActiveMatchAlert, 'id' | 'isWin' | 'customImageUrl'>,
  teamVisual?: TeamVisualItem,
  templates?: VisualTemplatesConfig,
  overrideUrl?: string,
): string[] {
  const bank = (alert.isWin ? templates?.commonVictoryVisuals : templates?.commonDefeatVisuals) || [];
  const validBank = bank.filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  // Répartition stable : une actualisation ne change pas la vidéo d'une même alerte.
  const hash = Array.from(alert.id || '').reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 0);
  const start = validBank.length ? hash % validBank.length : 0;
  const orderedBank = [...validBank.slice(start), ...validBank.slice(0, start)];
  return [...new Set([
    overrideUrl,
    alert.customImageUrl,
    ...orderedBank,
    alert.isWin ? teamVisual?.winVisualUrl : teamVisual?.lossVisualUrl,
    alert.isWin ? templates?.defaultVictoryBackgroundUrl : templates?.defaultDefeatBackgroundUrl,
  ].filter((url): url is string => typeof url === 'string' && url.trim().length > 0))];
}
