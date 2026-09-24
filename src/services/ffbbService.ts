import { MatchItem, FinishedMatchNotification, FFBBTeamItem } from '../types';

export type { FFBBTeamItem };

export interface FFBBClubInfo {
  clubCode: string;
  clubName: string;
  logoUrl?: string;
  city?: string;
  gymnasiumDefault?: string;
  league: string; // Comité départemental / Ligue régionale
  season: string;
  teamsCount: number;
  teamsList: FFBBTeamItem[];
}

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

/**
 * Vérifie si une catégorie fait partie de la liste des équipes ignorées/décochées
 */
export function isTeamCategoryIgnored(category: string, ignoredCategories: string[] = []): boolean {
  if (!ignoredCategories || ignoredCategories.length === 0) return false;
  const targetKey = normalizeCategoryKey(category);
  return ignoredCategories.some((item) => normalizeCategoryKey(item) === targetKey);
}

/**
 * Resolves FFBB club code or name to an organisme_id
 */
async function resolveOrganismeId(codeOrName: string): Promise<string | null> {
  const clean = (codeOrName || '').trim();
  if (
    clean.toUpperCase() === 'BFC0071024' ||
    clean.toUpperCase().includes('CLAYETTE') ||
    clean.toUpperCase().includes('SRC BASKET') ||
    clean.toUpperCase() === 'SRC'
  ) {
    return '9422';
  }
  if (/^\d+$/.test(clean)) {
    return clean;
  }

  try {
    const res = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(clean)}`, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'ok' && data.club_resolu?.organisme_id) {
        return String(data.club_resolu.organisme_id);
      }
      if (data.status === 'ambiguous' && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const exact = data.candidates.find((c: any) => c.code?.toUpperCase() === clean.toUpperCase());
        return String(exact ? exact.organisme_id : data.candidates[0].organisme_id);
      }
    }
  } catch (err) {
    console.warn('[FFBB Resolver client]:', err);
  }
  return null;
}

/**
 * Direct client-side fetch from the official FFBB CORS-enabled endpoint
 * (Guarantees synchronization works on Cloudflare static hosting)
 */
async function fetchClubDataDirect(clubCode: string): Promise<{
  matches: MatchItem[];
  results: MatchItem[];
  clubInfo: FFBBClubInfo;
  source?: string;
  message?: string;
} | null> {
  try {
    const orgId = await resolveOrganismeId(clubCode);
    if (!orgId) return null;

    // Fetch matches and club details in parallel
    const [matchesRes, clubRes] = await Promise.all([
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, {
        headers: { Accept: 'application/json' },
      }).catch(() => null),
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
        headers: { Accept: 'application/json' },
      }).then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    let res = matchesRes;
    if (!res || !res.ok) {
      res = await fetch(`https://ffbb.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, {
        headers: { Accept: 'application/json' },
      }).catch(() => null);
    }
    if (!res || !res.ok) return null;

    const data = await res.json();
    const rawMatches = Array.isArray(data.matches) ? data.matches : [];
    const clubNom = clubRes?.nom || data.club || (clubCode.toUpperCase() === 'BFC0071024' ? 'Sports Réunis Clayettois' : `Club ${clubCode}`);
    const clubLogoUrl = clubRes?.logo?.id
      ? `https://api.ffbb.com/assets/${clubRes.logo.id}`
      : (clubRes?.logo_url || clubRes?.logo || undefined);
    const clubCity = clubRes?.commune?.libelle || undefined;
    const clubGym = clubRes?.salle?.libelle || undefined;
    const todayStr = new Date().toISOString().slice(0, 10);

    // Extract unique poule IDs to query scores
    const pouleIds = Array.from(new Set(rawMatches.map((m: any) => m.pouleId).filter(Boolean)));
    const scoreMap = new Map<string, { score1: number; score2: number; joue: boolean }>();

    if (pouleIds.length > 0) {
      try {
        const pouleResults = await Promise.all(
          pouleIds.map((pid) =>
            fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, {
              headers: { Accept: 'application/json' },
            }).then(r => r.ok ? r.json() : null).catch(() => null)
          )
        );

        for (const p of pouleResults) {
          if (p && Array.isArray(p.rencontres)) {
            for (const r of p.rencontres) {
              if (r.id) {
                const hasScore = r.resultatEquipe1 && r.resultatEquipe1 !== 'None' && r.resultatEquipe1 !== 'null';
                const isPlayed = r.joue === 1 || hasScore;
                if (isPlayed && hasScore) {
                  scoreMap.set(String(r.id), {
                    score1: parseInt(r.resultatEquipe1, 10) || 0,
                    score2: parseInt(r.resultatEquipe2, 10) || 0,
                    joue: true,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erreur chargement poules FFBB direct:', err);
      }
    }

    const mappedMatches: MatchItem[] = [];
    const resultsList: MatchItem[] = [];

    for (let idx = 0; idx < rawMatches.length; idx++) {
      const m = rawMatches[idx];
      const isHome = m.isHome ?? true;
      const ourClubName = clubNom;
      const opp = m.opponent || 'Adversaire Inconnu';
      const teamHome = isHome ? ourClubName : opp;
      const teamAway = isHome ? opp : ourClubName;

      let gym = 'Gymnase des Écharmeaux';
      if (m.location) {
        const parts = m.location.split(',');
        if (parts[0] && parts[0].trim()) {
          gym = parts[0].trim();
        }
      }

      const dateStr = m.dateISO && m.dateISO.length >= 10 ? m.dateISO.slice(0, 10) : todayStr;
      const normCat = normalizeFFBBCategory(m.team, m.competition);
      const matchId = String(m.ffbbMatchId || idx);
      const pouleScore = scoreMap.get(matchId);
      const hasPouleScore = pouleScore && pouleScore.joue;
      const isPast = dateStr < todayStr || Boolean(hasPouleScore);

      let homeScore: number | undefined = undefined;
      let awayScore: number | undefined = undefined;
      let matchResult: 'win' | 'loss' | null = null;

      if (hasPouleScore && pouleScore) {
        homeScore = pouleScore.score1;
        awayScore = pouleScore.score2;
        const ourScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        matchResult = ourScore > oppScore ? 'win' : ourScore < oppScore ? 'loss' : null;
      }

      // Extract accurate match time
      let matchTime = '';
      if (m.time && m.time !== 'Horaire à fixer' && String(m.time).trim() !== '') {
        let t = String(m.time).trim().replace(/[hH]/g, ':');
        if (/^\d{1,2}:\d{2}$/.test(t)) {
          if (t.length === 4) t = '0' + t;
          matchTime = t;
        } else {
          matchTime = t;
        }
      } else if (m.date_rencontre && String(m.date_rencontre).includes('T')) {
        const parts = String(m.date_rencontre).split('T')[1];
        if (parts && parts.length >= 5) {
          const hhmm = parts.slice(0, 5);
          if (hhmm !== '00:00') matchTime = hhmm;
        }
      }

      if (!matchTime) {
        matchTime = 'Horaire à fixer';
      }

      const matchItem: MatchItem = {
        id: `ffbb-${matchId}`,
        date: dateStr,
        time: matchTime,
        category: normCat.badgeCategory,
        competition: m.competition || 'Championnat FFBB',
        teamHome,
        teamAway,
        isHomeMatch: isHome,
        ourClubName,
        gymnasium: gym,
        city: isHome ? 'La Clayette' : (m.location ? m.location.split(',').pop()?.trim() || '' : ''),
        status: isPast ? 'finished' : 'upcoming',
        result: matchResult,
        homeScore,
        awayScore,
        ffbbMatchNumber: m.ffbbMatchId ? `FFBB-${m.ffbbMatchId}` : undefined,
        teamLogo: m.teamLogo || undefined,
        opponentLogo: m.opponentLogo || undefined,
        poule: m.poule || undefined,
        pouleId: m.pouleId || undefined,
      };

      if (hasPouleScore) {
        resultsList.push(matchItem);
      } else {
        mappedMatches.push(matchItem);
      }
    }

    mappedMatches.sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      const timeA = a.time === 'Horaire à fixer' ? '99:99' : a.time;
      const timeB = b.time === 'Horaire à fixer' ? '99:99' : b.time;
      return timeA.localeCompare(timeB);
    });
    resultsList.sort((a, b) => b.date.localeCompare(a.date));

    const upcomingMatches = mappedMatches.filter(m => m.status === 'upcoming');
    const pastResults = resultsList;

    const distinctCategories = Array.from(new Set(mappedMatches.map(m => m.category))).filter(Boolean);
    const teamsList: FFBBTeamItem[] = distinctCategories.map((cat, idx) => {
      const catMatches = mappedMatches.filter(m => m.category === cat);
      const sample = catMatches[0];
      const norm = normalizeFFBBCategory(cat, sample?.competition);
      return {
        id: `cat-${idx}`,
        name: norm.displayName,
        category: norm.badgeCategory,
        gender: norm.gender,
        competition: sample?.competition || 'Championnat FFBB',
        poule: sample?.poule,
        pouleId: sample?.pouleId,
        matchesCount: catMatches.length,
        status: 'active' as const,
      };
    });

    const clubInfo: FFBBClubInfo = {
      clubCode,
      clubName: clubNom,
      logoUrl: clubLogoUrl,
      city: clubCity,
      gymnasiumDefault: clubGym,
      league: 'Ligue Régionale & Comité Départemental FFBB',
      season: '2026-2027',
      teamsCount: teamsList.length,
      teamsList,
    };

    return {
      matches: upcomingMatches,
      results: pastResults,
      clubInfo,
      source: 'ffbb_api_desimone',
      message: `API FFBB Officielle : ${upcomingMatches.length} rencontres à venir pour ${clubNom}.`,
    };
  } catch (e) {
    console.warn('Erreur appel direct ffbb.desimone.fr:', e);
    return null;
  }
}

/**
 * Service to handle FFBB API synchronization
 * Supports club code lookup, live match results, and match finished notifications
 */
export class FFBBService {
  /**
   * Search clubs on FFBB API
   */
  static async searchClub(query: string): Promise<Array<{ code: string; name: string; city: string; committee: string }>> {
    try {
      const res = await fetch(`/api/ffbb/search?q=${encodeURIComponent(query)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.clubs && Array.isArray(data.clubs) && data.clubs.length > 0) {
          return data.clubs;
        }
      }
    } catch (e) {
      // Continue to direct search
    }

    // Direct search on ffbb.desimone.fr
    try {
      const clean = query.trim();
      const res = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(clean)}`, {
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'ok' && data.club_resolu) {
          return [
            {
              code: data.club_resolu.code || (data.club_resolu.organisme_id ? String(data.club_resolu.organisme_id) : clean),
              name: data.club_resolu.nom || clean,
              city: data.club_resolu.ville || '',
              committee: data.club_resolu.departement || 'FFBB',
            },
          ];
        }
        if (data.status === 'ambiguous' && Array.isArray(data.candidates) && data.candidates.length > 0) {
          return data.candidates.map((c: any) => ({
            code: c.code || String(c.organisme_id || ''),
            name: c.nom || '',
            city: c.ville || '',
            committee: c.departement || '',
          }));
        }
      }
    } catch (e) {
      console.warn('Erreur recherche directe FFBB:', e);
    }

    return [
      {
        code: query.toUpperCase().startsWith("BFC") ? query.toUpperCase() : `BFC${query.toUpperCase()}`,
        name: `Basket Club ${query}`,
        city: "Région Bourgogne-Franche-Comté",
        committee: "Comité Départemental FFBB",
      },
    ];
  }

  /**
   * Fetch club matches and results based on FFBB code
   */
  static async fetchClubData(clubCode: string): Promise<{
    matches: MatchItem[];
    results: MatchItem[];
    clubInfo: FFBBClubInfo;
    source?: string;
    message?: string;
  }> {
    try {
      const res = await fetch(`/api/ffbb/matches?code=${encodeURIComponent(clubCode)}`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        const matches: MatchItem[] = data.matches || [];
        const results: MatchItem[] = data.results || [];

        // Build teams from the official API teams or from unique match categories
        let teamsList: FFBBTeamItem[] = [];
        if (data.teams && Array.isArray(data.teams) && data.teams.length > 0) {
          teamsList = data.teams.map((t: any, idx: number) => {
            if (t.name && t.category && t.matchesCount !== undefined) {
              return {
                id: t.id || `team-${idx}`,
                name: t.name,
                category: t.category,
                gender: t.gender || 'M',
                competition: t.competition || '',
                poule: t.poule,
                pouleId: t.pouleId || t.poule_id,
                matchesCount: t.matchesCount || 0,
                status: 'active' as const,
              };
            }
            const comp = t.competition || '';
            const norm = normalizeFFBBCategory(`Équipe ${t.team_number || 1}`, comp);
            const teamMatches = matches.filter(m => m.pouleId === t.poule_id || m.competition === comp);
            return {
              id: `team-${t.engagement_id || idx}`,
              name: norm.displayName,
              category: norm.badgeCategory,
              gender: norm.gender,
              competition: comp,
              poule: teamMatches.find(m => m.poule)?.poule,
              pouleId: t.poule_id,
              matchesCount: teamMatches.length,
              status: 'active' as const,
            };
          });
        } else {
          // Extract distinct categories from real matches
          const distinctCategories = Array.from(new Set(matches.map(m => m.category))).filter(Boolean);
          teamsList = distinctCategories.map((cat, idx) => {
            const catMatches = matches.filter(m => m.category === cat);
            const sample = catMatches[0];
            const norm = normalizeFFBBCategory(cat, sample?.competition);
            return {
              id: `cat-${idx}`,
              name: norm.displayName,
              category: norm.badgeCategory,
              gender: norm.gender,
              competition: sample?.competition || 'Championnat FFBB',
              poule: sample?.poule,
              pouleId: sample?.pouleId,
              matchesCount: catMatches.length,
              status: 'active' as const,
            };
          });
        }

        const clubNom = data.clubName || (clubCode.toUpperCase() === 'BFC0071024' ? 'Sports Réunis Clayettois' : `Club ${clubCode}`);

        const clubInfo: FFBBClubInfo = {
          clubCode,
          clubName: clubNom,
          logoUrl: data.logoUrl,
          city: data.city,
          gymnasiumDefault: data.gymnasiumDefault,
          league: 'Ligue Régionale & Comité Départemental FFBB',
          season: '2026-2027',
          teamsCount: teamsList.length,
          teamsList,
        };

        return {
          matches,
          results,
          clubInfo,
          source: data.source || 'ffbb_api_desimone',
          message: data.message,
        };
      }
    } catch (e) {
      console.warn("Proxy local non disponible, passage à l'appel direct FFBB:", e);
    }

    // Direct fetch from ffbb.desimone.fr (works reliably on Cloudflare)
    const directData = await fetchClubDataDirect(clubCode);
    if (directData && (directData.matches.length > 0 || directData.results.length > 0)) {
      return directData;
    }
    if (directData) {
      return directData;
    }

    // When API fails or has no matches: RETURN EMPTY DATA — NEVER INVENT FAKE MATCHES
    const clubNom = clubCode.toUpperCase() === 'BFC0071024' ? 'Sports Réunis Clayettois' : `Club ${clubCode}`;
    const clubInfo: FFBBClubInfo = {
      clubCode,
      clubName: clubNom,
      league: 'Ligue Régionale & Comité Départemental FFBB',
      season: '2026-2027',
      teamsCount: 0,
      teamsList: [],
    };

    return {
      matches: [],
      results: [],
      clubInfo,
      source: 'ffbb_api_desimone',
      message: "Aucune rencontre disponible sur l'API FFBB officielle.",
    };
  }

  /**
   * Tente de récupérer automatiquement le logo officiel FFBB d'un club adverse à partir de son nom
   */
  static async fetchClubLogoByName(clubName: string): Promise<string | null> {
    if (!clubName || clubName.trim().length < 2) return null;
    const cleanName = clubName.trim();

    try {
      const orgId = await resolveOrganismeId(cleanName);
      if (orgId) {
        const res = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
          headers: { Accept: 'application/json' },
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const logoUrl = data?.logo?.id
            ? `https://api.ffbb.com/assets/${data.logo.id}`
            : (data?.logo_url || data?.logo || null);
          if (logoUrl) return logoUrl;
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la recherche du logo FFBB du club:', cleanName, e);
    }
    return null;
  }

  /**
   * Helper to trigger and format a finished match notification event (1-hour overlay)
   */
  static createFinishedNotification(
    match: MatchItem,
    ourScore: number,
    opponentScore: number,
    durationMinutes: number = 60
  ): FinishedMatchNotification {
    const isWin = ourScore > opponentScore;
    const now = Date.now();

    return {
      id: `notif-${match.id}-${now}`,
      matchId: match.id,
      team: match.category,
      category: match.category,
      competition: match.competition,
      ourTeam: match.ourClubName,
      opponent: match.isHomeMatch ? match.teamAway : match.teamHome,
      isWin,
      ourScore,
      opponentScore,
      timestamp: now,
      expiresAt: now + durationMinutes * 60 * 1000,
      gymnasium: match.gymnasium,
      triggeredBy: 'ffbb',
    };
  }
}
