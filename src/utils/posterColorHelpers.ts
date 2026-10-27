import type { CategorySlideTheme } from '../types';

export const buildPosterColorSettings = (
  primary?: string,
  text?: string,
  badgeBg?: string,
  badgeText?: string
): Partial<CategorySlideTheme> => {
  const partial: Partial<CategorySlideTheme> = {};

  if (primary !== undefined) partial.primaryColor = primary;
  if (text !== undefined) partial.textColor = text;
  if (badgeBg !== undefined) partial.badgeBgColor = badgeBg;
  if (badgeText !== undefined) partial.badgeTextColor = badgeText;

  return partial;
};
