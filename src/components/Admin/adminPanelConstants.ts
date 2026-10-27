import { FFBBTeamItem } from '../../types';

/**
 * Constantes partagées de l'AdminPanel, extraites lors du découpage du fichier.
 */
export const formatDateToEuropean = (dateStr: string): string => {
  if (!dateStr) return '';
  const cleaned = dateStr.trim();
  
  // Try to match YYYY-MM-DD format
  const yyyymmdd = cleaned.match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  if (yyyymmdd) {
    return `${yyyymmdd[3]}/${yyyymmdd[2]}/${yyyymmdd[1]}`;
  }

  // Try to match DD-MM-YYYY or DD/MM/YYYY
  const dd_mm_yyyy = cleaned.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (dd_mm_yyyy) {
    return `${dd_mm_yyyy[1]}/${dd_mm_yyyy[2]}/${dd_mm_yyyy[3]}`;
  }

  return cleaned;
};

export const DEFAULT_REAL_FFBB_TEAMS: FFBBTeamItem[] = [];
