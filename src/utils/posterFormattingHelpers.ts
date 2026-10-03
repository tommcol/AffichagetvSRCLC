import { formatMatchDayAndDate } from './matchDateHelper';

/**
 * Formats date and time into French poster style:
 * e.g. "Samedi 19 septembre | 13h30"
 */
export function formatPosterMatchDate(dateStr?: string, timeStr?: string): string {
  const formattedTime = timeStr ? timeStr.replace(':', 'h') : '14h00';

  if (!dateStr || !dateStr.trim()) {
    return `Samedi | ${formattedTime}`;
  }

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const trimmed = dateStr.trim();

  // 1. ISO format: YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      const dayName = days[dt.getDay()];
      return `${dayName} ${d} ${months[m]} | ${formattedTime}`;
    }
  }

  // 2. European format: DD/MM/YYYY
  const euroMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (euroMatch) {
    const d = parseInt(euroMatch[1], 10);
    const m = parseInt(euroMatch[2], 10) - 1;
    const y = parseInt(euroMatch[3], 10);
    const dt = new Date(y, m, d);
    if (!isNaN(dt.getTime())) {
      const dayName = days[dt.getDay()];
      return `${dayName} ${d} ${months[m]} | ${formattedTime}`;
    }
  }

  // Fallback to helper
  const dInfo = formatMatchDayAndDate(dateStr);
  return `${dInfo.display} | ${formattedTime}`;
}

/**
 * Helper to smart-format long club names for badges/pastilles so they fit in large, readable font sizes
 */
export const formatTeamNameForBadge = (rawName: string): string => {
  let name = (rawName || '').trim();
  if (!name) return '';
  if (name.length <= 22) return name;

  return name
    .replace(/\bASSOCIATION SAINT DENIS\b/gi, 'ASS. ST DENIS')
    .replace(/\bASSOCIATION\b/gi, 'ASS.')
    .replace(/\bASSOCIATION SPORTIVE\b/gi, 'A.S.')
    .replace(/\bBASKET CLUB\b/gi, 'BC')
    .replace(/\bCLUB BASKET\b/gi, 'CB')
    .replace(/\bSPORTS REUNIS\b/gi, 'S.R.')
    .replace(/\bSAINT\b/gi, 'ST')
    .replace(/\bSAINTE\b/gi, 'STE')
    .replace(/\bENTENTE\b/gi, 'ENT.')
    .replace(/\bETOILE SPORTIVE\b/gi, 'E.S.')
    .replace(/\bAMICALE LAIQUE\b/gi, 'A.L.')
    .replace(/\bBASKETBALL\b/gi, 'BASKET');
};
