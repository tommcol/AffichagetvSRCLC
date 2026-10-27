import type { PosterAspectRatio } from './posterExporter';

export const getPosterExportFilterLabel = (
  contentType: 'matches' | 'results' | 'notification',
  posterFilter: string
): string => {
  return contentType === 'matches' ? posterFilter : contentType;
};

export const getPosterExportRatioLabel = (
  aspectRatio: PosterAspectRatio | string
): string => {
  return aspectRatio.replace(':', '_');
};

export const getPosterExportPageSuffix = (
  currentPage: number,
  totalPages: number
): string => {
  return totalPages > 1
    ? `_affiche${currentPage}_sur_${totalPages}`
    : '';
};
