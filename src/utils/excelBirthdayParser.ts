import * as XLSX from 'xlsx';
import { BirthdayItem } from '../types';

/**
 * Format a string to clean title-case / first-name casing (handles hyphens like Jean-Marc)
 */
export function formatNameCapitalized(str: string): string {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .split(/([\s-]+)/)
    .map((part) => (part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : ''))
    .join('');
}

/**
 * Extract the pure First Name (Prénom) from a string or separate fields
 */
export function extractFirstName(fullName: string, separateFirst?: string): string {
  if (separateFirst && separateFirst.trim()) {
    return formatNameCapitalized(separateFirst.trim());
  }

  const clean = fullName.trim();
  if (!clean) return '';

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return formatNameCapitalized(parts[0]);
  }

  // Check if one of the words is all uppercase (typically French surname: "DUPONT Lucas" -> "Lucas")
  const isAllUpper = (s: string) => s.length > 1 && s === s.toUpperCase() && !/[0-9]/.test(s);
  const upperPartIndex = parts.findIndex(isAllUpper);

  if (upperPartIndex === 0 && parts.length > 1) {
    // "MERCIER Lucas" -> First name is the remainder
    return formatNameCapitalized(parts.slice(1).join(' '));
  } else if (upperPartIndex > 0) {
    // "Lucas MERCIER" -> First name is the beginning
    return formatNameCapitalized(parts.slice(0, upperPartIndex).join(' '));
  }

  // Default: first token is usually the first name in French forms (e.g. "Lucas Dubois" -> "Lucas")
  return formatNameCapitalized(parts[0]);
}

/**
 * Known French first names for gender detection fallback when gender isn't explicitly set in Excel
 */
const KNOWN_FEMALE_NAMES = new Set([
  'juliette', 'lena', 'léna', 'chloe', 'chloé', 'emma', 'clara', 'sarah', 'camille', 'manon', 'ines', 'inès',
  'louise', 'jade', 'alice', 'rose', 'anna', 'lucie', 'mila', 'mia', 'zoe', 'zoé', 'lea', 'léa', 'julie',
  'celia', 'célia', 'eva', 'oceane', 'océane', 'laura', 'marion', 'ambre', 'mathilde', 'agathe', 'elena',
  'éléna', 'romane', 'lola', 'lisa', 'anais', 'anaïs', 'charlotte', 'clemence', 'clémence', 'pauline',
  'margaux', 'solene', 'solène', 'justine', 'melanie', 'mélanie', 'noemie', 'noémie', 'capucine', 'lou',
  'elise', 'élise', 'victorine', 'marine', 'albane', 'maelys', 'maëlys', 'romane', 'jeanne', 'adele', 'adèle'
]);

const KNOWN_MALE_NAMES = new Set([
  'lucas', 'noah', 'arthur', 'hugo', 'thomas', 'julien', 'nathan', 'gabriel', 'leo', 'léo', 'louis',
  'jules', 'paul', 'raphael', 'raphaël', 'maxime', 'antoine', 'mathis', 'alexandre', 'clement', 'clément',
  'yanis', 'valentin', 'baptiste', 'enzo', 'theo', 'théo', 'ethan', 'robin', 'axel', 'victor', 'adrien',
  'sacha', 'gabin', 'adam', 'malo', 'eliott', 'elouan', 'titouan', 'bastien', 'samuel', 'quentin', 'dylan',
  'mathieu', 'matthieu', 'maxence', 'simon', 'tom', 'pierre', 'nicolas', 'david', 'alexis', 'romain'
]);

/**
 * Format category to clean standard basketball / sports display format with F or M:
 * - "U15" + female / "U15 Filles" / "U15 Féminines" / "U15-F" -> "U15F"
 * - "U15" + male / "U15 Garçons" / "U15 Masculins" / "U15-M" -> "U15M"
 * - "U13 Filles" -> "U13F"
 * - "U17 Garçons" -> "U17M"
 * - "Seniors Féminines" / "SF" -> "Seniors F"
 * - "Seniors Garçons" / "Seniors Masculins" / "SG" / "SM" -> "Seniors M"
 * - "Coach U15" -> "Coach U15"
 * - "Membre du Bureau" -> "Bureau"
 */
export function formatDisplayCategory(
  categoryStr: string = '',
  gender?: 'F' | 'M' | 'Mixte' | string,
  firstName?: string
): string {
  const raw = (categoryStr || '').trim();
  if (!raw) return 'Club';

  const clean = raw.toLowerCase();
  const fnClean = (firstName || '').trim().toLowerCase();

  // 1. Check if category is a Youth category (U7, U8, U9, U10, U11, U13, U15, U17, U18, U20...)
  const uMatch = clean.match(/\b(u\s*([0-9]{1,2}))/i);
  if (uMatch) {
    const uNum = `U${uMatch[2]}`;

    // Detect female
    const isFemale =
      clean.includes('fille') ||
      clean.includes('féminin') ||
      clean.includes('feminin') ||
      /\bu\d+f\b/i.test(clean) ||
      clean.endsWith('f') ||
      clean.endsWith('-f') ||
      gender === 'F' ||
      gender === 'Féminin' ||
      gender === 'Feminin' ||
      (fnClean && KNOWN_FEMALE_NAMES.has(fnClean));

    // Detect male
    const isMale =
      clean.includes('garçon') ||
      clean.includes('garcon') ||
      clean.includes('masculin') ||
      /\bu\d+[mg]\b/i.test(clean) ||
      clean.endsWith('m') ||
      clean.endsWith('g') ||
      clean.endsWith('-m') ||
      gender === 'M' ||
      gender === 'Masculin' ||
      (fnClean && KNOWN_MALE_NAMES.has(fnClean));

    if (isFemale) {
      return `${uNum}F`;
    }
    if (isMale) {
      return `${uNum}M`;
    }

    // For U7 or U9 if neither is specified, keep simple U7 / U9
    if (uMatch[2] === '7' || uMatch[2] === '9') {
      return uNum;
    }

    return uNum;
  }

  // 2. Check Seniors
  if (clean.includes('senior')) {
    if (
      clean.includes('fille') ||
      clean.includes('féminin') ||
      clean.includes('feminin') ||
      clean.endsWith('f') ||
      gender === 'F' ||
      gender === 'Féminin' ||
      (fnClean && KNOWN_FEMALE_NAMES.has(fnClean))
    ) {
      return 'Seniors F';
    }
    if (
      clean.includes('garçon') ||
      clean.includes('garcon') ||
      clean.includes('masculin') ||
      clean.endsWith('m') ||
      clean.endsWith('g') ||
      gender === 'M' ||
      gender === 'Masculin' ||
      (fnClean && KNOWN_MALE_NAMES.has(fnClean))
    ) {
      return 'Seniors M';
    }
    return 'Seniors';
  }

  // 3. Seniors short codes (SF -> Seniors F, SG / SM -> Seniors M)
  if (/^sf\d*$/i.test(clean) || /^rf\d*$/i.test(clean) || /^df\d*$/i.test(clean) || /^nf\d*$/i.test(clean)) {
    return 'Seniors F';
  }
  if (/^(sg|sm|rm|dm|nm)\d*$/i.test(clean)) {
    return 'Seniors M';
  }

  // 4. Clean up administrative / staff roles
  if (clean.includes('bureau') || clean.includes('dirigeant') || clean.includes('président')) {
    return 'Bureau';
  }
  if (clean.includes('bénévole') || clean.includes('benevole')) {
    return 'Bénévole';
  }

  return raw;
}

/**
 * Extract clean category/team (e.g. "U17M", "U15F", "Seniors F")
 */
export function extractCleanCategory(catStr: string, gender?: string, firstName?: string): string {
  return formatDisplayCategory(catStr, gender, firstName);
}

/**
 * Returns bounds and labels for a calendar week (Monday to Sunday) given a reference date and week offset
 */
export function getWeekBounds(referenceDate: Date = new Date(), weekOffset: number = 0): {
  monday: Date;
  sunday: Date;
  weekNumber: number;
  label: string;
  shortLabel: string;
} {
  const ref = new Date(referenceDate);
  ref.setDate(ref.getDate() + weekOffset * 7);

  const dayOfWeek = ref.getDay(); // 0 = Dimanche, 1 = Lundi...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const monday = new Date(ref);
  monday.setDate(ref.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // ISO Week number calculation
  const target = new Date(monday.valueOf());
  const dayNr = (monday.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const mMonth = months[monday.getMonth()];
  const sMonth = months[sunday.getMonth()];

  const label =
    monday.getMonth() === sunday.getMonth()
      ? `Semaine ${weekNumber} • Du ${monday.getDate()} au ${sunday.getDate()} ${sMonth}`
      : `Semaine ${weekNumber} • Du ${monday.getDate()} ${mMonth} au ${sunday.getDate()} ${sMonth}`;

  const shortLabel =
    weekOffset === 0
      ? 'Cette semaine'
      : weekOffset === 1
      ? 'Semaine prochaine (+1)'
      : weekOffset === -1
      ? 'Semaine passée (-1)'
      : `Semaine ${weekNumber}`;

  return { monday, sunday, weekNumber, label, shortLabel };
}

/**
 * Checks if a given month and day falls in the specified calendar week
 */
export function isDateInSpecifiedWeek(
  date: Date,
  referenceDate: Date = new Date(),
  weekOffset: number = 0
): { inWeek: boolean; targetDate: Date; dayOfWeekIndex: number } {
  const { monday, sunday } = getWeekBounds(referenceDate, weekOffset);

  // Set birthday to reference year
  const bdayThisYear = new Date(referenceDate.getFullYear(), date.getMonth(), date.getDate());

  if (bdayThisYear >= monday && bdayThisYear <= sunday) {
    return { inWeek: true, targetDate: bdayThisYear, dayOfWeekIndex: (bdayThisYear.getDay() + 6) % 7 };
  }

  // Check year edges
  const bdayNextYear = new Date(referenceDate.getFullYear() + 1, date.getMonth(), date.getDate());
  if (bdayNextYear >= monday && bdayNextYear <= sunday) {
    return { inWeek: true, targetDate: bdayNextYear, dayOfWeekIndex: (bdayNextYear.getDay() + 6) % 7 };
  }

  const bdayPrevYear = new Date(referenceDate.getFullYear() - 1, date.getMonth(), date.getDate());
  if (bdayPrevYear >= monday && bdayPrevYear <= sunday) {
    return { inWeek: true, targetDate: bdayPrevYear, dayOfWeekIndex: (bdayPrevYear.getDay() + 6) % 7 };
  }

  return { inWeek: false, targetDate: bdayThisYear, dayOfWeekIndex: (bdayThisYear.getDay() + 6) % 7 };
}

/**
 * Checks if a given month and day falls in the current calendar week (Monday to Sunday)
 */
export function isDateInCurrentWeek(date: Date, referenceDate: Date = new Date()): { inWeek: boolean; targetDate: Date } {
  const res = isDateInSpecifiedWeek(date, referenceDate, 0);
  return { inWeek: res.inWeek, targetDate: res.targetDate };
}

/**
 * Format a Date to French representation, e.g. "Jeudi 18 Septembre"
 */
export function formatFrenchBirthday(date: Date): string {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];

  return `${dayName} ${dayNum} ${monthName}`;
}

/**
 * Category hierarchy rank:
 * U7, U8, U9, U10, U11, U12, U13, U14, U15, U16, U17, U18, U20, U21 -> Seniors -> Loisirs/Vétérans -> Coachs -> Membres du Bureau / Bénévoles / Dirigeants
 */
export function getCategoryOrderRank(categoryStr: string = ''): number {
  const c = categoryStr.trim().toLowerCase();

  // Baby / Micro / U5 / U6
  if (c.includes('baby') || c.includes('micro') || c.includes('u5') || c.includes('u6')) return 60;
  if (/\bu[ -]?7\b|\bu7/i.test(c)) return 70;
  if (/\bu[ -]?8\b|\bu8/i.test(c)) return 80;
  if (/\bu[ -]?9\b|\bu9/i.test(c)) return 90;
  if (/\bu[ -]?10\b|\bu10/i.test(c)) return 100;
  if (/\bu[ -]?11\b|\bu11/i.test(c)) return 110;
  if (/\bu[ -]?12\b|\bu12/i.test(c)) return 120;
  if (/\bu[ -]?13\b|\bu13/i.test(c)) return 130;
  if (/\bu[ -]?14\b|\bu14/i.test(c)) return 140;
  if (/\bu[ -]?15\b|\bu15/i.test(c)) return 150;
  if (/\bu[ -]?16\b|\bu16/i.test(c)) return 160;
  if (/\bu[ -]?17\b|\bu17/i.test(c)) return 170;
  if (/\bu[ -]?18\b|\bu18/i.test(c)) return 180;
  if (/\bu[ -]?19\b|\bu19/i.test(c)) return 190;
  if (/\bu[ -]?20\b|\bu20/i.test(c)) return 200;
  if (/\bu[ -]?21\b|\bu21/i.test(c)) return 210;

  // Seniors
  if (
    c.includes('senior') ||
    c.includes('seniors') ||
    /\bsf\b|\bsg\b|\brf\b|\brm\b|\bnf\b|\bnm\b|\bdf\b|\bdm\b|\bprénat\b|\bprenat\b/i.test(c)
  ) {
    return 300;
  }

  // Loisirs / Vétérans
  if (c.includes('loisir') || c.includes('vétéran') || c.includes('veteran') || c.includes('ancien')) return 400;

  // Coachs / Entraîneurs / Staff technique
  if (c.includes('coach') || c.includes('entraîn') || c.includes('entrain') || c.includes('staff')) return 500;

  // Membres du Bureau / Dirigeants / Bénévoles / Arbitres / OTM
  if (
    c.includes('bureau') ||
    c.includes('dirigeant') ||
    c.includes('président') ||
    c.includes('president') ||
    c.includes('secrétaire') ||
    c.includes('secretaire') ||
    c.includes('trésorier') ||
    c.includes('tresorier') ||
    c.includes('bénévole') ||
    c.includes('benevole') ||
    c.includes('arbitre') ||
    c.includes('otm') ||
    c.includes('table') ||
    c.includes('comité') ||
    c.includes('comite')
  ) {
    return 600;
  }

  return 700; // Autre / Licencié
}

/**
 * Gender hierarchy rank within a category:
 * Filles/Féminines = 0 (en premier)
 * Garçons/Masculins = 1 (en second)
 * Non-spécifié / Mixte = 2
 */
export function getGenderOrderRank(categoryStr: string = ''): number {
  const c = categoryStr.trim().toLowerCase();

  // Check Fille / Féminine (e.g. U13F, U15 Filles, Seniors Féminines, SF, DF, RF, NF)
  if (
    c.includes('fille') ||
    c.includes('féminin') ||
    c.includes('feminin') ||
    /\bu\d+f\b/i.test(c) ||
    /\b[a-z]?f\d*\b/i.test(c) ||
    /\bf\b/i.test(c) ||
    c.endsWith('f')
  ) {
    return 0; // Filles first
  }

  // Check Garçon / Masculin (e.g. U13M, U13 Garçons, Seniors Masculins, SG, DM, RM, NM)
  if (
    c.includes('garçon') ||
    c.includes('garcon') ||
    c.includes('masculin') ||
    /\bu\d+m\b/i.test(c) ||
    /\bu\d+g\b/i.test(c) ||
    /\b[a-z]?m\d*\b/i.test(c) ||
    /\bm\b/i.test(c) ||
    /\bg\b/i.test(c) ||
    c.endsWith('m') ||
    c.endsWith('g')
  ) {
    return 1; // Garçons second
  }

  return 2; // Mixte / Non-précisé
}

/**
 * Sort birthdays strictly according to:
 * 1) Category Hierarchy: U7, U8, U9... -> Seniors -> Loisirs -> Coachs -> Membres du bureau / Bénévoles
 * 2) Gender: Filles en premier, puis Garçons
 * 3) Alphabetical order by first name
 */
export function sortBirthdaysByHierarchy(birthdays: BirthdayItem[]): BirthdayItem[] {
  return [...birthdays].sort((a, b) => {
    const rankCatA = getCategoryOrderRank(a.teamCategory);
    const rankCatB = getCategoryOrderRank(b.teamCategory);
    if (rankCatA !== rankCatB) {
      return rankCatA - rankCatB;
    }

    const rankGenA = getGenderOrderRank(a.teamCategory);
    const rankGenB = getGenderOrderRank(b.teamCategory);
    if (rankGenA !== rankGenB) {
      return rankGenA - rankGenB;
    }

    // Tertiary: First name alphabetical
    const nameA = (a.firstName || a.fullName || '').toLowerCase();
    const nameB = (b.firstName || b.fullName || '').toLowerCase();
    return nameA.localeCompare(nameB, 'fr');
  });
}

/**
 * Filter and sort a list of birthday items for a specific week
 */
export function filterAndSortBirthdaysForWeek(
  birthdays: BirthdayItem[],
  referenceDate: Date = new Date(),
  weekOffset: number = 0
): BirthdayItem[] {
  const filtered: BirthdayItem[] = [];

  birthdays.forEach((b) => {
    if (!b.birthDate) return;
    const d = new Date(b.birthDate);
    if (isNaN(d.getTime())) return;

    const check = isDateInSpecifiedWeek(d, referenceDate, weekOffset);
    if (check.inWeek) {
      filtered.push({
        ...b,
        birthDayFormatted: formatFrenchBirthday(check.targetDate),
        isThisWeek: weekOffset === 0,
      });
    }
  });

  // Sort by category hierarchy (U7, U8... seniors, coach, membre du bureau) + Filles then Garçons
  return sortBirthdaysByHierarchy(filtered);
}

/**
 * Parse an Excel or CSV file to extract members' birthdays
 */
export async function parseExcelBirthdays(
  file: File,
  referenceDate: Date = new Date(),
  weekOffset: number = 0
): Promise<{
  allMembers: BirthdayItem[];
  weekBirthdays: BirthdayItem[];
  totalParsed: number;
  errors: string[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Le fichier Excel ne contient aucune feuille.');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length < 2) {
          throw new Error('Le fichier ne contient pas assez de données (au moins 1 ligne d\'en-tête et 1 ligne de données requises).');
        }

        const headerRow = (rows[0] as any[]).map((col) => String(col || '').trim().toLowerCase());

        // Locate columns
        let firstNameIdx = headerRow.findIndex((h) => h.includes('prénom') || h.includes('prenom') || h.includes('first name') || h.includes('firstname'));
        let lastNameIdx = headerRow.findIndex((h) => (h.includes('nom') || h.includes('last name') || h.includes('surname')) && !h.includes('prénom') && !h.includes('prenom'));
        let fullNameIdx = headerRow.findIndex((h) =>
          h.includes('nom complet') || h.includes('licencié') || h.includes('joueur') || h.includes('adhérent') || h.includes('personne') || (h.includes('nom') && h.includes('prénom'))
        );

        let genderIdx = headerRow.findIndex((h) =>
          h.includes('sexe') || h.includes('genre') || h.includes('gender') || h === 's' || h === 'g' || h.includes('masculin') || h.includes('féminin')
        );

        let bdayIdx = headerRow.findIndex((h) =>
          h.includes('naissance') || h.includes('anniversaire') || h.includes('date') || h.includes('birth') || h.includes('né') || h.includes('ddn')
        );

        let categoryIdx = headerRow.findIndex((h) =>
          h.includes('catégorie') || h.includes('categorie') || h.includes('équipe') || h.includes('equipe') || h.includes('role') || h.includes('rôle') || h.includes('section') || h.includes('groupe')
        );

        // Fallback default column indices if headers aren't standard
        if (firstNameIdx === -1 && fullNameIdx === -1 && lastNameIdx === -1) {
          firstNameIdx = 0;
        }
        if (bdayIdx === -1) {
          bdayIdx = 1;
        }
        if (categoryIdx === -1) {
          categoryIdx = 2;
        }

        const allMembers: BirthdayItem[] = [];
        const weekBirthdays: BirthdayItem[] = [];
        const errors: string[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0 || row.every((c: any) => c === '')) continue;

          let rawFirst = firstNameIdx !== -1 ? String(row[firstNameIdx] || '').trim() : '';
          let rawLast = lastNameIdx !== -1 ? String(row[lastNameIdx] || '').trim() : '';
          let rawFull = fullNameIdx !== -1 ? String(row[fullNameIdx] || '').trim() : '';
          let rawGender = genderIdx !== -1 ? String(row[genderIdx] || '').trim() : '';

          let firstName = '';
          let lastName = '';
          let fullName = '';

          if (rawFirst && rawLast) {
            firstName = formatNameCapitalized(rawFirst);
            lastName = rawLast.toUpperCase();
            fullName = `${firstName} ${lastName}`;
          } else if (rawFirst) {
            firstName = extractFirstName(rawFirst);
            fullName = rawFirst;
          } else if (rawFull) {
            firstName = extractFirstName(rawFull);
            fullName = rawFull;
          } else if (rawLast) {
            firstName = extractFirstName(rawLast);
            fullName = rawLast;
          }

          if (!firstName && !fullName) continue;
          if (!firstName) firstName = fullName;

          const rawDate = row[bdayIdx];
          let parsedDate: Date | null = null;

          if (rawDate instanceof Date && !isNaN(rawDate.getTime())) {
            parsedDate = rawDate;
          } else if (typeof rawDate === 'number') {
            // Excel serial date number
            const d = XLSX.SSF.parse_date_code(rawDate);
            if (d) {
              parsedDate = new Date(d.y, d.m - 1, d.d);
            }
          } else if (typeof rawDate === 'string' && rawDate.trim()) {
            const str = rawDate.trim();
            // Try French DD/MM/YYYY or DD-MM-YYYY
            const parts = str.split(/[/.-]/);
            if (parts.length === 3) {
              const day = parseInt(parts[0], 10);
              const month = parseInt(parts[1], 10) - 1;
              let year = parseInt(parts[2], 10);
              if (year < 100) year += 2000;
              parsedDate = new Date(year, month, day);
            } else {
              const fallback = new Date(str);
              if (!isNaN(fallback.getTime())) {
                parsedDate = fallback;
              }
            }
          }

          if (!parsedDate || isNaN(parsedDate.getTime())) {
            errors.push(`Ligne ${i + 1} (${firstName}) : date de naissance invalide "${rawDate}".`);
            continue;
          }

          const rawCat = categoryIdx !== -1 && row[categoryIdx] ? String(row[categoryIdx]) : '';
          const categoryTeam = extractCleanCategory(rawCat, rawGender, firstName);

          const { inWeek, targetDate, dayOfWeekIndex } = isDateInSpecifiedWeek(parsedDate, referenceDate, weekOffset);
          const age = referenceDate.getFullYear() - parsedDate.getFullYear();

          const item: BirthdayItem = {
            id: `bd-parsed-${i}-${Date.now()}`,
            fullName: fullName || firstName,
            firstName,
            lastName: lastName || undefined,
            birthDate: parsedDate.toISOString().split('T')[0],
            birthDayFormatted: formatFrenchBirthday(targetDate),
            age: age > 0 ? age : undefined,
            teamCategory: categoryTeam,
            isThisWeek: inWeek,
          };

          allMembers.push(item);
          if (inWeek) {
            weekBirthdays.push(item);
          }
        }

        // Sort week birthdays by category hierarchy (U7, U8... seniors, coach, bureau) and gender (filles then garçons)
        const sortedWeekBirthdays = sortBirthdaysByHierarchy(weekBirthdays);
        const sortedAllMembers = sortBirthdaysByHierarchy(allMembers);

        resolve({
          allMembers: sortedAllMembers,
          weekBirthdays: sortedWeekBirthdays,
          totalParsed: allMembers.length,
          errors,
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Erreur lors de la lecture du fichier Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generate a clean sample Excel template for the club
 */
export function generateClubBirthdayTemplate(): void {
  const sampleData = [
    { 'Prénom': 'Léna', 'Nom': 'Petit', 'Catégorie': 'U7 Filles', 'Date de Naissance': '15/09/2019' },
    { 'Prénom': 'Noah', 'Nom': 'Moreau', 'Catégorie': 'U7 Garçons', 'Date de Naissance': '16/09/2019' },
    { 'Prénom': 'Chloé', 'Nom': 'Roux', 'Catégorie': 'U9 Filles', 'Date de Naissance': '17/09/2017' },
    { 'Prénom': 'Hugo', 'Nom': 'Fournier', 'Catégorie': 'U9 Garçons', 'Date de Naissance': '18/09/2017' },
    { 'Prénom': 'Emma', 'Nom': 'Leroy', 'Catégorie': 'U13 Féminines', 'Date de Naissance': '16/09/2014' },
    { 'Prénom': 'Arthur', 'Nom': 'Garcia', 'Catégorie': 'U13 Masculins', 'Date de Naissance': '17/09/2014' },
    { 'Prénom': 'Clara', 'Nom': 'Dubois', 'Catégorie': 'U15 Féminines', 'Date de Naissance': '18/09/2012' },
    { 'Prénom': 'Lucas', 'Nom': 'Mercier', 'Catégorie': 'U17 Garçons', 'Date de Naissance': '16/09/2009' },
    { 'Prénom': 'Sarah', 'Nom': 'Martin', 'Catégorie': 'Seniors Féminines', 'Date de Naissance': '19/09/1998' },
    { 'Prénom': 'Thomas', 'Nom': 'Bernard', 'Catégorie': 'Seniors Masculins', 'Date de Naissance': '19/09/1992' },
    { 'Prénom': 'Julien', 'Nom': 'Robert', 'Catégorie': 'Coach U15', 'Date de Naissance': '20/09/1985' },
    { 'Prénom': 'David', 'Nom': 'Laurent', 'Catégorie': 'Membre du Bureau', 'Date de Naissance': '21/09/1976' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Licenciés Anniversaires');
  XLSX.writeFile(wb, 'modele_anniversaires_club.xlsx');
}

