/**
 * Helper to extract French day of week and formatted date for match displays
 * Handles ISO dates (YYYY-MM-DD), French date strings ("Samedi 19 Septembre"), European format (DD/MM/YYYY), etc.
 */
export function formatMatchDayAndDate(dateStr?: string): {
  dayName: string;      // e.g. "Samedi", "Dimanche"
  dateShort?: string;   // e.g. "19/09"
  display: string;      // e.g. "Samedi 19/09" or "Samedi"
} {
  if (!dateStr || !dateStr.trim()) {
    return { dayName: 'Samedi', display: 'Samedi' };
  }

  const str = dateStr.trim();
  const lower = str.toLowerCase();

  // 1. Check for standard ISO format: YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10) - 1;
    const d = parseInt(isoMatch[3], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const dayName = days[dateObj.getDay()];
      const dayNum = String(d).padStart(2, '0');
      const monthNum = String(m + 1).padStart(2, '0');
      const dateShort = `${dayNum}/${monthNum}`;
      return {
        dayName,
        dateShort,
        display: `${dayName} ${dateShort}`,
      };
    }
  }

  // 2. European format: DD/MM/YYYY
  const euroMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (euroMatch) {
    const d = parseInt(euroMatch[1], 10);
    const m = parseInt(euroMatch[2], 10) - 1;
    const y = parseInt(euroMatch[3], 10);
    const dateObj = new Date(y, m, d);
    if (!isNaN(dateObj.getTime())) {
      const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      const dayName = days[dateObj.getDay()];
      const dayNum = String(d).padStart(2, '0');
      const monthNum = String(m + 1).padStart(2, '0');
      const dateShort = `${dayNum}/${monthNum}`;
      return {
        dayName,
        dateShort,
        display: `${dayName} ${dateShort}`,
      };
    }
  }

  // 3. Check for explicit French day names (Samedi, Dimanche, etc.)
  const frenchDays = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const foundDay = frenchDays.find((d) => lower.includes(d));
  if (foundDay) {
    const capitalizedDay = foundDay.charAt(0).toUpperCase() + foundDay.slice(1);

    // Look for day numbers or dates like "19/09"
    const ddmmMatch = str.match(/(\d{1,2})[\/\-](\d{1,2})/);
    if (ddmmMatch) {
      const dayNum = ddmmMatch[1].padStart(2, '0');
      const monthNum = ddmmMatch[2].padStart(2, '0');
      return {
        dayName: capitalizedDay,
        dateShort: `${dayNum}/${monthNum}`,
        display: `${capitalizedDay} ${dayNum}/${monthNum}`,
      };
    }

    // Look for numbers after the day name, e.g. "Samedi 19"
    const dayNumOnly = str.match(/(?:samedi|dimanche|vendredi|mercredi|jeudi|mardi|lundi)\s+(\d{1,2})/i);
    if (dayNumOnly) {
      return {
        dayName: capitalizedDay,
        dateShort: dayNumOnly[1],
        display: `${capitalizedDay} ${dayNumOnly[1]}`,
      };
    }

    return {
      dayName: capitalizedDay,
      display: capitalizedDay,
    };
  }

  // Fallback
  return {
    dayName: str,
    display: str,
  };
}
