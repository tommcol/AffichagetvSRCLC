import { TeamVisualItem } from '../types';

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

/**
 * Fonction maîtresse de reconnaissance d'équipe Telegram :
 * - Prend comme référence les équipes réellement configurées dans l'application
 * - Ne crée pas d'équipe fictive qui n'existe pas
 * - Tolère casse, accents, espaces et abréviations courantes
 * - Associe "U9 Garçons" et "U9 Mixte" à la même équipe
 * - En cas d'ambiguïté ou de nom non reconnu : ne choisit jamais automatiquement,
 *   ne crée aucune alerte et propose jusqu'à 3 équipes proches
 */
export function matchTelegramTeam(
  rawInput: string,
  customConfiguredTeams?: TeamVisualItem[]
): TeamMatchResult {
  const configuredTeams = (customConfiguredTeams && customConfiguredTeams.length > 0)
    ? customConfiguredTeams
    : DEFAULT_CANONICAL_TEAMS;

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

  // 1. RECHERCHE D'ÉGALITÉ EXACTE PARMI LES VARIANTES ET ALIAS
  const exactMatches: TeamVisualItem[] = [];

  for (const tv of configuredTeams) {
    const variations = getTeamNormalizedVariations(tv);
    if (variations.includes(normInput) || variations.includes(inputNoSpace)) {
      if (!exactMatches.some((m) => m.id === tv.id)) {
        exactMatches.push(tv);
      }
    }
  }

  if (exactMatches.length === 1) {
    return {
      matched: true,
      team: exactMatches[0],
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
      reason: `Plusieurs équipes configurées correspondent exactement à "${clean}"`,
    };
  }

  // 2. CAS SPÉCIFIQUE U9 GARÇONS / MIXTE
  // Règle explicite : Une équipe U9 Garçons qui joue en mixte doit pouvoir être reconnue
  // sous ses deux appellations, reliées à la même équipe.
  if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte' || !inputComponents.gender)) {
    // Si l'utilisateur n'a pas précisé "filles", cela correspond à U9 Garçons / Mixte
    const u9MixteTeam = configuredTeams.find((tv) => {
      const n = normalizeTeamString(tv.teamName);
      return n.includes('u9') && (n.includes('mixte') || n.includes('garcon'));
    });
    if (u9MixteTeam) {
      return {
        matched: true,
        team: u9MixteTeam,
        teamName: u9MixteTeam.teamName,
        isAmbiguous: false,
        suggestions: [],
      };
    }
  }

  // 3. ANALYSE SÉMANTIQUE STRUCTURELLE (Catégorie + Genre + Numéro)
  if (inputComponents.age) {
    const candidateTeams = configuredTeams.filter((tv) => {
      const tvComp = parseTeamComponents(normalizeTeamString(tv.teamName));
      if (tvComp.age !== inputComponents.age) return false;

      // Filtrage par genre si précisé
      if (inputComponents.gender && tvComp.gender) {
        if (inputComponents.age === 'u9' && (inputComponents.gender === 'm' || inputComponents.gender === 'mixte')) {
          if (tvComp.gender !== 'm' && tvComp.gender !== 'mixte') return false;
        } else if (inputComponents.gender !== tvComp.gender) {
          return false;
        }
      }

      // Filtrage par numéro si précisé
      if (inputComponents.teamNumber && tvComp.teamNumber) {
        if (inputComponents.teamNumber !== tvComp.teamNumber) return false;
      }

      return true;
    });

    if (candidateTeams.length === 1) {
      return {
        matched: true,
        team: candidateTeams[0],
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
  const suggestions = findClosestTeams(clean, configuredTeams, 3);

  return {
    matched: false,
    isAmbiguous: false,
    suggestions,
    reason: `Équipe non configurée : "${clean}" ne correspond à aucune équipe active de l'application`,
  };
}
