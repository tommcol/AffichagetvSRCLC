import * as XLSX from 'xlsx';
import { BirthdayItem } from '../types';

/**
 * Checks if a given month and day falls in the current calendar week (Monday to Sunday)
 */
export function isDateInCurrentWeek(date: Date, referenceDate: Date = new Date()): { inWeek: boolean; targetDate: Date } {
  // Get Monday of reference week
  const curr = new Date(referenceDate);
  const dayOfWeek = curr.getDay(); // 0 = Dimanche, 1 = Lundi, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  
  const monday = new Date(curr);
  monday.setDate(curr.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  // Set the birthday to the reference year
  const bdayThisYear = new Date(referenceDate.getFullYear(), date.getMonth(), date.getDate());

  if (bdayThisYear >= monday && bdayThisYear <= sunday) {
    return { inWeek: true, targetDate: bdayThisYear };
  }

  // Also check if reference is near year-end/new-year
  const bdayNextYear = new Date(referenceDate.getFullYear() + 1, date.getMonth(), date.getDate());
  if (bdayNextYear >= monday && bdayNextYear <= sunday) {
    return { inWeek: true, targetDate: bdayNextYear };
  }

  const bdayPrevYear = new Date(referenceDate.getFullYear() - 1, date.getMonth(), date.getDate());
  if (bdayPrevYear >= monday && bdayPrevYear <= sunday) {
    return { inWeek: true, targetDate: bdayPrevYear };
  }

  return { inWeek: false, targetDate: bdayThisYear };
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
 * Parse an Excel or CSV file to extract members' birthdays
 */
export async function parseExcelBirthdays(
  file: File,
  referenceDate: Date = new Date()
): Promise<{ allMembers: BirthdayItem[]; weekBirthdays: BirthdayItem[]; totalParsed: number; errors: string[] }> {
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
        let nameIdx = headerRow.findIndex((h) =>
          h.includes('nom') || h.includes('prénom') || h.includes('prenom') || h.includes('licencié') || h.includes('joueur') || h.includes('nom complet')
        );
        let firstNameIdx = headerRow.findIndex((h) => h.includes('prénom') || h.includes('prenom'));
        let lastNameIdx = headerRow.findIndex((h) => h.includes('nom') && !h.includes('prénom') && !h.includes('prenom'));

        let bdayIdx = headerRow.findIndex((h) =>
          h.includes('naissance') || h.includes('anniversaire') || h.includes('date') || h.includes('birth') || h.includes('né')
        );

        let categoryIdx = headerRow.findIndex((h) =>
          h.includes('catégorie') || h.includes('categorie') || h.includes('équipe') || h.includes('equipe') || h.includes('role') || h.includes('rôle') || h.includes('section')
        );

        // Fallback default column indices if headers aren't standard
        if (nameIdx === -1 && lastNameIdx === -1) {
          nameIdx = 0;
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

          let fullName = '';
          if (firstNameIdx !== -1 && lastNameIdx !== -1 && firstNameIdx !== lastNameIdx) {
            const first = String(row[firstNameIdx] || '').trim();
            const last = String(row[lastNameIdx] || '').trim();
            fullName = `${first} ${last}`.trim();
          } else if (nameIdx !== -1) {
            fullName = String(row[nameIdx] || '').trim();
          }

          if (!fullName) continue;

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
            errors.push(`Ligne ${i + 1} (${fullName}) : date invalide "${rawDate}".`);
            continue;
          }

          const categoryTeam = categoryIdx !== -1 && row[categoryIdx]
            ? String(row[categoryIdx]).trim()
            : 'Licencié Club';

          const { inWeek, targetDate } = isDateInCurrentWeek(parsedDate, referenceDate);
          const age = referenceDate.getFullYear() - parsedDate.getFullYear();

          const item: BirthdayItem = {
            id: `bd-parsed-${i}-${Date.now()}`,
            fullName,
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

        // Sort week birthdays by day of week
        weekBirthdays.sort((a, b) => {
          const dayA = new Date(a.birthDate).getDate();
          const dayB = new Date(b.birthDate).getDate();
          return dayA - dayB;
        });

        resolve({
          allMembers,
          weekBirthdays,
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
 * Generate a sample Excel template for the club
 */
export function generateClubBirthdayTemplate(): void {
  const sampleData = [
    { 'Nom et Prénom': 'Lucas Mercier', 'Date de Naissance': '16/09/2010', 'Équipe / Rôle': 'U17 Masculins 1' },
    { 'Nom et Prénom': 'Clara Dubois', 'Date de Naissance': '18/09/2013', 'Équipe / Rôle': 'U15 Féminines' },
    { 'Nom et Prénom': 'Thomas Bernard', 'Date de Naissance': '19/09/1988', 'Équipe / Rôle': 'Entraîneur Seniors' },
    { 'Nom et Prénom': 'Maxime Petit', 'Date de Naissance': '20/09/2015', 'Équipe / Rôle': 'U13 Garçons' },
    { 'Nom et Prénom': 'Sarah Martin', 'Date de Naissance': '12/10/2004', 'Équipe / Rôle': 'Seniors Filles 1' },
    { 'Nom et Prénom': 'Julien Lambert', 'Date de Naissance': '05/11/1995', 'Équipe / Rôle': 'Seniors Garçons 1' },
    { 'Nom et Prénom': 'Michel Roy', 'Date de Naissance': '14/09/1972', 'Équipe / Rôle': 'Président / Bénévole' },
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Licenciés Anniversaires');
  XLSX.writeFile(wb, 'modele_anniversaires_club_basket.xlsx');
}
