import { PosterAspectRatio } from './posterExporter';

// Hauteur réelle du canevas d'export pour chaque format
const CANVAS_HEIGHTS: Record<PosterAspectRatio, number> = {
  '4:5': 1350,
  '9:16': 1920,
  '1:1': 1080,
  '16:9': 1080,
};

export interface PosterCardSizing {
  pillHeight: number;
  headerFontSize: number;
  centerFontSize: number;
  gapY: number;
  columns: 1 | 2;
}

// Moins il y a de matchs, plus les elements grossissent pour occuper l'espace au maximum.
function pillFactor(count: number): number {
  if (count <= 1) return 0.13;
  if (count === 2) return 0.115;
  if (count === 3) return 0.095;
  if (count === 4) return 0.09;
  if (count === 5) return 0.082;
  if (count === 6) return 0.075;
  if (count === 7) return 0.066;
  return 0.062;
}

function headerFactor(count: number): number {
  if (count <= 2) return 0.033;
  if (count <= 4) return 0.027;
  if (count <= 6) return 0.023;
  return 0.019;
}

function centerFactor(count: number): number {
  if (count <= 2) return 0.025;
  if (count <= 4) return 0.021;
  if (count <= 6) return 0.018;
  return 0.015;
}

export function getAdaptivePosterCardSizing(
  count: number,
  aspectRatio: PosterAspectRatio
): PosterCardSizing {
  const safeCount = Math.max(1, count);
  const h = CANVAS_HEIGHTS[aspectRatio] || 1350;
  return {
    pillHeight: Math.round(h * pillFactor(safeCount)),
    headerFontSize: Math.round(h * headerFactor(safeCount)),
    centerFontSize: Math.round(h * centerFactor(safeCount)),
    gapY: Math.round(h * 0.013),
    columns: safeCount <= 2 ? 1 : 2,
  };
}
