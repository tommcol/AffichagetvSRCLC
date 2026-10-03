export const calculatePosterPreviewScale = (
  containerWidth: number,
  viewportHeight: number,
  targetWidth: number,
  targetHeight: number
): number => {
  if (containerWidth <= 0 || targetWidth <= 0 || targetHeight <= 0) {
    return 0.12;
  }

  const viewportMaxHeight = viewportHeight > 0 ? viewportHeight * 0.65 : 600;
  const scaleByWidth = (containerWidth - 8) / targetWidth;
  const scaleByHeight = viewportMaxHeight / targetHeight;

  return Math.max(
    0.12,
    Math.min(scaleByWidth, scaleByHeight, 480 / targetWidth)
  );
};
