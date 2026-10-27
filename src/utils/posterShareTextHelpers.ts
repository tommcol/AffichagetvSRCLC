export const buildPosterShareTitle = (
  badgeTitle: string,
  shortClubName: string
): string => {
  const safeBadge = (badgeTitle || '').trim();
  const safeClub = (shortClubName || '').trim();

  if (safeBadge && safeClub) {
    return `Affiche ${safeBadge} - ${safeClub}`;
  }
  if (safeBadge) {
    return `Affiche ${safeBadge}`;
  }
  return safeClub;
};
