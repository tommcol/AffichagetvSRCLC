import type { VisualExporterModalProps } from '../components/VisualExporterModal';

export type PosterContentType = 'matches' | 'results' | 'notification';

export const getInitialPosterContentType = (
  initialType: VisualExporterModalProps['type']
): PosterContentType => {
  if (initialType === 'victory' || initialType === 'defeat') {
    return 'notification';
  }

  return initialType === 'results' ? 'results' : 'matches';
};
