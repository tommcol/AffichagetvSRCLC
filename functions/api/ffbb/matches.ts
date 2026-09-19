async function resolveOrganismeId(codeOrName: string): Promise<string | null> {
  const clean = codeOrName.trim();
  if (clean.toUpperCase() === 'BFC0071024' || clean.toUpperCase().includes('CLAYETTE') || clean.toUpperCase() === 'SRC BASKET') {
    return '9422';
  }
  if (/^\d+$/.test(clean)) {
    return clean;
  }

  try {
    const res = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(clean)}`, {
      headers: { 'Accept': 'application/json' },
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
    console.error('[FFBB Resolver]:', err);
  }
  return null;
}

function normalizeFFBBCategory(rawTeam?: string, competition?: string): {
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

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const clubCode = (url.searchParams.get('code') || 'BFC0071024').trim();

  try {
    const orgId = await resolveOrganismeId(clubCode);
    if (!orgId) {
      return new Response(
        JSON.stringify({
          success: false,
          source: 'ffbb_api_desimone',
          clubCode,
          matches: [],
          results: [],
          totalCount: 0,
          message: `Club FFBB "${clubCode}" non trouvé sur les registres officiels. Aucune fausse donnée générée.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const [matchesData, clubData, teamsData] = await Promise.all([
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, {
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { matches: [] }).catch(() => ({ matches: [] })),

      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : null).catch(() => null),

      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/teams`, {
        headers: { 'Accept': 'application/json' },
      }).then(r => r.ok ? r.json() : { teams: [] }).catch(() => ({ teams: [] })),
    ]);

    const rawMatches = Array.isArray(matchesData?.matches) ? matchesData.matches : [];
    const clubNom = clubData?.nom || 'Sports Réunis Clayettois';
    const clubCommune = clubData?.commune?.libelle || 'La Clayette';
    const defaultGym = clubData?.salle?.libelle || 'COSEC';
    const todayStr = new Date().toISOString().slice(0, 10);

    const mappedMatches = rawMatches.map((m: any, idx: number) => {
      const isHome = m.isHome ?? true;
      const ourClubName = clubNom;
      const opp = m.opponent || 'Adversaire Inconnu';
      const teamHome = isHome ? ourClubName : opp;
      const teamAway = isHome ? opp : ourClubName;

      let gym = defaultGym;
      if (m.location) {
        const parts = m.location.split(',');
        if (parts[0] && parts[0].trim()) {
          gym = parts[0].trim();
        }
      }

      const dateStr = m.dateISO && m.dateISO.length >= 10 ? m.dateISO.slice(0, 10) : todayStr;
      const isPast = dateStr < todayStr;

      const normCat = normalizeFFBBCategory(m.team, m.competition);
      return {
        id: `ffbb-${m.ffbbMatchId || idx}`,
        date: dateStr,
        time: m.time && m.time !== 'Horaire à fixer' ? m.time : '20:30',
        category: normCat.badgeCategory,
        competition: m.competition || 'Championnat FFBB',
        teamHome,
        teamAway,
        isHomeMatch: isHome,
        ourClubName,
        gymnasium: gym,
        city: isHome ? clubCommune : (m.location ? m.location.split(',').pop()?.trim() || '' : ''),
        status: isPast ? 'finished' : 'upcoming',
        result: null,
        ffbbMatchNumber: m.ffbbMatchId ? `FFBB-${m.ffbbMatchId}` : undefined,
        teamLogo: m.teamLogo || (clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined),
        opponentLogo: m.opponentLogo || undefined,
        poule: m.poule || undefined,
        pouleId: m.pouleId || undefined,
      };
    });

    mappedMatches.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const upcomingMatches = mappedMatches.filter((m: any) => m.status === 'upcoming');
    const pastResults = mappedMatches.filter((m: any) => m.status === 'finished').reverse();

    const rawTeams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];
    const formattedTeams = rawTeams.map((t: any, idx: number) => {
      const comp = t.competition || '';
      const norm = normalizeFFBBCategory(`Équipe ${t.team_number || 1}`, comp);
      const teamMatches = mappedMatches.filter((m: any) => m.pouleId === t.poule_id || m.competition === comp);
      const pouleName = teamMatches.find((m: any) => m.poule)?.poule;

      return {
        id: `team-${t.engagement_id || idx}`,
        name: norm.displayName,
        category: norm.badgeCategory,
        gender: norm.gender,
        competition: comp,
        poule: pouleName,
        pouleId: t.poule_id,
        matchesCount: teamMatches.length,
        status: 'active',
      };
    });

    formattedTeams.sort((a: any, b: any) => {
      const rank = (str: string) => {
        if (str.includes('Seniors F')) return 1;
        if (str.includes('Seniors G')) return 2;
        if (str.includes('U18 F')) return 3;
        if (str.includes('U18 G')) return 4;
        if (str.includes('U15 F')) return 5;
        if (str.includes('U13 F1')) return 6;
        if (str.includes('U13 F2')) return 7;
        if (str.includes('U13 G')) return 8;
        if (str.includes('U11 F')) return 9;
        if (str.includes('U11 G')) return 10;
        return 99;
      };
      return rank(a.name) - rank(b.name);
    });

    return new Response(
      JSON.stringify({
        success: true,
        source: 'ffbb_api_desimone',
        clubCode,
        organismeId: orgId,
        clubName: clubNom,
        city: clubCommune,
        teams: formattedTeams,
        matches: upcomingMatches,
        results: pastResults,
        totalCount: mappedMatches.length,
        message: `API FFBB Officielle : ${upcomingMatches.length} rencontres à venir et ${pastResults.length} résultats récents pour ${clubNom}.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        source: 'ffbb_api_desimone',
        clubCode,
        matches: [],
        results: [],
        totalCount: 0,
        error: err.message,
        message: "Erreur lors de la récupération des données FFBB officielles. Aucune fausse donnée générée.",
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
