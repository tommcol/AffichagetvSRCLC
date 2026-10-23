import type { PosterFilterType } from './posterTypes';

export interface GetPosterBadgeTitleOptions {
  customBadgeTitle?: string;
  contentType: 'matches' | 'results' | 'notification';
  posterFilter: PosterFilterType;
  isWin?: boolean;
  teamName?: string;
}

export const getPosterBadgeTitle = ({
  customBadgeTitle,
  contentType,
  posterFilter,
  isWin,
  teamName,
}: GetPosterBadgeTitleOptions): string => {
  const custom = (customBadgeTitle || '').trim();
  if (custom) return custom.toUpperCase();

  if (teamName) return `${contentType === 'results' ? 'RÉSULTATS' : 'MATCHS'} — ${teamName}`.toUpperCase();

  if (contentType === 'results') {
    switch (posterFilter) {
      case 'home':
        return 'RÉSULTATS À DOMICILE';
      case 'away':
        return "RÉSULTATS À L’EXTÉRIEUR";
      case 'exempt':
        return 'EXEMPT';
      case 'all':
      default:
        return 'RÉSULTATS DU WEEK-END';
    }
  }

  if (contentType === 'notification') {
    return isWin ? 'VICTOIRE !' : 'FIN DE MATCH';
  }

  switch (posterFilter) {
    case 'home':
      return 'MATCHS À DOMICILE';
    case 'away':
      return "MATCHS À L’EXTÉRIEUR";
    case 'exempt':
      return 'EXEMPT';
    case 'all':
    default:
      return 'MATCHS DU WEEK-END';
  }
};
