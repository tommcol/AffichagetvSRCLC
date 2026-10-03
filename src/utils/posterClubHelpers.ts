export const getPosterClubDisplayNames = (clubSettings?: {
  shortName?: string;
  name?: string;
  gymnasiumDefault?: string;
}) => {
  const shortName = (clubSettings?.shortName || clubSettings?.name || 'Nom du club').trim();
  const name = (clubSettings?.name || shortName).trim();
  const gymnasium = (clubSettings?.gymnasiumDefault || 'Gymnase').trim();

  return {
    shortName,
    name,
    gymnasium,
  };
};
