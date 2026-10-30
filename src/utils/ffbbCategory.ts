import type { MatchItem } from '../types';
export function normalizeFFBBCategory(rawTeam?: string, competition?: string): {
  badgeCategory: string;
  displayName: string;
  gender: 'M' | 'F' | 'Mixte';
} {
  const comp = (competition || '').trim();
  const compLower = comp.toLowerCase();
  const raw = (rawTeam || '').trim();
  const rawLower = raw.toLowerCase();

  const isFem = compLower.includes('féminin') || compLower.includes('feminin') || compLower.includes('fille') || rawLower.includes(' f') || /u\d+\s*f/i.test(rawLower);
  const isMasc = compLower.includes('masculin') || compLower.includes('garçon') || compLower.includes('garcon') || rawLower.includes(' m') || rawLower.includes(' g') || /u\d+\s*[mg]/i.test(rawLower);
  const gender: 'M' | 'F' | 'Mixte' = isFem ? 'F' : (isMasc ? 'M' : 'Mixte');

  const uMatch = compLower.match(/u\s*(\d+)/i) || rawLower.match(/u\s*(\d+)/i);
  const numMatch = raw.match(/(\d+)$/) || comp.match(/équipe\s*(\d+)/i) || comp.match(/division\s*(\d+)/i);
  const num = numMatch ? numMatch[1] : '1';

  if (uMatch) {
    const age = uMatch[1];
    const gLetter = isFem ? 'F' : (isMasc ? 'M' : '');
    const gWord = isFem ? 'Filles' : (isMasc ? 'Garçons' : 'Mixte');
    return {
      badgeCategory: `U${age} ${gLetter}${num}`.trim(),
      displayName: `U${age} ${gWord} ${num}`.trim(),
      gender,
    };
  }

  if (compLower.includes('senior') || rawLower.includes('senior')) {
    const gLetter = isFem ? 'F' : 'M';
    const gWord = isFem ? 'Filles' : 'Garçons';
    return {
      badgeCategory: `Seniors ${gLetter}${num}`,
      displayName: `Seniors ${gWord} ${num}`,
      gender,
    };
  }

  return {
    badgeCategory: raw || 'Seniors',
    displayName: raw || comp || 'Équipe Club',
    gender,
  };
}

/**
 * Normalise une chaîne de catégorie en clé standardisée unique (ex: "U18 F1", "SENIORS M1")
 * Permet d'identifier une équipe de façon fiable d'une semaine à l'autre même en cas de légère variation de libellé.
 */
export function normalizeCategoryKey(raw?: string): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const normalized = normalizeFFBBCategory(clean);
  const key = (normalized.badgeCategory || clean).trim().toUpperCase();
  // Standardise la lettre Garçons ('G' -> 'M') pour éviter les disparités
  return key.replace(/\bG(\d*)\b/g, 'M$1').replace(/\s+/g, ' ');
}


// Repair the old importer that stored another club's name as a category.
export function repairLegacyCategory(previous: MatchItem, incoming: MatchItem): boolean {
  const raw = previous.rawFfbbCategory;
  return !!incoming.ffbbClubId && !!raw && raw === previous.category
    && !/^(U\d+|seniors|équipe)\b/i.test(raw);
}
