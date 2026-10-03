import type { PosterFilterType } from './posterTypes';

export interface GetPosterBadgeTitleOptions {
  customBadgeTitle?: string;
  contentType: 'matches' | 'results' | 'notification';
  posterFilter: PosterFilterType;
  isWin?: boolean;
}

export const getPosterBadgeTitle = ({
  customBadgeTitle,
  contentType,
  posterFilter,
  isWin,
}: GetPosterBadgeTitleOptions): string => {
  const custom = (customBadgeTitle || '').trim();
  if (custom) return custom.toUpperCase();

  if (contentType === 'results') {
    switch (posterFilter) {
      case 'home':
        return 'RÉSULTATS DOMICILE';
      case 'away':
        return 'RÉSULTATS EXTÉRIEUR';
      case 'exempt':
        return 'EXEMPT';
      case 'all':
      default:
        return 'RÉSULTATS';
    }
  }

  if (contentType === 'notification') {
    return isWin ? 'VICTOIRE !' : 'FIN DE MATCH';
  }

  switch (posterFilter) {
    case 'home':
      return 'DOMICILE';
    case 'away':
      return 'EXTÉRIEUR';
    case 'exempt':
      return 'EXEMPT';
    case 'all':
    default:
      return 'MATCHDAY';
  }
};
