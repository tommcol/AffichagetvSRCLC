export const buildPosterExportFilename = ({
  shortClubName,
  filterLabel,
  pageSuffix,
  ratioLabel,
  timestamp,
}: {
  shortClubName: string;
  filterLabel: string;
  pageSuffix: string;
  ratioLabel: string;
  timestamp: number;
}): string => {
  const safeClubName = shortClubName.toLowerCase().replace(/\s+/g, '_');

  return `${safeClubName}_affiche_${filterLabel}${pageSuffix}_${ratioLabel}_${timestamp}.png`;
};
