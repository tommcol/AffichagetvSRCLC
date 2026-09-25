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

/**
 * Calcule un timestamp numérique pour trier les matchs et résultats rigoureusement par ordre chronologique
 * (Vendredi < Samedi < Dimanche, et heure par heure : 13:00 < 13:30 < 14:15 < 15:00 < 17:00 < 19:00...)
 */
export function parseMatchTimestamp(dateStr?: string, timeStr?: string): number {
  let dayScore = 2000; // Samedi par défaut
  let dayNum = 0;
  let monthNum = 0;
  let yearNum = 2026;

  if (dateStr) {
    const s = dateStr.toLowerCase().trim();

    if (s.includes('vendredi')) dayScore = 1000;
    else if (s.includes('samedi')) dayScore = 2000;
    else if (s.includes('dimanche')) dayScore = 3000;
    else if (s.includes('lundi')) dayScore = 4000;

    // DD/MM ou DD-MM
    const dateMatch = s.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
      dayNum = parseInt(dateMatch[1], 10);
      monthNum = parseInt(dateMatch[2], 10);
      if (dateMatch[3]) {
        yearNum = parseInt(dateMatch[3].length === 2 ? '20' + dateMatch[3] : dateMatch[3], 10);
      }
    } else {
      // YYYY-MM-DD
      const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) {
        yearNum = parseInt(isoMatch[1], 10);
        monthNum = parseInt(isoMatch[2], 10);
        dayNum = parseInt(isoMatch[3], 10);
      } else {
        // Noms de mois en français : ex: "Samedi 26 Septembre", "Dimanche 27 Septembre 2026"
        const frenchMonthMatch = s.match(/(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|a[oô]ut|septembre|octobre|novembre|d[ée]cembre)(?:\s+(\d{2,4}))?/i);
        if (frenchMonthMatch) {
          dayNum = parseInt(frenchMonthMatch[1], 10);
          const mStr = frenchMonthMatch[2].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          const months = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
          const idx = months.findIndex(m => mStr.startsWith(m.slice(0, 3)));
          if (idx !== -1) {
            monthNum = idx + 1;
          }
          if (frenchMonthMatch[3]) {
            yearNum = parseInt(frenchMonthMatch[3].length === 2 ? '20' + frenchMonthMatch[3] : frenchMonthMatch[3], 10);
          }
        }
      }
    }
  }

  let minutesOfDay = 0;
  if (timeStr) {
    const t = timeStr.toLowerCase().replace('h', ':').trim();
    const parts = t.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      minutesOfDay = h * 60 + m;
    }
  }

  if (monthNum > 0 && dayNum > 0) {
    return new Date(yearNum, monthNum - 1, dayNum).getTime() + minutesOfDay * 60000;
  }

  return dayScore * 100000 + minutesOfDay;
}

/**
 * Poids de tri par catégorie (U9 < U11 < U13 < U15 < U17 < U18 < U20 < Seniors < Loisirs)
 */
export function getCategorySortWeight(category?: string): number {
  if (!category || typeof category !== 'string') return 99;
  const c = category.trim().toUpperCase();
  if (c.includes('U9') || c.includes('BABY')) return 1;
  if (c.includes('U11')) return 2;
  if (c.includes('U13')) return 3;
  if (c.includes('U15')) return 4;
  if (c.includes('U17') || c.includes('U18')) return 5;
  if (c.includes('U20')) return 6;
  if (c.includes('SENIOR')) return 7;
  if (c.includes('LOISIR') || c.includes('VETERAN')) return 8;
  return 10;
}

/**
 * Trieur universel pour Matchs et Résultats par ordre chronologique rigoureux (date + heure + catégorie)
 */
export function sortMatchesChronologically<T extends { date?: string; time?: string; category?: string }>(a: T, b: T): number {
  const timeA = parseMatchTimestamp(a.date, a.time);
  const timeB = parseMatchTimestamp(b.date, b.time);
  if (timeA !== timeB) {
    return timeA - timeB;
  }
  const catA = getCategorySortWeight(a.category);
  const catB = getCategorySortWeight(b.category);
  if (catA !== catB) {
    return catA - catB;
  }
  return (a.category || '').localeCompare(b.category || '');
}
