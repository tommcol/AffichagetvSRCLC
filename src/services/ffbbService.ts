import { MatchItem, FinishedMatchNotification, FFBBTeamItem } from '../types';

export type { FFBBTeamItem };

export interface FFBBClubInfo {
  clubCode: string;
  clubName: string;
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

  const isFem = compLower.includes('féminin') || compLower.includes('feminin') || compLower.includes('fille') || rawLower.includes(' f');
  const isMasc = compLower.includes('masculin') || compLower.includes('garçon') || rawLower.includes(' m');
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
      if (res.ok) {
        const data = await res.json();
        if (data.clubs && Array.isArray(data.clubs)) {
          return data.clubs;
        }
      }
    } catch (e) {
      console.warn("Erreur recherche API FFBB:", e);
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
      if (res.ok) {
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
      console.error("Erreur appel API FFBB officielle:", e);
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
