export const buildPosterShareFilename = (
  shortClubName: string,
  badgeTitle: string
): string => {
  const safeClub = (shortClubName || '').trim().toLowerCase().replace(/\s+/g, '_');
  const safeBadge = (badgeTitle || '').trim().toLowerCase();
  return `${safeClub}_affiche_${safeBadge}.png`;
};
