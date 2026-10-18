// ============================================================
// Bot Telegram (webhook, reconnaissance d’équipes, alertes)
// ============================================================

import { Env } from './types';
import { getAlertDeduplicationKey } from './alerts';
import { normalizeCategoryKey } from './ffbb';

// ============================================================
// ALERTES VICTOIRE / DÉFAITE & TÉLÉGRAM
// ============================================================

// ============================================================
// Équipes configurées et reconnaissance intelligente des équipes Telegram
// ============================================================

export interface TeamVisualItemWorker {
  id: string;
  teamName: string;
  shortAliases: string[];
  category: string;
  winVisualUrl?: string;
  lossVisualUrl?: string;
}

export const DEFAULT_CANONICAL_TEAMS_WORKER: TeamVisualItemWorker[] = [
  {
    id: 'tv-sg1',
    teamName: 'Seniors Garçons 1',
    shortAliases: [
      'sg1', 'sg 1', 'sm1', 'sm 1', 'seniors 1', 'seniors garcons 1', 'seniors garçons 1',
      'seniors g1', 'seniors m1', 'seniors masculins 1', 'sg', 'seniors garcons', 'seniors garçons',
      'seniors m', 'seniors masculins',
    ],
    category: 'Seniors Garçons',
  },
  {
    id: 'tv-sg2',
    teamName: 'Seniors Garçons 2',
    shortAliases: [
      'sg2', 'sg 2', 'sm2', 'sm 2', 'seniors 2', 'seniors garcons 2', 'seniors garçons 2',
      'seniors g2', 'seniors m2', 'seniors masculins 2',
    ],
    category: 'Seniors Garçons',
  },
  {
    id: 'tv-sf',
    teamName: 'Seniors Filles 1',
    shortAliases: [
      'sf1', 'sf 1', 'seniors filles 1', 'seniors f1', 'seniors f 1', 'seniors feminines 1',
      'seniors féminines 1', 'sf', 'seniors filles', 'seniors f', 'seniors feminines', 'seniors féminines',
    ],
    category: 'Seniors Féminines',
  },
  {
    id: 'tv-u18m',
    teamName: 'U18 Garçons 1',
    shortAliases: [
      'u18m', 'u18g', 'u18 garcons', 'u18 garçons', 'u18 garcons 1', 'u18 garçons 1',
      'u18 masculins', 'u18m1', 'u18g1', 'u18 m', 'u18 g',
    ],
    category: 'Jeunes U18',
  },
  {
    id: 'tv-u18f',
    teamName: 'U18 Filles 1',
    shortAliases: [
      'u18f', 'u18 filles', 'u18 f', 'u18 filles 1', 'u18f1', 'u18 feminines', 'u18 féminines', 'u18f 1',
    ],
    category: 'Jeunes U18',
  },
  {
    id: 'tv-u15m',
    teamName: 'U15 Garçons 1',
    shortAliases: [
      'u15m', 'u15g', 'u15 garcons', 'u15 garçons', 'u15 garcons 1', 'u15 garçons 1',
      'u15 masculins', 'u15m1', 'u15g1', 'u15 m', 'u15 g',
    ],
    category: 'Jeunes U15',
  },
  {
    id: 'tv-u15f',
    teamName: 'U15 Filles 1',
    shortAliases: [
      'u15f', 'u15 filles', 'u15 f', 'u15 filles 1', 'u15f1', 'u15 feminines', 'u15 féminines', 'u15f 1',
    ],
    category: 'Jeunes U15',
  },
  {
    id: 'tv-u13m',
    teamName: 'U13 Garçons 1',
    shortAliases: [
      'u13m', 'u13g', 'u13 garcons', 'u13 garçons', 'u13 garcons 1', 'u13 garçons 1',
      'u13 masculins', 'u13m1', 'u13g1', 'u13 m', 'u13 g',
    ],
    category: 'Jeunes U13',
  },
  {
    id: 'tv-u13f1',
    teamName: 'U13 Filles 1',
    shortAliases: [
      'u13f 1', 'u13f1', 'u13 filles 1', 'u13f-1', 'u13 f 1', 'u13 f1', 'u13 feminines 1', 'u13 féminines 1',
    ],
    category: 'Jeunes U13',
  },
  {
    id: 'tv-u13f2',
    teamName: 'U13 Filles 2',
    shortAliases: [
      'u13f 2', 'u13f2', 'u13 filles 2', 'u13f-2', 'u13 f 2', 'u13 f2', 'u13 feminines 2', 'u13 féminines 2',
    ],
    category: 'Jeunes U13',
  },
  {
    id: 'tv-u11m',
    teamName: 'U11 Garçons 1',
    shortAliases: [
      'u11m', 'u11g', 'u11 garcons', 'u11 garçons', 'u11 garcons 1', 'u11 garçons 1',
      'u11 masculins', 'u11m1', 'u11g1', 'u11 m', 'u11 g',
    ],
    category: 'École de Basket U11',
  },
  {
    id: 'tv-u11f',
    teamName: 'U11 Filles 1',
    shortAliases: [
      'u11f', 'u11 filles', 'u11 f', 'u11 filles 1', 'u11f1', 'u11 feminines', 'u11 féminines', 'u11f 1',
    ],
    category: 'École de Basket U11',
  },
  {
    id: 'tv-u9-mixte',
    // Règle explicite : Une équipe U9 Garçons qui joue en mixte doit pouvoir être reconnue
    // sous ses deux appellations, reliées à la même équipe.
    teamName: 'U9 Garçons / Mixte',
    shortAliases: [
      'u9 garcons', 'u9 garçons', 'u9g', 'u9m', 'u9 g', 'u9 m', 'u9 garcons 1', 'u9 garçons 1', 'u9 masculins', 'u9g1', 'u9m1',
      'u9 mixte', 'u9mixte', 'u9 mix', 'u9', 'u9 mixtes', 'u9mixtes',
    ],
    category: 'École de Basket U9',
  },
  {
    id: 'tv-u9f',
    teamName: 'U9 Filles 1',
    shortAliases: [
      'u9f', 'u9 filles', 'u9 f', 'u9 filles 1', 'u9f1', 'u9 feminines', 'u9 féminines', 'u9f 1',
    ],
    category: 'École de Basket U9',
  },
];

export const DEFAULT_REAL_FFBB_TEAMS_WORKER = [
  { id: 'team-200000005335541', name: 'Seniors Filles 1', category: 'Seniors F1', gender: 'F' },
  { id: 'team-200000005335759', name: 'Seniors Garçons 1', category: 'Seniors M1', gender: 'M' },
  { id: 'team-200000005335760', name: 'Seniors Garçons 2', category: 'Seniors M2', gender: 'M' },
  { id: 'team-200000005361201', name: 'U18 Filles 1', category: 'U18 F1', gender: 'F' },
  { id: 'team-200000005360595', name: 'U18 Garçons 1', category: 'U18 M1', gender: 'M' },
  { id: 'team-200000005361338', name: 'U15 Filles 1', category: 'U15 F1', gender: 'F' },
  { id: 'team-200000005360457', name: 'U13 Garçons 1', category: 'U13 M1', gender: 'M' },
  { id: 'team-200000005360524', name: 'U13 Filles 1', category: 'U13 F1', gender: 'F' },
  { id: 'team-200000005360525', name: 'U13 Filles 2', category: 'U13 F2', gender: 'F' },
  { id: 'team-200000005363537', name: 'U11 Filles 1', category: 'U11 F1', gender: 'F' },
  { id: 'team-200000005363354', name: 'U11 Garçons 1', category: 'U11 M1', gender: 'M' },
  { id: 'team-200000005363355', name: 'U9 Garçons / Mixte', category: 'U9 Mixte', gender: 'Mixte' },
  { id: 'team-200000005363356', name: 'U9 Filles 1', category: 'U9 F1', gender: 'F' },
];

export function normalizeTeamString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’\-_/\\.:,;+*#~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDist(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) d[i] = [i];
  for (let j = 0; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
    }
  }
  return d[m][n];
}

export function strSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDist(a, b) / maxLen;
}

export function getTeamNormalizedVariations(tv: any): string[] {
  const set = new Set<string>();
  const add = (s?: string) => {
    if (!s) return;
    const norm = normalizeTeamString(s);
    if (norm) {
      set.add(norm);
      const noSpace = norm.replace(/\s+/g, '');
      if (noSpace.length > 1) set.add(noSpace);
    }
  };

  add(tv.teamName);
  add(tv.category);
  if (Array.isArray(tv.shortAliases)) {
    tv.shortAliases.forEach(add);
  }

  const normName = normalizeTeamString(tv.teamName || '');
  if (normName.includes('u9') && (normName.includes('mixte') || normName.includes('garcon'))) {
    add('u9 garcons');
    add('u9 garcons 1');
    add('u9 mixte');
    add('u9 mix');
    add('u9');
    add('u9g');
    add('u9m');
  }

  return Array.from(set);
}

export function parseTeamComponents(normStr: string) {
  const result: { age?: string; gender?: string; teamNumber?: string } = {};

  const ageMatch = normStr.match(/\b(u\s*0?([79]|1[13578]|20))\b/);
  if (ageMatch) {
    result.age = 'u' + ageMatch[2];
  } else if (/\bsenior(s)?\b|\bsg\b|\bsf\b|\bsm\b/.test(normStr)) {
    result.age = 'seniors';
  }

  if (/\b(fille(s)?|feminine(s)?|f)\b/.test(normStr) || normStr.startsWith('sf') || normStr.includes('u18f') || normStr.includes('u15f') || normStr.includes('u13f') || normStr.includes('u11f') || normStr.includes('u9f')) {
    result.gender = 'f';
  } else if (/\b(mixte(s)?|mix)\b/.test(normStr)) {
    result.gender = 'mixte';
  } else if (/\b(garcon(s)?|masculin(s)?|m|g)\b/.test(normStr) || normStr.startsWith('sg') || normStr.startsWith('sm')) {
    result.gender = 'm';
  }

  if (result.age === 'u9' && (result.gender === 'm' || result.gender === 'mixte')) {
    result.gender = 'mixte';
  }

  const numMatch = normStr.match(/\b([123])\b/) || normStr.match(/(?:f|m|g|sg|sf|sm|u\d+f|u\d+m|u\d+g)\s*([123])/);
  if (numMatch) {
    result.teamNumber = numMatch[1];
  }

  return result;
}

export function findClosestTeams(rawInput: string, configuredTeams: any[], limit = 3): string[] {
  const normInput = normalizeTeamString(rawInput);
  const inputComponents = parseTeamComponents(normInput);
  const scored: { name: string; score: number }[] = [];

  for (const tv of configuredTeams) {
    const variations = tv.variations || getTeamNormalizedVariations(tv);
    const tvComponents = parseTeamComponents(normalizeTeamString(tv.teamName || ''));
    let bestScore = 0;

    for (const v of variations) {
      let score = strSimilarity(normInput, v);
      if (v.includes(normInput) || normInput.includes(v)) {
        score = Math.max(score, 0.75);
      }
      if (inputComponents.age && tvComponents.age && inputComponents.age === tvComponents.age) {
        score += 0.3;
      }
      if (inputComponents.gender && tvComponents.gender && inputComponents.gender === tvComponents.gender) {
        score += 0.2;
      }
      if (score > bestScore) bestScore = score;
    }

    scored.push({ name: tv.teamName, score: bestScore });
  }

  scored.sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  const results: string[] = [];
  for (const s of scored) {
    if (!seen.has(s.name)) {
      seen.add(s.name);
      results.push(s.name);
      if (results.length >= limit) break;
    }
  }
  return results;
}

export function matchConfiguredTeam(rawInput: string, appData?: any) {
  const customMap = (appData?.clubSettings?.customTeamNames as Record<string, string>) || {};
  const rawFfbbTeams = (appData?.ffbbTeams && Array.isArray(appData.ffbbTeams) && appData.ffbbTeams.length > 0)
    ? appData.ffbbTeams
    : DEFAULT_REAL_FFBB_TEAMS_WORKER;
  const rawVisuals = (appData?.teamVisuals && Array.isArray(appData.teamVisuals) && appData.teamVisuals.length > 0)
    ? appData.teamVisuals
    : DEFAULT_CANONICAL_TEAMS_WORKER;

  // Construire la liste unifiée des équipes identifiables
  const configuredTeams = rawFfbbTeams.map((ffbbTeam: any) => {
    const customName = customMap[ffbbTeam.id] || customMap[ffbbTeam.category] || ffbbTeam.customName;
    const displayName = customName || ffbbTeam.name;

    const normOfficial = normalizeTeamString(ffbbTeam.name || '');
    const normCat = normalizeTeamString(ffbbTeam.category || '');
    const normCustom = customName ? normalizeTeamString(customName) : '';

    const matchingVisual = rawVisuals.find((v: any) => {
      const vNorm = normalizeTeamString(v.teamName || '');
      if (v.id === ffbbTeam.id) return true;
      if (vNorm === normOfficial || vNorm === normCat || (normCustom && vNorm === normCustom)) return true;
      if (normOfficial.includes('u9') && vNorm.includes('u9')) {
        const isF = ffbbTeam.gender === 'F' || normOfficial.includes('fille');
        const vIsF = vNorm.includes('fille') || vNorm.includes('u9f');
        return isF === vIsF;
      }
      if (normOfficial.includes('seniors filles') && vNorm.includes('seniors filles')) return true;
      if (normOfficial.includes('seniors') && vNorm.includes('seniors')) {
        const isF = ffbbTeam.gender === 'F' || normOfficial.includes('fille');
        const vIsF = vNorm.includes('fille');
        if (isF !== vIsF) return false;
        const numOfficial = normOfficial.match(/[12]/)?.[0] || '1';
        const numV = vNorm.match(/[12]/)?.[0] || '1';
        return numOfficial === numV;
      }
      return false;
    });

    const variationsSet = new Set<string>();
    const addVar = (s?: string) => {
      if (!s) return;
      const clean = normalizeTeamString(s);
      if (clean) {
        variationsSet.add(clean);
        const noSpace = clean.replace(/\s+/g, '');
        if (noSpace.length > 1) variationsSet.add(noSpace);
      }
    };

    addVar(displayName);
    addVar(ffbbTeam.name);
    addVar(ffbbTeam.category);
    if (customName) addVar(customName);

    if (matchingVisual && Array.isArray(matchingVisual.shortAliases)) {
      matchingVisual.shortAliases.forEach(addVar);
    }

    const isU9 = normOfficial.includes('u9') || normCat.includes('u9') || normCustom.includes('u9');
    const isSeniors = normOfficial.includes('senior') || normCat.includes('senior');
    const isU15 = normOfficial.includes('u15') || normCat.includes('u15');
    const isU18 = normOfficial.includes('u18') || normCat.includes('u18');
    const isU13 = normOfficial.includes('u13') || normCat.includes('u13');
    const isU11 = normOfficial.includes('u11') || normCat.includes('u11');

    if (isU9 && (ffbbTeam.gender === 'Mixte' || normOfficial.includes('mixte') || normOfficial.includes('garcon'))) {
      addVar('u9 mixte');
      addVar('u9 mixte 1');
      addVar('u9 mixtes');
      addVar('u9 mix');
      addVar('u9');
      addVar('u9m');
      addVar('u9g');
      addVar('u9 m');
      addVar('u9 g');
      addVar('u9 m1');
      addVar('u9 g1');
      addVar('u9 garcons');
      addVar('u9 garçons');
      addVar('u9 garcons 1');
      addVar('u9 garçons 1');
      addVar('u9 masculins');
      addVar('u9m1');
      addVar('u9g1');
    } else if (isU9 && ffbbTeam.gender === 'F') {
      addVar('u9f');
      addVar('u9 f');
      addVar('u9 filles');
      addVar('u9 filles 1');
      addVar('u9f1');
      addVar('u9 feminines');
      addVar('u9 féminines');
      addVar('u9f 1');
    }

    if (isU11 && ffbbTeam.gender === 'F') {
      addVar('u11f');
      addVar('u11 f');
      addVar('u11 filles');
      addVar('u11 filles 1');
      addVar('u11f1');
      addVar('u11 feminines');
      addVar('u11 féminines');
      addVar('u11f 1');
    } else if (isU11 && ffbbTeam.gender === 'M') {
      addVar('u11m');
      addVar('u11 m');
      addVar('u11g');
      addVar('u11 g');
      addVar('u11 garcons');
      addVar('u11 garçons');
      addVar('u11 garcons 1');
      addVar('u11 garçons 1');
      addVar('u11m1');
      addVar('u11 masculins');
    }

    if (isU13 && ffbbTeam.gender === 'F') {
      const isNum2 = normOfficial.includes('2') || normCat.includes('2') || (customName && customName.includes('2'));
      if (isNum2) {
        addVar('u13f 2');
        addVar('u13f2');
        addVar('u13 f 2');
        addVar('u13 f2');
        addVar('u13 filles 2');
        addVar('u13f-2');
        addVar('u13 feminines 2');
        addVar('u13 féminines 2');
      } else {
        addVar('u13f 1');
        addVar('u13f1');
        addVar('u13 f 1');
        addVar('u13 f1');
        addVar('u13 filles 1');
        addVar('u13f-1');
        addVar('u13 feminines 1');
        addVar('u13 féminines 1');
      }
    } else if (isU13 && ffbbTeam.gender === 'M') {
      addVar('u13m');
      addVar('u13 m');
      addVar('u13g');
      addVar('u13 g');
      addVar('u13 garcons');
      addVar('u13 garçons');
      addVar('u13 garcons 1');
      addVar('u13 garçons 1');
      addVar('u13m1');
      addVar('u13 masculins');
    }

    if (isU15 && ffbbTeam.gender === 'F') {
      addVar('u15f');
      addVar('u15 f');
      addVar('u15 filles');
      addVar('u15 filles 1');
      addVar('u15f1');
      addVar('u15 feminines');
      addVar('u15 féminines');
      addVar('u15f 1');
    }

    if (isU18 && ffbbTeam.gender === 'F') {
      addVar('u18f');
      addVar('u18 f');
      addVar('u18 filles');
      addVar('u18 filles 1');
      addVar('u18f1');
      addVar('u18 feminines');
      addVar('u18 féminines');
      addVar('u18f 1');
    } else if (isU18 && ffbbTeam.gender === 'M') {
      addVar('u18m');
      addVar('u18 m');
      addVar('u18g');
      addVar('u18 g');
      addVar('u18 garcons');
      addVar('u18 garçons');
      addVar('u18 garcons 1');
      addVar('u18 garçons 1');
      addVar('u18m1');
      addVar('u18 masculins');
    }

    if (isSeniors && ffbbTeam.gender === 'F') {
      addVar('seniors filles');
      addVar('seniors filles 1');
      addVar('seniors f');
      addVar('seniors f1');
      addVar('seniors f 1');
      addVar('sf');
      addVar('sf1');
      addVar('sf 1');
      addVar('seniors feminines');
      addVar('seniors féminines');
    } else if (isSeniors && ffbbTeam.gender === 'M') {
      const isNum2 = normOfficial.includes('2') || normCat.includes('2') || (customName && customName.includes('2'));
      if (isNum2) {
        addVar('seniors garcons 2');
        addVar('seniors garçons 2');
        addVar('seniors g2');
        addVar('seniors m2');
        addVar('seniors 2');
        addVar('sg2');
        addVar('sg 2');
        addVar('sm2');
        addVar('sm 2');
      } else {
        addVar('seniors garcons 1');
        addVar('seniors garçons 1');
        addVar('seniors g1');
        addVar('seniors m1');
        addVar('seniors 1');
        addVar('sg1');
        addVar('sg 1');
        addVar('sm1');
        addVar('sm 1');
        addVar('seniors garcons');
        addVar('seniors garçons');
        addVar('seniors m');
        addVar('seniors g');
        addVar('sg');
        addVar('sm');
      }
    }

    return {
      id: ffbbTeam.id,
      teamName: displayName,
      officialName: ffbbTeam.name,
      customName,
      category: ffbbTeam.category,
      gender: ffbbTeam.gender,
      variations: Array.from(variationsSet),
      winVisualUrl: matchingVisual?.winVisualUrl,
      lossVisualUrl: matchingVisual?.lossVisualUrl,
    };
  });

  const clean = rawInput ? rawInput.trim() : '';
  if (!clean) {
    return {
      matched: false,
      isAmbiguous: false,
      suggestions: configuredTeams.slice(0, 3).map((t: any) => t.teamName),
      reason: 'Nom d\'équipe vide',
    };
  }

  const normInput = normalizeTeamString(clean);
  const inputNoSpace = normInput.replace(/\s+/g, '');
  const inputComponents = parseTeamComponents(normInput);

  // 1. Égalité exacte parmi les variations
  const exactMatches: any[] = [];
  for (const team of configuredTeams) {
    if (team.variations.includes(normInput) || team.variations.includes(inputNoSpace)) {
      if (!exactMatches.some((m) => m.id === team.id)) {
        exactMatches.push(team);
      }
    }
  }

  if (exactMatches.length === 1) {
    return {
      matched: true,
      team: exactMatches[0],
      teamName: exactMatches[0].teamName,
      isAmbiguous: false,
      suggestions: [] as string[],
    };
  }

  if (exactMatches.length > 1) {
    return {
      matched: false,
      isAmbiguous: true,
      suggestions: exactMatches.map((t) => t.teamName).slice(0, 3),
      reason: `Plusieurs équipes correspondent à "${clean}"`,
    };
  }

  // 2. Règle U9 Garçons / Mixte / U9 M (les deux appellations désignent la même équipe)
  if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte')) {
    const u9MixteTeam = configuredTeams.find((t: any) => {
      const n = normalizeTeamString(t.teamName);
      const o = normalizeTeamString(t.officialName);
      const c = normalizeTeamString(t.category);
      return (n.includes('u9') || o.includes('u9') || c.includes('u9')) &&
        (t.gender === 'Mixte' || n.includes('mixte') || o.includes('mixte') || n.includes('garcon') || o.includes('garcon'));
    });
    if (u9MixteTeam) {
      return {
        matched: true,
        team: u9MixteTeam,
        teamName: u9MixteTeam.teamName,
        isAmbiguous: false,
        suggestions: [] as string[],
      };
    }
  }

  // 3. Analyse structurelle
  if (inputComponents.age) {
    const candidateTeams = configuredTeams.filter((t: any) => {
      const tComp = parseTeamComponents(normalizeTeamString(t.teamName) + ' ' + normalizeTeamString(t.officialName));
      if (tComp.age !== inputComponents.age) return false;
      if (inputComponents.gender && tComp.gender) {
        if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte')) {
          if (tComp.gender !== 'm' && tComp.gender !== 'mixte') return false;
        } else if (inputComponents.gender !== tComp.gender) {
          return false;
        }
      }
      if (inputComponents.teamNumber && tComp.teamNumber) {
        if (inputComponents.teamNumber !== tComp.teamNumber) return false;
      }
      return true;
    });

    if (candidateTeams.length === 1) {
      return {
        matched: true,
        team: candidateTeams[0],
        teamName: candidateTeams[0].teamName,
        isAmbiguous: false,
        suggestions: [] as string[],
      };
    }

    if (candidateTeams.length > 1) {
      return {
        matched: false,
        isAmbiguous: true,
        suggestions: candidateTeams.map((t) => t.teamName).slice(0, 3),
        reason: `Nom ambigu : plusieurs équipes (${candidateTeams.map((t) => t.teamName).join(', ')}) correspondent à "${clean}"`,
      };
    }
  }

  // 4. Proposer jusqu'à 3 équipes proches
  const suggestions = findClosestTeams(clean, configuredTeams, 3);
  return {
    matched: false,
    isAmbiguous: false,
    suggestions,
    reason: `Équipe non configurée : "${clean}" ne correspond à aucune équipe active de l'application`,
  };
}

export function parseTelegramMatchMessage(text: string): {
  isWin: boolean | null;
  teamRaw: string;
  ourScore?: number;
  opponentScore?: number;
  opponent?: string;
} {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  let isWin: boolean | null = null;
  if (lower.startsWith('/victoire') || lower.startsWith('victoire') || lower.includes('gagné') || lower.includes('gagne') || lower.includes('win')) {
    isWin = true;
  } else if (lower.startsWith('/defaite') || lower.startsWith('/défaite') || lower.startsWith('defaite') || lower.startsWith('défaite') || lower.includes('perdu') || lower.includes('loss')) {
    isWin = false;
  }

  // Extract scores if present: e.g. "82-74", "82 - 74", "82/74", "82 74"
  let ourScore: number | undefined;
  let opponentScore: number | undefined;

  const scoreRegex = /(\b\d{1,3}\b)\s*[-–/:]\s*(\b\d{1,3}\b)/;
  const scoreMatch = clean.match(scoreRegex);

  let textWithoutScore = clean;
  if (scoreMatch) {
    const s1 = parseInt(scoreMatch[1], 10);
    const s2 = parseInt(scoreMatch[2], 10);
    textWithoutScore = clean.replace(scoreRegex, '').trim();

    if (isWin === true) {
      ourScore = Math.max(s1, s2);
      opponentScore = Math.min(s1, s2);
    } else if (isWin === false) {
      ourScore = Math.min(s1, s2);
      opponentScore = Math.max(s1, s2);
    } else {
      ourScore = s1;
      opponentScore = s2;
      isWin = s1 >= s2;
    }
  }

  // Remove command or trigger words from text to find the raw team name
  let teamPart = textWithoutScore
    .replace(/^(\/victoire|\/defaite|\/défaite|victoire|defaite|défaite|gagné|perdu|win|loss)/i, '')
    .replace(/(contre|vs|face à|face a)/i, 'contre')
    .trim();

  let opponent: string | undefined;
  if (teamPart.toLowerCase().includes('contre')) {
    const parts = teamPart.split(/contre/i);
    teamPart = parts[0]?.trim() || '';
    opponent = parts[1]?.trim() || undefined;
  }

  return {
    isWin: isWin ?? true,
    teamRaw: teamPart,
    ourScore,
    opponentScore,
    opponent,
  };
}

export function hasConfirmedMatchResult(match: any): boolean {
  return Boolean(
    match &&
    (
      match.result === 'win' ||
      match.result === 'loss' ||
      (match.homeScore !== undefined && match.awayScore !== undefined)
    )
  );
}

export function normalizeResultDate(date?: string): string {
  if (!date) return '';
  const clean = String(date).trim();
  const iso = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const euro = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (euro) return euro[3] + '-' + euro[2].padStart(2, '0') + '-' + euro[1].padStart(2, '0');
  return '';
}

export function getDateDistanceScore(date: string, now: number): number {
  const normalized = normalizeResultDate(date);
  if (!normalized) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(normalized + 'T12:00:00');
  if (!Number.isFinite(parsed)) return Number.MAX_SAFE_INTEGER;
  return Math.abs(parsed - now) / 86400000;
}

export function findTelegramMatch(appData: any, teamMatch: any, officialTeamName: string, opponent?: string, now = Date.now()): any | null {
  const matches = Array.isArray(appData?.matches) ? appData.matches : [];
  if (matches.length === 0) return null;

  const teamKeys = new Set<string>();
  const addTeamKey = (value?: string) => {
    const normalized = normalizeCategoryKey(value);
    if (normalized) teamKeys.add(normalized);
    const raw = normalizeTeamString(value || '');
    if (raw) teamKeys.add(raw);
  };

  addTeamKey(officialTeamName);
  addTeamKey(teamMatch?.team?.name);
  addTeamKey(teamMatch?.team?.category);

  const candidates = matches
    .filter((match: any) => match && match.selectedForWeekend !== false)
    .filter((match: any) => {
      if (teamMatch?.team?.id && match.ffbbTeamId === teamMatch.team.id) return true;
      return teamKeys.has(normalizeCategoryKey(match.category)) ||
        teamKeys.has(normalizeTeamString(match.category || ''));
    })
    .map((match: any) => {
      const opponentSide = match.isHomeMatch ? match.teamAway : match.teamHome;
      const opponentNormalized = normalizeTeamString(opponent || '');
      const sideNormalized = normalizeTeamString(opponentSide || '');
      const opponentMatch = Boolean(opponentNormalized && sideNormalized) &&
        (sideNormalized.includes(opponentNormalized) || opponentNormalized.includes(sideNormalized));
      const dateDistance = getDateDistanceScore(match.date, now);
      const ffbbIdentity = Boolean(teamMatch?.team?.id && match.ffbbTeamId === teamMatch.team.id);
      return {
        match,
        score: (ffbbIdentity ? 1000 : 0) + (opponentMatch ? 500 : 0) - Math.min(dateDistance, 30),
      };
    })
    .sort((a: any, b: any) => b.score - a.score);

  return candidates[0]?.match || null;
}

export function upsertResultMatch(results: any[], updatedMatch: any): any[] {
  const next = Array.isArray(results) ? [...results] : [];
  const byId = next.findIndex((item: any) => item?.id === updatedMatch.id);
  const byFfbb = updatedMatch.ffbbMatchNumber
    ? next.findIndex((item: any) => item?.ffbbMatchNumber === updatedMatch.ffbbMatchNumber)
    : -1;
  const index = byId >= 0 ? byId : byFfbb;
  if (index >= 0) {
    next[index] = updatedMatch;
    return next;
  }
  next.unshift(updatedMatch);
  return next;
}

export async function persistTelegramMatchResult(
  env: Env,
  appData: any,
  teamMatch: any,
  officialTeamName: string,
  parsed: { isWin: boolean | null; teamRaw: string; ourScore?: number; opponentScore?: number; opponent?: string },
  now = Date.now()
): Promise<{
  status: 'created' | 'duplicate_ffbb' | 'duplicate_existing' | 'not_found';
  match?: any;
  appData: any;
}> {
  const match = findTelegramMatch(appData, teamMatch, officialTeamName, parsed.opponent, now);
  if (!match) return { status: 'not_found', appData };

  if (match.resultSource === 'ffbb' ||
      (hasConfirmedMatchResult(match) && match.resultSource !== 'telegram' && match.resultSource !== 'manual')) {
    return { status: 'duplicate_ffbb', match, appData };
  }

  if (hasConfirmedMatchResult(match) || match.resultSource) {
    return { status: 'duplicate_existing', match, appData };
  }

  const isWin = parsed.isWin ?? true;
  const homeScore = match.isHomeMatch ? parsed.ourScore : parsed.opponentScore;
  const awayScore = match.isHomeMatch ? parsed.opponentScore : parsed.ourScore;
  const updatedMatch = {
    ...match,
    status: 'finished',
    result: isWin ? 'win' : 'loss',
    resultSource: 'telegram',
    resultReceivedAt: now,
    finishedAt: now,
    ...(homeScore !== undefined ? { homeScore } : {}),
    ...(awayScore !== undefined ? { awayScore } : {}),
  };

  appData.matches = (Array.isArray(appData.matches) ? appData.matches : []).map((item: any) =>
    item?.id === match.id ? updatedMatch : item
  );
  appData.results = upsertResultMatch(appData.results, updatedMatch);
  appData.version = (typeof appData.version === 'number' ? appData.version : 0) + 1;
  await env.AFFICHAGE_KV.put('app-data', JSON.stringify(appData));

  return { status: 'created', match: updatedMatch, appData };
}

// Réversion d'un résultat injecté par Telegram (commande "supprimer").
// Règle club : si le message Telegram est supprimé, c'est qu'il y a eu erreur →
// on efface AUSSI le résultat persisté (score + victoire/défaite) sur la slide Matchs.
// Les résultats FFBB (resultSource 'ffbb') et manuels ('manual') ne sont JAMAIS touchés.
export async function revertTelegramMatchResult(
  env: Env,
  matchId?: string
): Promise<{ reverted: boolean; match?: any }> {
  const raw = await env.AFFICHAGE_KV.get('app-data');
  if (!raw) return { reverted: false };
  let appData: any = null;
  try {
    appData = JSON.parse(raw);
  } catch (e) {
    return { reverted: false };
  }

  const matches = Array.isArray(appData?.matches) ? appData.matches : [];
  let target = matchId
    ? matches.find((m: any) => m?.id === matchId && m?.resultSource === 'telegram')
    : undefined;
  if (!target) {
    // Pas d'alerte active en mémoire : retirer le résultat Telegram le plus récent.
    target = matches
      .filter((m: any) => m?.resultSource === 'telegram')
      .sort((a: any, b: any) => (b.resultReceivedAt || 0) - (a.resultReceivedAt || 0))[0];
  }
  if (!target) return { reverted: false };

  const restored: any = { ...target };
  delete restored.status;
  delete restored.result;
  delete restored.resultSource;
  delete restored.resultReceivedAt;
  delete restored.finishedAt;
  delete restored.homeScore;
  delete restored.awayScore;

  appData.matches = matches.map((m: any) => (m?.id === target.id ? restored : m));
  const results = Array.isArray(appData.results) ? appData.results : [];
  appData.results = results.filter(
    (r: any) => !(r?.id === target.id && r?.resultSource === 'telegram')
  );
  appData.version = (typeof appData.version === 'number' ? appData.version : 0) + 1;
  await env.AFFICHAGE_KV.put('app-data', JSON.stringify(appData));
  return { reverted: true, match: restored };
}

export async function getTelegramSecretToken(botToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(botToken.trim() + ':src-basket-telegram-secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function syncActiveTelegramAlertsWithFfbbResults(
  env: Env,
  matches: any[],
  now = Date.now()
): Promise<void> {
  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(alerts) || alerts.length === 0) return;

    let changed = false;
    const updatedAlerts = alerts.map((alert: any) => {
      if (!alert || alert.expiresAt <= now || alert.triggeredBy !== 'telegram') return alert;

      let ffbbMatch = alert.matchId
        ? matches.find((match: any) => match?.id === alert.matchId)
        : null;

      if (!ffbbMatch) {
        const alertCategoryKey = normalizeCategoryKey(alert.category || alert.team);
        const alertOpponent = normalizeTeamString(alert.opponent || '');
        const candidates = matches.filter((match: any) => {
          if (!match?.result || !alertCategoryKey) return false;
          if (normalizeCategoryKey(match.category) !== alertCategoryKey) return false;
          if (!alertOpponent) return true;
          const opponentSide = match.isHomeMatch ? match.teamAway : match.teamHome;
          const opponentKey = normalizeTeamString(opponentSide || '');
          return opponentKey.includes(alertOpponent) || alertOpponent.includes(opponentKey);
        });
        ffbbMatch = candidates.sort(
          (a: any, b: any) =>
            getDateDistanceScore(a.date, alert.timestamp || now) -
            getDateDistanceScore(b.date, alert.timestamp || now)
        )[0];
      }

      if (!ffbbMatch || (ffbbMatch.result !== 'win' && ffbbMatch.result !== 'loss')) {
        return alert;
      }

      const ourScore = ffbbMatch.isHomeMatch ? ffbbMatch.homeScore : ffbbMatch.awayScore;
      const opponentScore = ffbbMatch.isHomeMatch ? ffbbMatch.awayScore : ffbbMatch.homeScore;
      const nextAlert = {
        ...alert,
        isWin: ffbbMatch.result === 'win',
        ourScore,
        opponentScore,
        category: ffbbMatch.category,
        competition: ffbbMatch.competition,
        opponent: ffbbMatch.isHomeMatch ? ffbbMatch.teamAway : ffbbMatch.teamHome,
        matchId: ffbbMatch.id,
      };

      if (
        nextAlert.isWin !== alert.isWin ||
        nextAlert.ourScore !== alert.ourScore ||
        nextAlert.opponentScore !== alert.opponentScore ||
        nextAlert.matchId !== alert.matchId
      ) {
        changed = true;
        return nextAlert;
      }
      return alert;
    });

    if (changed) {
      await env.AFFICHAGE_KV.put('alerts', JSON.stringify(updatedAlerts));
    }
  } catch (error) {
    console.warn('Erreur synchronisation alerte Telegram avec FFBB:', error);
  }
}

export async function telegramWebhook(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return new Response(JSON.stringify({ error: 'TELEGRAM_BOT_TOKEN non configuré' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Vérification de sécurité : le message doit impérativement provenir de Telegram
  // via le header X-Telegram-Bot-Api-Secret-Token convenu lors du setWebhook
  const expectedSecret = await getTelegramSecretToken(botToken);
  const incomingSecret = request.headers.get('X-Telegram-Bot-Api-Secret-Token');

  if (!incomingSecret || incomingSecret !== expectedSecret) {
    console.warn('[TELEGRAM WEBHOOK] Rejet 403 : Requête non signée par Telegram ou jeton secret invalide');
    return new Response(JSON.stringify({ error: 'Non autorisé: webhook non certifié par Telegram' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const update = (await request.json().catch(() => null)) as any;
    const message = update?.message || update?.channel_post;

    if (!message || !message.text) {
      return new Response('OK: pas de texte', { status: 200 });
    }

    const text = message.text;
    const chatId = message.chat?.id;
    const now = Date.now();

    // Suppression de la dernière alerte injectée par Telegram (+ réversion du résultat).
    // "supprimer" est accepté avec ou sans slash (règle club : je me suis trompé → on efface).
    const isDeleteCommand = /^(?:\/)?(?:supprimer|delete|annuler)\b/i.test(text.trim());
    if (isDeleteCommand) {
      const rawAlerts = await env.AFFICHAGE_KV.get('alerts');
      const alerts = rawAlerts ? JSON.parse(rawAlerts) : [];
      const telegramAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => a?.triggeredBy === 'telegram') : [];
      const latestTelegramAlert = telegramAlerts[0];

      // 1. Supprimer l'alerte de la boucle TV (si encore active)
      let alertDeleted = false;
      if (latestTelegramAlert) {
        const remainingAlerts = alerts.filter((a: any) => a?.id !== latestTelegramAlert.id);
        await env.AFFICHAGE_KV.put('alerts', JSON.stringify(remainingAlerts));
        if (latestTelegramAlert.telegramChatId && latestTelegramAlert.telegramMessageId) {
          await fetch('https://api.telegram.org/bot' + botToken + '/deleteMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: latestTelegramAlert.telegramChatId, message_id: latestTelegramAlert.telegramMessageId }) }).catch(() => null);
        }
        alertDeleted = true;
      }

      // 2. Réversion du résultat persisté (score + victoire/défaite sur la slide Matchs),
      //    uniquement si ce résultat vient de Telegram. FFBB et manuels sont protégés.
      const revert = await revertTelegramMatchResult(env, latestTelegramAlert?.matchId);

      let replyText: string;
      if (!alertDeleted && !revert.reverted) {
        replyText = 'ℹ️ Aucune alerte Telegram ni résultat à supprimer.';
      } else {
        replyText = (alertDeleted
          ? '🗑️ Alerte ' + (latestTelegramAlert.isWin ? 'VICTOIRE' : 'DÉFAITE') + ' de *' + latestTelegramAlert.team + '* supprimée de la boucle TV.'
          : 'ℹ️ Aucune alerte Telegram active (déjà expirée).')
          + (revert.reverted
            ? '\n✅ Résultat retiré de la slide Matchs : score et victoire/défaite effacés.'
            : '\nℹ️ Aucun résultat Telegram à retirer de la slide Matchs.');
      }

      if (chatId) await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' }) }).catch(() => null);
      return new Response(JSON.stringify({ success: true, deleted: alertDeleted, resultReverted: revert.reverted, alertId: latestTelegramAlert?.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    // Gestion des commandes d'aide Telegram (/start, /help, /aide)
    const isStartOrHelp = /^(\/start|\/help|\/aide)/i.test(text.trim());
    if (isStartOrHelp) {
      if (chatId) {
        const helpText = `🏀 *Bot Affichage TV — SRC Basket La Clayette*\n\nPour afficher un résultat sur la TV du club, envoyez simplement :\n• \`Victoire Seniors 1 82-74\`\n• \`Défaite U15 54-60\`\n• \`Victoire SG2\`\n\nLe visuel correspondant restera affiché 1 heure dans la boucle TV.`;
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: helpText, parse_mode: 'Markdown' }),
          });
        } catch (e) {}
      }
      return new Response(JSON.stringify({ success: true, message: 'Aide envoyée' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Vérification : le message doit contenir un résultat explicite (victoire ou défaite)
    const hasOutcome = /victoire|gagné|gagne|win|défaite|defaite|perdu|loss/i.test(text);
    if (!hasOutcome) {
      const errMsg = "Message non reconnu : précisez Victoire ou Défaite (ex: Victoire Seniors 1 82-74)";
      const failedRecord = {
        receivedAt: now,
        text,
        success: false,
        error: errMsg,
      };
      try {
        await env.AFFICHAGE_KV.put('telegram-last-message', JSON.stringify(failedRecord));
      } catch (e) {}

      if (chatId) {
        const errorReply = `⚠️ *Message non traité*\n\nPour injecter une affiche sur l'écran TV, votre message doit indiquer *Victoire* ou *Défaite*.\n\nExemples valides :\n• \`Victoire Seniors 1 82-74\`\n• \`Défaite U18 62-68\``;
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: errorReply, parse_mode: 'Markdown' }),
          });
        } catch (e) {}
      }

      return new Response(JSON.stringify({ success: false, error: errMsg }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse the message
    const parsed = parseTelegramMatchMessage(text);
    const durationMs = 60 * 60 * 1000; // 1 heure

    // Récupérer appData pour accéder aux équipes réellement configurées dans l'application
    let appData: any = null;
    try {
      const appDataRaw = await env.AFFICHAGE_KV.get('app-data');
      if (appDataRaw) {
        appData = JSON.parse(appDataRaw);
      }
    } catch (e) {}

    // Vérification stricte de l'équipe par rapport aux équipes configurées (U9 aux Seniors : filles, garçons et mixtes)
    const teamMatch = matchConfiguredTeam(parsed.teamRaw, appData);

    if (!teamMatch.matched) {
      // RÈGLE : Si le nom envoyé ne correspond pas clairement à une équipe, ne crée aucune alerte.
      // Réponds en proposant jusqu'à trois équipes configurées qui s'en rapprochent et demande de renvoyer le message avec le bon nom.
      // En cas d'ambiguïté, ne choisis jamais l'équipe automatiquement.
      const reasonMsg = teamMatch.isAmbiguous
        ? `Équipe ambiguë ("${parsed.teamRaw || 'non précisée'}"). Plusieurs équipes configurées correspondent : ${teamMatch.suggestions.join(', ')}`
        : `Équipe non reconnue ("${parsed.teamRaw || 'non précisée'}"). Suggestions d'équipes configurées : ${teamMatch.suggestions.join(', ')}`;

      const failedRecord = {
        receivedAt: now,
        text,
        success: false,
        error: reasonMsg,
        suggestions: teamMatch.suggestions,
        isAmbiguous: teamMatch.isAmbiguous,
      };
      try {
        await env.AFFICHAGE_KV.put('telegram-last-message', JSON.stringify(failedRecord));
      } catch (e) {}

      if (chatId) {
        const headerText = teamMatch.isAmbiguous
          ? `⚠️ *Équipe ambiguë : "${parsed.teamRaw}"*`
          : `⚠️ *Équipe non reconnue : "${parsed.teamRaw}"*`;

        const descText = teamMatch.isAmbiguous
          ? 'Plusieurs équipes de l\'application correspondent à votre message :'
          : 'Cette équipe ne fait pas partie des équipes configurées dans l\'application. Voici les équipes les plus proches :';

        const listText = teamMatch.suggestions.map((s) => `• *${s}*`).join('\n');
        const exampleTeam = teamMatch.suggestions[0] || 'Seniors Garçons 1';
        const sampleScore = parsed.ourScore !== undefined && parsed.opponentScore !== undefined
          ? ` ${parsed.ourScore}-${parsed.opponentScore}`
          : '';
        const helpExample = `👉 *Merci de renvoyer votre message avec le nom exact de l'équipe*, par exemple :\n\`${parsed.isWin ? 'Victoire' : 'Défaite'} ${exampleTeam}${sampleScore}\``;

        const fullReply = `${headerText}\n\n${descText}\n${listText}\n\n${helpExample}`;
        try {
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: fullReply, parse_mode: 'Markdown' }),
          });
        } catch (e) {}
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: reasonMsg,
          suggestions: teamMatch.suggestions,
          isAmbiguous: teamMatch.isAmbiguous,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const officialTeamName = teamMatch.teamName!;

    const persistence = await persistTelegramMatchResult(
      env,
      appData,
      teamMatch,
      officialTeamName,
      parsed,
      now
    );

    if (persistence.status === 'duplicate_ffbb') {
      const replyText = `ℹ️ Résultat déjà transmis par FFBB pour *${officialTeamName}*.`;
      const lastMsgRecord = {
        receivedAt: now,
        text,
        team: officialTeamName,
        isWin: persistence.match?.result === 'win',
        score: persistence.match?.homeScore !== undefined && persistence.match?.awayScore !== undefined
          ? `${persistence.match.homeScore} - ${persistence.match.awayScore}`
          : undefined,
        success: true,
        error: replyText,
      };
      try {
        await env.AFFICHAGE_KV.put('telegram-last-message', JSON.stringify(lastMsgRecord));
      } catch (e) {}
      if (chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' }),
        }).catch(() => null);
      }
      return new Response(JSON.stringify({
        success: true,
        duplicate: true,
        source: 'ffbb',
        message: 'Résultat déjà transmis par FFBB.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (persistence.status === 'duplicate_existing') {
      const replyText = `ℹ️ Résultat déjà transmis pour *${officialTeamName}*. L'alerte d'1 heure n'est pas prolongée.`;
      const lastMsgRecord = {
        receivedAt: now,
        text,
        team: officialTeamName,
        isWin: persistence.match?.result === 'win',
        score: persistence.match?.homeScore !== undefined && persistence.match?.awayScore !== undefined
          ? `${persistence.match.homeScore} - ${persistence.match.awayScore}`
          : undefined,
        success: true,
        error: replyText,
      };
      try {
        await env.AFFICHAGE_KV.put('telegram-last-message', JSON.stringify(lastMsgRecord));
      } catch (e) {}
      if (chatId) {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: replyText, parse_mode: 'Markdown' }),
        }).catch(() => null);
      }
      return new Response(JSON.stringify({
        success: true,
        duplicate: true,
        message: 'Résultat déjà transmis.',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    const matchedMatch = persistence.match;

    let customImg: string | undefined = undefined;
    let customTitleConfig = undefined;
    if (appData) {
      const vt = appData.visualTemplates;
      const commonBank = parsed.isWin ? vt?.commonVictoryVisuals : vt?.commonDefeatVisuals;
      if (commonBank && Array.isArray(commonBank) && commonBank.length > 0) {
        customImg = commonBank[Math.floor(Math.random() * commonBank.length)];
      } else if (teamMatch.team && (teamMatch.team.winVisualUrl || teamMatch.team.lossVisualUrl)) {
        customImg = parsed.isWin ? teamMatch.team.winVisualUrl : teamMatch.team.lossVisualUrl;
      }
      if (customImg && vt?.visualTitleConfigs?.[customImg]) {
        customTitleConfig = vt.visualTitleConfigs[customImg];
      }
    }

    const newAlert = {
      id: 'tg-' + now + '-' + Math.random().toString(36).substring(2, 6),
      team: officialTeamName,
      ourTeam: matchedMatch?.ourClubName,
      matchId: matchedMatch?.id,
      category: matchedMatch?.category || teamMatch.team?.category,
      competition: matchedMatch?.competition,
      isWin: parsed.isWin ?? true,
      ourScore: parsed.ourScore,
      opponentScore: parsed.opponentScore,
      opponent: parsed.opponent || (matchedMatch
        ? (matchedMatch.isHomeMatch ? matchedMatch.teamAway : matchedMatch.teamHome)
        : undefined),
      customImageUrl: customImg,
      titleConfig: customTitleConfig,
      triggeredBy: 'telegram',
      timestamp: now,
      expiresAt: now + durationMs,
      rawMessage: text,
      telegramChatId: chatId,
      telegramMessageId: message.message_id,
    };

    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const alertesValides = Array.isArray(alerts) ? alerts.filter((a: { expiresAt: number }) => a && a.expiresAt > now) : [];
    alertesValides.unshift(newAlert);
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(alertesValides));

    // Enregistrer le dernier message reçu avec succès
    const lastMsgRecord = {
      receivedAt: now,
      text: text,
      team: officialTeamName,
      isWin: parsed.isWin ?? true,
      score: parsed.ourScore !== undefined && parsed.opponentScore !== undefined
        ? `${parsed.ourScore} - ${parsed.opponentScore}`
        : undefined,
      success: true,
    };
    try {
      await env.AFFICHAGE_KV.put('telegram-last-message', JSON.stringify(lastMsgRecord));
    } catch (e) {}

    // Reply back on Telegram if token is set
    if (chatId) {
      const outcomeText = newAlert.isWin ? '🏆 VICTOIRE' : '🏀 DÉFAITE';
      const scoreText = newAlert.ourScore !== undefined && newAlert.opponentScore !== undefined
        ? ` (${newAlert.ourScore} - ${newAlert.opponentScore})`
        : '';

      const replyText = `✅ Visuel ${outcomeText} pour *${newAlert.team}*${scoreText} injecté sur l'écran TV !\n⏱ Durée dans la boucle : 1 heure.`;

      try {
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: replyText,
            parse_mode: 'Markdown',
          }),
        });
      } catch (err) {
        console.error('Erreur envoi réponse Telegram:', err);
      }
    }

    return new Response(JSON.stringify({ success: true, alert: newAlert }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('Erreur webhook Telegram:', error);
    try {
      await env.AFFICHAGE_KV.put(
        'telegram-last-message',
        JSON.stringify({
          receivedAt: Date.now(),
          text: null,
          success: false,
          error: error?.message || 'Erreur lors du traitement du message',
        })
      );
    } catch (e) {}
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function telegramTest(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => null)) as any;
  const messageText = body?.messageText;
  if (!messageText) {
    return new Response(JSON.stringify({ error: 'Message text requis' }), { status: 400 });
  }

  const parsed = parseTelegramMatchMessage(messageText);

  // Récupérer appData pour accéder aux équipes configurées
  let appData: any = null;
  try {
    const appDataRaw = await env.AFFICHAGE_KV.get('app-data');
    if (appDataRaw) {
      appData = JSON.parse(appDataRaw);
    }
  } catch (e) {}

  // Vérification de l'équipe
  const teamMatch = matchConfiguredTeam(parsed.teamRaw, appData);
  if (!teamMatch.matched) {
    const errorMsg = teamMatch.isAmbiguous
      ? `Équipe ambiguë ("${parsed.teamRaw || 'non précisée'}"). Plusieurs équipes correspondent : ${teamMatch.suggestions.join(', ')}`
      : `Équipe non configurée ("${parsed.teamRaw || 'non précisée'}"). Suggestions : ${teamMatch.suggestions.join(', ')}`;

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        suggestions: teamMatch.suggestions,
        isAmbiguous: teamMatch.isAmbiguous,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const officialTeamName = teamMatch.teamName!;

  const persistence = await persistTelegramMatchResult(
    env,
    appData,
    teamMatch,
    officialTeamName,
    parsed,
    Date.now()
  );

  if (persistence.status === 'duplicate_ffbb') {
    return new Response(
      JSON.stringify({
        success: true,
        duplicate: true,
        source: 'ffbb',
        message: 'Résultat déjà transmis par FFBB.',
        confirmationMessage: `ℹ️ Résultat déjà transmis par FFBB pour ${officialTeamName}.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  if (persistence.status === 'duplicate_existing') {
    return new Response(
      JSON.stringify({
        success: true,
        duplicate: true,
        message: 'Résultat déjà transmis. Alerte non prolongée.',
        confirmationMessage: `ℹ️ Résultat déjà transmis pour ${officialTeamName}. L'alerte d'1 heure n'est pas prolongée.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const matchedMatch = persistence.match;

  let customImg: string | undefined = undefined;
  let customTitleConfig = undefined;
  if (appData) {
    const vt = appData.visualTemplates;
    const commonBank = parsed.isWin ? vt?.commonVictoryVisuals : vt?.commonDefeatVisuals;
    if (commonBank && Array.isArray(commonBank) && commonBank.length > 0) {
      customImg = commonBank[Math.floor(Math.random() * commonBank.length)];
    } else if (teamMatch.team && (teamMatch.team.winVisualUrl || teamMatch.team.lossVisualUrl)) {
      customImg = parsed.isWin ? teamMatch.team.winVisualUrl : teamMatch.team.lossVisualUrl;
    }
    if (customImg && vt?.visualTitleConfigs?.[customImg]) {
      customTitleConfig = vt.visualTitleConfigs[customImg];
    }
  }

  const now = Date.now();
  const newAlert = {
    id: 'test-' + now + '-' + Math.random().toString(36).substring(2, 6),
    team: officialTeamName,
    ourTeam: matchedMatch?.ourClubName,
    matchId: matchedMatch?.id,
    category: matchedMatch?.category || teamMatch.team?.category,
    competition: matchedMatch?.competition,
    isWin: parsed.isWin ?? true,
    ourScore: parsed.ourScore,
    opponentScore: parsed.opponentScore,
    opponent: parsed.opponent || (matchedMatch
      ? (matchedMatch.isHomeMatch ? matchedMatch.teamAway : matchedMatch.teamHome)
      : undefined),
    customImageUrl: customImg,
    titleConfig: customTitleConfig,
    triggeredBy: 'telegram',
    timestamp: now,
    expiresAt: now + 60 * 60 * 1000,
    rawMessage: messageText,
  };

  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const alertesValides = Array.isArray(alerts) ? alerts.filter((a: { expiresAt: number }) => a && a.expiresAt > now) : [];
    const newKey = getAlertDeduplicationKey(newAlert);
    const deduped = alertesValides.filter((existing: any) => getAlertDeduplicationKey(existing) !== newKey);
    deduped.unshift(newAlert);
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(deduped));
  } catch (e) {}

  return new Response(
    JSON.stringify({
      success: true,
      parsed,
      alert: newAlert,
      confirmationMessage: `✅ Visuel ${newAlert.isWin ? 'VICTOIRE' : 'DÉFAITE'} pour ${newAlert.team} injecté dans la boucle TV pendant 1 heure !`,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Configure le webhook Telegram côté serveur avec le secret TELEGRAM_BOT_TOKEN
 * Protégé contre les requêtes non autorisées, ne renvoie JAMAIS la valeur du token.
 */

export async function telegramConnect(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  // Protection de l'action : vérification du mot de passe admin si configuré dans env
  const authHeader = request.headers.get('x-admin-password') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (env.ADMIN_PASSWORD && authHeader !== env.ADMIN_PASSWORD) {
    const body = (await request.clone().json().catch(() => null)) as any;
    if (body?.adminPassword !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Action protégée : mot de passe administrateur requis ou invalide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (!botToken) {
    return new Response(
      JSON.stringify({
        success: false,
        error: "Le secret TELEGRAM_BOT_TOKEN n'est pas configuré dans Cloudflare (Settings > Variables et secrets > Exécution).",
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => null)) as any;

    let webhookUrl = `https://${url.host}/api/telegram-webhook`;
    if (body?.customDomain) {
      const cleanDomain = String(body.customDomain).trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (cleanDomain) webhookUrl = `https://${cleanDomain}/api/telegram-webhook`;
    }

    const secretToken = await getTelegramSecretToken(botToken);

    // 1. Enregistrement du webhook auprès de Telegram avec le jeton secret
    const tgWebhookRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secretToken,
        allowed_updates: ['message', 'channel_post'],
        drop_pending_updates: false,
      }),
    });

    const tgWebhookData = (await tgWebhookRes.json().catch(() => null)) as any;

    if (!tgWebhookData || !tgWebhookData.ok) {
      const errDescription = tgWebhookData?.description || `Erreur Telegram HTTP ${tgWebhookRes.status}`;
      return new Response(
        JSON.stringify({
          success: false,
          error: `Échec de l'enregistrement auprès de Telegram : ${errDescription}`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 2. Récupération des informations sur le bot (getMe)
    const getMeRes = await fetch(`https://api.telegram.org/bot${botToken}/getMe`).catch(() => null);
    const getMeData = (await getMeRes?.json().catch(() => null)) as any;
    const botUsername = getMeData?.result?.username || null;
    const botName = getMeData?.result?.first_name || null;

    try {
      await env.AFFICHAGE_KV.put(
        'telegram-bot-info',
        JSON.stringify({
          connected: true,
          webhookUrl,
          botUsername,
          botName,
          connectedAt: Date.now(),
        })
      );
    } catch (e) {}

    return new Response(
      JSON.stringify({
        success: true,
        connected: true,
        webhookUrl,
        botUsername,
        botName,
        message: 'Bot Telegram connecté avec succès ! Webhook sécurisé par signature secrète.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Erreur interne lors de la connexion : ${err.message}`,
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Déconnecte le webhook Telegram côté serveur
 */

export async function telegramDisconnect(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  // Protection de l'action
  const authHeader = request.headers.get('x-admin-password') || request.headers.get('authorization')?.replace('Bearer ', '');
  if (env.ADMIN_PASSWORD && authHeader !== env.ADMIN_PASSWORD) {
    const body = (await request.clone().json().catch(() => null)) as any;
    if (body?.adminPassword !== env.ADMIN_PASSWORD) {
      return new Response(JSON.stringify({ error: 'Action protégée : mot de passe administrateur requis ou invalide' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
  if (botToken) {
    try {
      await fetch(`https://api.telegram.org/bot${botToken}/deleteWebhook`);
    } catch (e) {}
  }

  try {
    await env.AFFICHAGE_KV.delete('telegram-bot-info');
    await env.AFFICHAGE_KV.delete('telegram-last-message');
  } catch (e) {}

  return new Response(
    JSON.stringify({
      success: true,
      connected: false,
      message: 'Webhook Telegram déconnecté avec succès.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

/**
 * Renvoie l'état de connexion du bot sans JAMAIS exposer le secret TELEGRAM_BOT_TOKEN.
 */

export async function telegramConfig(request: Request, env: Env): Promise<Response> {
  if (request.method === 'POST') {
    return await telegramConnect(request, env);
  }

  const hasEnvToken = Boolean(env.TELEGRAM_BOT_TOKEN?.trim());
  if (!hasEnvToken) {
    return new Response(
      JSON.stringify({
        hasSecretToken: false,
        connected: false,
        message: "Secret TELEGRAM_BOT_TOKEN non configuré dans Cloudflare",
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const botToken = env.TELEGRAM_BOT_TOKEN!.trim();

  try {
    const [webhookRes, getMeRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${botToken}/getWebhookInfo`).catch(() => null),
      fetch(`https://api.telegram.org/bot${botToken}/getMe`).catch(() => null),
    ]);

    const webhookData = (await webhookRes?.json().catch(() => null)) as any;
    const meData = (await getMeRes?.json().catch(() => null)) as any;

    const isConnected = Boolean(webhookData?.ok && webhookData?.result?.url && webhookData.result.url.length > 0);
    const webhookUrl = webhookData?.result?.url || null;
    const botUsername = meData?.result?.username || null;
    const botName = meData?.result?.first_name || null;
    const lastError = webhookData?.result?.last_error_message || null;
    const pendingUpdateCount = webhookData?.result?.pending_update_count || 0;

    let lastMessage: any = null;
    try {
      const rawMsg = await env.AFFICHAGE_KV.get('telegram-last-message');
      if (rawMsg) {
        lastMessage = JSON.parse(rawMsg);
      }
    } catch (e) {}

    return new Response(
      JSON.stringify({
        hasSecretToken: true,
        connected: isConnected,
        webhookUrl,
        botUsername,
        botName,
        lastError,
        pendingUpdateCount,
        lastMessage,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({
        hasSecretToken: true,
        connected: false,
        error: "Impossible d'interroger les serveurs Telegram",
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ============================================================
// FFBB — matchs et recherche
// ============================================================
