import { TeamVisualItem, FFBBTeamItem } from '../types';
import { DEFAULT_REAL_FFBB_TEAMS } from '../data/defaultFfbbTeams';

/**
 * Normalisation robuste des chaînes pour la reconnaissance des équipes :
 * - Suppression des accents (diacritiques)
 * - Conversion en minuscules
 * - Remplacement de la ponctuation (tirets, barres obliques, points, apostrophes, etc.) par des espaces
 * - Suppression des espaces multiples et rognage
 */
export function normalizeTeamString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprime les accents (é -> e, ç -> c, etc.)
    .toLowerCase()
    .replace(/['’\-_/\\.:,;+*#~]/g, ' ') // Remplace la ponctuation par un espace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Équipes configurées par défaut dans l'application, couvrant de manière exhaustive
 * l'ensemble des collectifs réels du club des U9 aux Seniors : filles, garçons et mixtes.
 */
export const DEFAULT_CANONICAL_TEAMS: TeamVisualItem[] = [
  {
    id: 'tv-sg1',
    teamName: 'Seniors Garçons 1',
    shortAliases: [
      'sg1', 'sg 1', 'sm1', 'sm 1', 'seniors 1', 'seniors garcons 1', 'seniors garçons 1',
      'seniors g1', 'seniors m1', 'seniors masculins 1', 'sg', 'seniors garcons', 'seniors garçons',
      'seniors m', 'seniors masculins',
    ],
    category: 'Seniors Garçons',
    winVisualUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-sg2',
    teamName: 'Seniors Garçons 2',
    shortAliases: [
      'sg2', 'sg 2', 'sm2', 'sm 2', 'seniors 2', 'seniors garcons 2', 'seniors garçons 2',
      'seniors g2', 'seniors m2', 'seniors masculins 2',
    ],
    category: 'Seniors Garçons',
    winVisualUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-sf1',
    teamName: 'Seniors Filles 1',
    shortAliases: [
      'sf1', 'sf 1', 'seniors filles 1', 'seniors f1', 'seniors f 1', 'seniors feminines 1',
      'seniors féminines 1', 'sf', 'seniors filles', 'seniors f', 'seniors feminines', 'seniors féminines',
    ],
    category: 'Seniors Féminines',
    winVisualUrl: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u18m',
    teamName: 'U18 Garçons 1',
    shortAliases: [
      'u18m', 'u18g', 'u18 garcons', 'u18 garçons', 'u18 garcons 1', 'u18 garçons 1',
      'u18 masculins', 'u18m1', 'u18g1', 'u18 m', 'u18 g',
    ],
    category: 'Jeunes U18',
    winVisualUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u18f',
    teamName: 'U18 Filles 1',
    shortAliases: [
      'u18f', 'u18 filles', 'u18 f', 'u18 filles 1', 'u18f1', 'u18 feminines', 'u18 féminines', 'u18f 1',
    ],
    category: 'Jeunes U18',
    winVisualUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u15m',
    teamName: 'U15 Garçons 1',
    shortAliases: [
      'u15m', 'u15g', 'u15 garcons', 'u15 garçons', 'u15 garcons 1', 'u15 garçons 1',
      'u15 masculins', 'u15m1', 'u15g1', 'u15 m', 'u15 g',
    ],
    category: 'Jeunes U15',
    winVisualUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u15f',
    teamName: 'U15 Filles 1',
    shortAliases: [
      'u15f', 'u15 filles', 'u15 f', 'u15 filles 1', 'u15f1', 'u15 feminines', 'u15 féminines', 'u15f 1',
    ],
    category: 'Jeunes U15',
    winVisualUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u13m',
    teamName: 'U13 Garçons 1',
    shortAliases: [
      'u13m', 'u13g', 'u13 garcons', 'u13 garçons', 'u13 garcons 1', 'u13 garçons 1',
      'u13 masculins', 'u13m1', 'u13g1', 'u13 m', 'u13 g',
    ],
    category: 'Jeunes U13',
    winVisualUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u13f1',
    teamName: 'U13 Filles 1',
    shortAliases: [
      'u13f 1', 'u13f1', 'u13 filles 1', 'u13f-1', 'u13 f 1', 'u13 f1', 'u13 feminines 1', 'u13 féminines 1',
    ],
    category: 'Jeunes U13',
    winVisualUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u13f2',
    teamName: 'U13 Filles 2',
    shortAliases: [
      'u13f 2', 'u13f2', 'u13 filles 2', 'u13f-2', 'u13 f 2', 'u13 f2', 'u13 feminines 2', 'u13 féminines 2',
    ],
    category: 'Jeunes U13',
    winVisualUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u11m',
    teamName: 'U11 Garçons 1',
    shortAliases: [
      'u11m', 'u11g', 'u11 garcons', 'u11 garçons', 'u11 garcons 1', 'u11 garçons 1',
      'u11 masculins', 'u11m1', 'u11g1', 'u11 m', 'u11 g',
    ],
    category: 'École de Basket U11',
    winVisualUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u11f',
    teamName: 'U11 Filles 1',
    shortAliases: [
      'u11f', 'u11 filles', 'u11 f', 'u11 filles 1', 'u11f1', 'u11 feminines', 'u11 féminines', 'u11f 1',
    ],
    category: 'École de Basket U11',
    winVisualUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u9-mixte',
    // Règle explicite : Une équipe U9 Garçons qui joue en mixte doit pouvoir être reconnue
    // sous ses deux appellations, reliées à la même équipe.
    teamName: 'U9 Garçons / Mixte',
    shortAliases: [
      // Appellation 1 : Garçons
      'u9 garcons', 'u9 garçons', 'u9g', 'u9m', 'u9 g', 'u9 m', 'u9 garcons 1', 'u9 garçons 1', 'u9 masculins', 'u9g1', 'u9m1',
      // Appellation 2 : Mixte / Générique
      'u9 mixte', 'u9mixte', 'u9 mix', 'u9', 'u9 mixtes', 'u9mixtes',
    ],
    category: 'École de Basket U9',
    winVisualUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
  {
    id: 'tv-u9f',
    teamName: 'U9 Filles 1',
    shortAliases: [
      'u9f', 'u9 filles', 'u9 f', 'u9 filles 1', 'u9f1', 'u9 feminines', 'u9 féminines', 'u9f 1',
    ],
    category: 'École de Basket U9',
    winVisualUrl: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=1600&auto=format&fit=crop&q=80',
    lossVisualUrl: 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1600&auto=format&fit=crop&q=80',
  },
];

export interface TeamMatchResult {
  matched: boolean;
  team?: TeamVisualItem;
  teamName?: string;
  isAmbiguous: boolean;
  suggestions: string[];
  reason?: string;
}

/**
 * Calcule la distance de Levenshtein entre deux chaînes normalisées
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,      // suppression
        d[i][j - 1] + 1,      // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return d[m][n];
}

/**
 * Calcule un score de similarité entre 0 et 1 (1 = identique)
 */
function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  const dist = levenshteinDistance(a, b);
  return 1 - dist / maxLen;
}

/**
 * Génère toutes les variantes textuelles reconnues pour une équipe configurée
 */
function getTeamNormalizedVariations(tv: TeamVisualItem): string[] {
  const set = new Set<string>();
  const add = (s?: string) => {
    if (!s) return;
    const norm = normalizeTeamString(s);
    if (norm) {
      set.add(norm);
      // Variante sans espaces (ex: "u13f1", "sg1", "u9mixte")
      const noSpace = norm.replace(/\s+/g, '');
      if (noSpace.length > 1) {
        set.add(noSpace);
      }
    }
  };

  add(tv.teamName);
  add(tv.category);
  if (Array.isArray(tv.shortAliases)) {
    tv.shortAliases.forEach(add);
  }

  // Si c'est U9 Garçons / Mixte, s'assurer que les deux appellations sont présentes
  const normName = normalizeTeamString(tv.teamName);
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

/**
 * Analyse les composantes d'une chaîne (catégorie d'âge, genre, numéro)
 */
interface TeamComponents {
  age?: 'u7' | 'u9' | 'u11' | 'u13' | 'u15' | 'u17' | 'u18' | 'u20' | 'seniors';
  gender?: 'f' | 'm' | 'mixte';
  teamNumber?: '1' | '2' | '3';
}

function parseTeamComponents(normStr: string): TeamComponents {
  const result: TeamComponents = {};

  // 1. Catégorie d'âge
  const ageMatch = normStr.match(/\b(u\s*0?([79]|1[13578]|20))\b/);
  if (ageMatch) {
    const num = ageMatch[2];
    result.age = ('u' + num) as any;
  } else if (/\bsenior(s)?\b|\bsg\b|\bsf\b|\bsm\b/.test(normStr)) {
    result.age = 'seniors';
  }

  // 2. Genre
  if (/\b(fille(s)?|feminine(s)?|f)\b/.test(normStr) || normStr.startsWith('sf') || normStr.includes('u18f') || normStr.includes('u15f') || normStr.includes('u13f') || normStr.includes('u11f') || normStr.includes('u9f')) {
    result.gender = 'f';
  } else if (/\b(mixte(s)?|mix)\b/.test(normStr)) {
    result.gender = 'mixte';
  } else if (/\b(garcon(s)?|masculin(s)?|m|g)\b/.test(normStr) || normStr.startsWith('sg') || normStr.startsWith('sm')) {
    result.gender = 'm';
  }

  // Cas spécial U9 : si c'est U9 et mixte ou garçons, les deux sont liés
  if (result.age === 'u9' && (result.gender === 'm' || result.gender === 'mixte')) {
    // Les deux appellations correspondent au même collectif
    result.gender = 'mixte';
  }

  // 3. Numéro d'équipe
  const numMatch = normStr.match(/\b([123])\b/) || normStr.match(/(?:f|m|g|sg|sf|sm|u\d+f|u\d+m|u\d+g)\s*([123])/);
  if (numMatch) {
    result.teamNumber = numMatch[1] as any;
  }

  return result;
}

/**
 * Calcule les suggestions d'équipes les plus proches parmi les équipes configurées
 */
export function findClosestTeams(rawInput: string, configuredTeams: TeamVisualItem[], limit = 3): string[] {
  const normInput = normalizeTeamString(rawInput);
  const inputComponents = parseTeamComponents(normInput);

  const scored: { name: string; score: number }[] = [];

  for (const tv of configuredTeams) {
    const variations = getTeamNormalizedVariations(tv);
    const tvComponents = parseTeamComponents(normalizeTeamString(tv.teamName));

    let bestScore = 0;

    for (const v of variations) {
      // Score direct de similarité
      let score = stringSimilarity(normInput, v);

      // Bonus si l'un contient l'autre
      if (v.includes(normInput) || normInput.includes(v)) {
        score = Math.max(score, 0.75);
      }

      // Bonus si même catégorie d'âge (ex: U9, U13, Seniors)
      if (inputComponents.age && tvComponents.age && inputComponents.age === tvComponents.age) {
        score += 0.3;
      }

      // Bonus si même genre
      if (inputComponents.gender && tvComponents.gender && inputComponents.gender === tvComponents.gender) {
        score += 0.2;
      }

      if (score > bestScore) {
        bestScore = score;
      }
    }

    scored.push({ name: tv.teamName, score: bestScore });
  }

  // Trier par score décroissant et dédoublonner
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

export interface TeamMatcherOptions {
  ffbbTeams?: FFBBTeamItem[];
  customTeamNames?: Record<string, string>;
  teamVisuals?: TeamVisualItem[];
}

export interface IdentifiableTeamItem {
  id: string;
  teamName: string; // Nom affiché effectif (nom personnalisé si présent, sinon nom FFBB officiel)
  officialName: string; // Nom officiel FFBB (ex: "U9 Garçons / Mixte" ou "U9 M")
  customName?: string; // Nom personnalisé (ex: "U9 Mixte")
  category: string; // Catégorie FFBB (ex: "U9 Mixte" ou "U9 M1")
  gender: 'M' | 'F' | 'Mixte';
  shortAliases: string[];
  winVisualUrl?: string;
  lossVisualUrl?: string;
}

/**
 * Construit la liste unifiée des équipes identifiables à partir des équipes de « Sync FFBB »,
 * de leurs noms personnalisés, de leurs noms officiels et de leurs alias.
 */
export function buildIdentifiableTeams(
  optionsOrTeams?: TeamVisualItem[] | TeamMatcherOptions
): IdentifiableTeamItem[] {
  let ffbbList: FFBBTeamItem[] = DEFAULT_REAL_FFBB_TEAMS;
  let customMap: Record<string, string> = {};
  let visualsList: TeamVisualItem[] = DEFAULT_CANONICAL_TEAMS;

  if (Array.isArray(optionsOrTeams)) {
    visualsList = optionsOrTeams;
  } else if (optionsOrTeams && typeof optionsOrTeams === 'object') {
    if (Array.isArray(optionsOrTeams.ffbbTeams) && optionsOrTeams.ffbbTeams.length > 0) {
      ffbbList = optionsOrTeams.ffbbTeams;
    }
    if (optionsOrTeams.customTeamNames) {
      customMap = optionsOrTeams.customTeamNames;
    }
    if (Array.isArray(optionsOrTeams.teamVisuals) && optionsOrTeams.teamVisuals.length > 0) {
      visualsList = optionsOrTeams.teamVisuals;
    }
  }

  return ffbbList.map((ffbbTeam) => {
    const customName = customMap[ffbbTeam.id] || customMap[ffbbTeam.category] || ffbbTeam.customName;
    const displayName = customName || ffbbTeam.name;

    // Retrouver le visuel correspondant s'il existe
    const normOfficial = normalizeTeamString(ffbbTeam.name);
    const normCat = normalizeTeamString(ffbbTeam.category);
    const normCustom = customName ? normalizeTeamString(customName) : '';

    const matchingVisual = visualsList.find((v) => {
      const vNorm = normalizeTeamString(v.teamName);
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

    const aliasesSet = new Set<string>();
    const addAlias = (s?: string) => {
      if (!s) return;
      const clean = normalizeTeamString(s);
      if (clean) {
        aliasesSet.add(clean);
        const noSpace = clean.replace(/\s+/g, '');
        if (noSpace.length > 1) aliasesSet.add(noSpace);
      }
    };

    // 1. Nom personnalisé et nom officiel
    addAlias(displayName);
    addAlias(ffbbTeam.name);
    addAlias(ffbbTeam.category);
    if (customName) addAlias(customName);

    // 2. Alias du visuel s'il existe
    if (matchingVisual && Array.isArray(matchingVisual.shortAliases)) {
      matchingVisual.shortAliases.forEach(addAlias);
    }

    // 3. Abréviations courantes et variantes spécifiques selon la catégorie
    const isU9 = normOfficial.includes('u9') || normCat.includes('u9') || normCustom.includes('u9');
    const isSeniors = normOfficial.includes('senior') || normCat.includes('senior');
    const isU15 = normOfficial.includes('u15') || normCat.includes('u15');
    const isU18 = normOfficial.includes('u18') || normCat.includes('u18');
    const isU13 = normOfficial.includes('u13') || normCat.includes('u13');
    const isU11 = normOfficial.includes('u11') || normCat.includes('u11');

    if (isU9 && (ffbbTeam.gender === 'Mixte' || normOfficial.includes('mixte') || normOfficial.includes('garcon'))) {
      // Règle explicite : U9 Garçons et U9 Mixte désignent la même équipe
      addAlias('u9 mixte');
      addAlias('u9 mixte 1');
      addAlias('u9 mixtes');
      addAlias('u9 mix');
      addAlias('u9');
      addAlias('u9m');
      addAlias('u9g');
      addAlias('u9 m');
      addAlias('u9 g');
      addAlias('u9 m1');
      addAlias('u9 g1');
      addAlias('u9 garcons');
      addAlias('u9 garçons');
      addAlias('u9 garcons 1');
      addAlias('u9 garçons 1');
      addAlias('u9 masculins');
      addAlias('u9m1');
      addAlias('u9g1');
    } else if (isU9 && ffbbTeam.gender === 'F') {
      addAlias('u9f');
      addAlias('u9 f');
      addAlias('u9 filles');
      addAlias('u9 filles 1');
      addAlias('u9f1');
      addAlias('u9 feminines');
      addAlias('u9 féminines');
      addAlias('u9f 1');
    }

    if (isU11 && ffbbTeam.gender === 'F') {
      addAlias('u11f');
      addAlias('u11 f');
      addAlias('u11 filles');
      addAlias('u11 filles 1');
      addAlias('u11f1');
      addAlias('u11 feminines');
      addAlias('u11 féminines');
      addAlias('u11f 1');
    } else if (isU11 && ffbbTeam.gender === 'M') {
      addAlias('u11m');
      addAlias('u11 m');
      addAlias('u11g');
      addAlias('u11 g');
      addAlias('u11 garcons');
      addAlias('u11 garçons');
      addAlias('u11 garcons 1');
      addAlias('u11 garçons 1');
      addAlias('u11m1');
      addAlias('u11 masculins');
    }

    if (isU13 && ffbbTeam.gender === 'F') {
      const isNum2 = normOfficial.includes('2') || normCat.includes('2') || (customName && customName.includes('2'));
      if (isNum2) {
        addAlias('u13f 2');
        addAlias('u13f2');
        addAlias('u13 f 2');
        addAlias('u13 f2');
        addAlias('u13 filles 2');
        addAlias('u13f-2');
        addAlias('u13 feminines 2');
        addAlias('u13 féminines 2');
      } else {
        addAlias('u13f 1');
        addAlias('u13f1');
        addAlias('u13 f 1');
        addAlias('u13 f1');
        addAlias('u13 filles 1');
        addAlias('u13f-1');
        addAlias('u13 feminines 1');
        addAlias('u13 féminines 1');
      }
    } else if (isU13 && ffbbTeam.gender === 'M') {
      addAlias('u13m');
      addAlias('u13 m');
      addAlias('u13g');
      addAlias('u13 g');
      addAlias('u13 garcons');
      addAlias('u13 garçons');
      addAlias('u13 garcons 1');
      addAlias('u13 garçons 1');
      addAlias('u13m1');
      addAlias('u13 masculins');
    }

    if (isU15 && ffbbTeam.gender === 'F') {
      addAlias('u15f');
      addAlias('u15 f');
      addAlias('u15 filles');
      addAlias('u15 filles 1');
      addAlias('u15f1');
      addAlias('u15 feminines');
      addAlias('u15 féminines');
      addAlias('u15f 1');
    }

    if (isU18 && ffbbTeam.gender === 'F') {
      addAlias('u18f');
      addAlias('u18 f');
      addAlias('u18 filles');
      addAlias('u18 filles 1');
      addAlias('u18f1');
      addAlias('u18 feminines');
      addAlias('u18 féminines');
      addAlias('u18f 1');
    } else if (isU18 && ffbbTeam.gender === 'M') {
      addAlias('u18m');
      addAlias('u18 m');
      addAlias('u18g');
      addAlias('u18 g');
      addAlias('u18 garcons');
      addAlias('u18 garçons');
      addAlias('u18 garcons 1');
      addAlias('u18 garçons 1');
      addAlias('u18m1');
      addAlias('u18 masculins');
    }

    if (isSeniors && ffbbTeam.gender === 'F') {
      addAlias('seniors filles');
      addAlias('seniors filles 1');
      addAlias('seniors f');
      addAlias('seniors f1');
      addAlias('seniors f 1');
      addAlias('sf');
      addAlias('sf1');
      addAlias('sf 1');
      addAlias('seniors feminines');
      addAlias('seniors féminines');
    } else if (isSeniors && ffbbTeam.gender === 'M') {
      const isNum2 = normOfficial.includes('2') || normCat.includes('2') || (customName && customName.includes('2'));
      if (isNum2) {
        addAlias('seniors garcons 2');
        addAlias('seniors garçons 2');
        addAlias('seniors g2');
        addAlias('seniors m2');
        addAlias('seniors 2');
        addAlias('sg2');
        addAlias('sg 2');
        addAlias('sm2');
        addAlias('sm 2');
      } else {
        addAlias('seniors garcons 1');
        addAlias('seniors garçons 1');
        addAlias('seniors g1');
        addAlias('seniors m1');
        addAlias('seniors 1');
        addAlias('sg1');
        addAlias('sg 1');
        addAlias('sm1');
        addAlias('sm 1');
        addAlias('seniors garcons');
        addAlias('seniors garçons');
        addAlias('seniors m');
        addAlias('seniors g');
        addAlias('sg');
        addAlias('sm');
      }
    }

    return {
      id: ffbbTeam.id,
      teamName: displayName,
      officialName: ffbbTeam.name,
      customName,
      category: ffbbTeam.category,
      gender: ffbbTeam.gender,
      shortAliases: Array.from(aliasesSet),
      winVisualUrl: matchingVisual?.winVisualUrl,
      lossVisualUrl: matchingVisual?.lossVisualUrl,
    };
  });
}

/**
 * Analyse un message Telegram pour en extraire le résultat (Victoire / Défaite),
 * l'équipe et le score optionnel. Ne crée aucun score fictif si absent.
 */
export function parseTelegramMatchMessage(text: string): {
  isWin: boolean | null;
  teamRaw: string;
  ourScore?: number;
  opponentScore?: number;
  opponent?: string;
} {
  const clean = (text || '').trim();
  const lower = clean.toLowerCase();

  let isWin: boolean | null = null;
  if (
    lower.startsWith('/victoire') ||
    lower.startsWith('victoire') ||
    lower.includes('gagné') ||
    lower.includes('gagne') ||
    lower.includes('win')
  ) {
    isWin = true;
  } else if (
    lower.startsWith('/defaite') ||
    lower.startsWith('/défaite') ||
    lower.startsWith('defaite') ||
    lower.startsWith('défaite') ||
    lower.includes('perdu') ||
    lower.includes('loss')
  ) {
    isWin = false;
  }

  // Extraction optionnelle du score (ex: "42-36", "82 - 74")
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

  // Nettoyage de la commande pour extraire le nom brut de l'équipe
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

/**
 * Fonction maîtresse de reconnaissance d'équipe Telegram :
 * - Prend comme référence les équipes réellement configurées dans « Sync FFBB » (des U9 aux Seniors : filles, garçons et mixtes)
 * - Ne crée pas d'équipe fictive qui n'existe pas
 * - Tolère casse, accents, espaces et abréviations courantes
 * - Associe "U9 Garçons", "U9 Mixte" et "U9 M" à la même équipe
 * - En cas d'ambiguïté ou de nom non reconnu : ne choisit jamais automatiquement,
 *   ne crée aucune alerte et propose jusqu'à 3 équipes proches
 */
export function matchTelegramTeam(
  rawInput: string,
  optionsOrTeams?: TeamVisualItem[] | TeamMatcherOptions
): TeamMatchResult {
  const configuredTeams = buildIdentifiableTeams(optionsOrTeams);

  const clean = rawInput ? rawInput.trim() : '';
  if (!clean) {
    return {
      matched: false,
      isAmbiguous: false,
      suggestions: configuredTeams.slice(0, 3).map((t) => t.teamName),
      reason: 'Nom d\'équipe vide',
    };
  }

  const normInput = normalizeTeamString(clean);
  const inputNoSpace = normInput.replace(/\s+/g, '');
  const inputComponents = parseTeamComponents(normInput);

  // 1. RECHERCHE D'ÉGALITÉ EXACTE PARMI LES VARIANTES, NOMS OFFICIELS, PERSONNALISÉS ET ALIAS
  const exactMatches: IdentifiableTeamItem[] = [];

  for (const team of configuredTeams) {
    const variations = [
      ...team.shortAliases,
      normalizeTeamString(team.teamName),
      normalizeTeamString(team.officialName),
      normalizeTeamString(team.category),
    ];
    if (team.customName) {
      variations.push(normalizeTeamString(team.customName));
    }

    const matchesVariant = variations.some((v) => {
      const vNorm = normalizeTeamString(v);
      const vNoSpace = vNorm.replace(/\s+/g, '');
      return vNorm === normInput || vNoSpace === inputNoSpace;
    });

    if (matchesVariant) {
      if (!exactMatches.some((m) => m.id === team.id)) {
        exactMatches.push(team);
      }
    }
  }

  if (exactMatches.length === 1) {
    return {
      matched: true,
      team: exactMatches[0] as any,
      teamName: exactMatches[0].teamName,
      isAmbiguous: false,
      suggestions: [],
    };
  }

  if (exactMatches.length > 1) {
    // Ambiguïté exacte : ne jamais choisir automatiquement
    return {
      matched: false,
      isAmbiguous: true,
      suggestions: exactMatches.map((t) => t.teamName).slice(0, 3),
      reason: `Plusieurs équipes configurées correspondent à "${clean}"`,
    };
  }

  // 2. CAS SPÉCIFIQUE U9 GARÇONS / MIXTE / U9 M
  // Règle explicite : Une équipe U9 Garçons qui joue en mixte doit pouvoir être reconnue
  // sous ses deux appellations (« U9 Mixte », « U9 M », « U9 Garçons »), reliées à la même équipe.
  if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte')) {
    const u9MixteTeam = configuredTeams.find((t) => {
      const n = normalizeTeamString(t.teamName);
      const o = normalizeTeamString(t.officialName);
      const c = normalizeTeamString(t.category);
      return (n.includes('u9') || o.includes('u9') || c.includes('u9')) &&
        (t.gender === 'Mixte' || n.includes('mixte') || o.includes('mixte') || n.includes('garcon') || o.includes('garcon'));
    });
    if (u9MixteTeam) {
      return {
        matched: true,
        team: u9MixteTeam as any,
        teamName: u9MixteTeam.teamName,
        isAmbiguous: false,
        suggestions: [],
      };
    }
  }

  // 3. ANALYSE SÉMANTIQUE STRUCTURELLE (Catégorie d'âge + Genre + Numéro d'équipe)
  if (inputComponents.age) {
    const candidateTeams = configuredTeams.filter((t) => {
      const tComp = parseTeamComponents(normalizeTeamString(t.teamName) + ' ' + normalizeTeamString(t.officialName));
      if (tComp.age !== inputComponents.age) return false;

      // Filtrage par genre si précisé
      if (inputComponents.gender && tComp.gender) {
        if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte')) {
          if (tComp.gender !== 'm' && tComp.gender !== 'mixte') return false;
        } else if (inputComponents.gender !== tComp.gender) {
          return false;
        }
      }

      // Filtrage par numéro si précisé
      if (inputComponents.teamNumber && tComp.teamNumber) {
        if (inputComponents.teamNumber !== tComp.teamNumber) return false;
      }

      return true;
    });

    if (candidateTeams.length === 1) {
      return {
        matched: true,
        team: candidateTeams[0] as any,
        teamName: candidateTeams[0].teamName,
        isAmbiguous: false,
        suggestions: [],
      };
    }

    if (candidateTeams.length > 1) {
      // Ambiguïté : par exemple l'utilisateur tape "U13 Filles" alors qu'il existe U13 Filles 1 et U13 Filles 2 !
      // Ne jamais choisir l'équipe automatiquement.
      return {
        matched: false,
        isAmbiguous: true,
        suggestions: candidateTeams.map((t) => t.teamName).slice(0, 3),
        reason: `Nom ambigu : plusieurs équipes configurées (${candidateTeams.map((t) => t.teamName).join(', ')}) correspondent à "${clean}"`,
      };
    }
  }

  // 4. SI LE NOM NE CORRESPOND PAS CLAIREMENT À UNE ÉQUIPE :
  // Ne créer aucune alerte, refuser l'affectation et proposer jusqu'à 3 équipes proches
  const suggestions = findClosestTeams(clean, configuredTeams as any, 3);

  return {
    matched: false,
    isAmbiguous: false,
    suggestions,
    reason: `Équipe non configurée : "${clean}" ne correspond à aucune équipe active de l'application`,
  };
}
