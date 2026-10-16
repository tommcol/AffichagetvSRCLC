// Helper to resolve code or name to organism ID
export async function resolveOrganismeId(codeOrName: string): Promise<{ organismeId: string; clubResolue?: any } | null> {
  const clean = codeOrName.trim();
  // Known mapping for SRC Basket / Sports Réunis Clayettois
  if (clean.toUpperCase() === "BFC0071024" || clean.toUpperCase().includes("CLAYETTE") || clean.toUpperCase() === "SRC BASKET") {
    return { organismeId: "9422" };
  }

  // Pure numeric string is already an organisme_id
  if (/^\d+$/.test(clean)) {
    return { organismeId: clean };
  }

  try {
    const res = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(clean)}`, {
      headers: { "Accept": "application/json" },
    }).catch(() => null);

    if (res && res.ok) {
      const data = await res.json();
      if (data.status === "ok" && data.club_resolu?.organisme_id) {
        return { organismeId: String(data.club_resolu.organisme_id), clubResolue: data.club_resolu };
      }
      if (data.status === "ambiguous" && Array.isArray(data.candidates) && data.candidates.length > 0) {
        const exactCode = data.candidates.find((c: any) => c.code && c.code.toUpperCase() === clean.toUpperCase());
        if (exactCode) return { organismeId: String(exactCode.organisme_id), clubResolue: exactCode };

        const matchName = data.candidates.find((c: any) => c.nom && c.nom.toUpperCase().includes(clean.toUpperCase()));
        if (matchName) return { organismeId: String(matchName.organisme_id), clubResolue: matchName };

        return { organismeId: String(data.candidates[0].organisme_id), clubResolue: data.candidates[0] };
      }
    }
  } catch (err) {
    console.error("[FFBB Resolver Error]:", err);
  }

  return null;
}

// Helper to normalize team category based on competition and team string
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

export function normalizeCategoryKey(raw?: string): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const normalized = normalizeFFBBCategory(clean);
  const key = (normalized.badgeCategory || clean).trim().toUpperCase();
  return key.replace(/\bG(\d*)\b/g, 'M$1').replace(/\s+/g, ' ');
}

export function isTeamCategoryIgnored(category: string, ignoredCategories: string[] = []): boolean {
  if (!ignoredCategories || ignoredCategories.length === 0) return false;
  const targetKey = normalizeCategoryKey(category);
  return ignoredCategories.some((item) => normalizeCategoryKey(item) === targetKey);
}

// Core helper to fetch and parse official FFBB club matches with real poule scores
export async function fetchOfficialClubData(clubCode: string) {
  const cleanCode = String(clubCode || "BFC0071024").trim();
  const resolved = await resolveOrganismeId(cleanCode);
  if (!resolved || !resolved.organismeId) {
    return {
      success: false,
      clubCode: cleanCode,
      matches: [],
      results: [],
      teams: [],
      totalCount: 0,
      message: `Club FFBB "${cleanCode}" non trouvé sur les registres officiels.`,
    };
  }

  const orgId = resolved.organismeId;

  // Fetch official matches, club details, and teams in parallel
  const [matchesData, clubData, teamsData] = await Promise.all([
    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : { matches: [], count: 0 }).catch(() => ({ matches: [], count: 0 })),

    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : null).catch(() => null),

    fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/teams`, {
      headers: { "Accept": "application/json" },
    }).then(r => r.ok ? r.json() : { teams: [] }).catch(() => ({ teams: [] })),
  ]);

  const rawMatches = Array.isArray(matchesData?.matches) ? matchesData.matches : [];
  const clubNom = clubData?.nom || resolved.clubResolue?.nom || "Sports Réunis Clayettois";
  const clubCommune = clubData?.commune?.libelle || resolved.clubResolue?.ville || "La Clayette";
  const defaultGym = clubData?.salle?.libelle || "COSEC";

  if (rawMatches.length === 0) {
    return {
      success: true,
      clubCode: cleanCode,
      organismeId: orgId,
      clubName: clubNom,
      city: clubCommune,
      teams: teamsData?.teams || [],
      matches: [],
      results: [],
      totalCount: 0,
      message: `Aucun match trouvé sur le calendrier FFBB officiel pour ${clubNom}.`,
    };
  }

  // Extract unique poule IDs to query official match scores and finished state
  const pouleIds = Array.from(new Set(rawMatches.map((m: any) => m.pouleId).filter(Boolean)));
  const scoreMap = new Map<string, { score1: number; score2: number; joue: boolean; nom1?: string; nom2?: string }>();

  if (pouleIds.length > 0) {
    const pouleResults = await Promise.all(
      pouleIds.map((pid) =>
        fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, {
          headers: { "Accept": "application/json" },
        }).then(r => r.ok ? r.json() : null).catch(() => null)
      )
    );

    for (const p of pouleResults) {
      if (p && Array.isArray(p.rencontres)) {
        for (const r of p.rencontres) {
          if (r.id) {
            const hasScore = r.resultatEquipe1 && r.resultatEquipe1 !== "None" && r.resultatEquipe1 !== "null";
            const isPlayed = r.joue === 1 || hasScore;
            if (isPlayed && hasScore) {
              scoreMap.set(String(r.id), {
                score1: parseInt(r.resultatEquipe1, 10) || 0,
                score2: parseInt(r.resultatEquipe2, 10) || 0,
                joue: true,
                nom1: r.nomEquipe1,
                nom2: r.nomEquipe2,
              });
            }
          }
        }
      }
    }
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  // Map into MatchItem format with exact scores
  const mappedMatches: any[] = [];
  const resultsList: any[] = [];

  for (let idx = 0; idx < rawMatches.length; idx++) {
    const m = rawMatches[idx];
    const isHome = m.isHome ?? true;
    const ourClubName = clubNom;
    const opp = m.opponent || "Adversaire Inconnu";
    const teamHome = isHome ? ourClubName : opp;
    const teamAway = isHome ? opp : ourClubName;

    let gym = defaultGym;
    if (m.location) {
      const parts = m.location.split(",");
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
    let matchResult: "win" | "loss" | "draw" | null = null;

    if (hasPouleScore && pouleScore) {
      homeScore = pouleScore.score1;
      awayScore = pouleScore.score2;
      const ourScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;
      matchResult = ourScore > oppScore ? "win" : ourScore < oppScore ? "loss" : "draw";
    }

    const matchItem = {
      id: `ffbb-${matchId}`,
      date: dateStr,
      time: m.time && m.time !== "Horaire à fixer" ? m.time : "20:30",
      category: normCat.badgeCategory,
      competition: m.competition || "Championnat FFBB",
      teamHome,
      teamAway,
      isHomeMatch: isHome,
      ourClubName,
      gymnasium: gym,
      city: isHome ? clubCommune : (m.location ? m.location.split(",").pop()?.trim() || "" : ""),
      status: isPast ? "finished" : "upcoming",
      result: matchResult,
      homeScore,
      awayScore,
      ffbbMatchNumber: m.ffbbMatchId ? `FFBB-${m.ffbbMatchId}` : undefined,
      teamLogo: m.teamLogo || (clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined),
      opponentLogo: m.opponentLogo || undefined,
      poule: m.poule || undefined,
      pouleId: m.pouleId || undefined,
    };

    // Le match reste dans le planning des matchs de la saison
    mappedMatches.push(matchItem);

    // S'il a un score ou est terminé, il s'ajoute aussi aux résultats
    if (hasPouleScore || isPast && (homeScore !== undefined || matchResult)) {
      resultsList.push(matchItem);
    }
  }

  mappedMatches.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  resultsList.sort((a: any, b: any) => b.date.localeCompare(a.date));

  // Format teams
  const rawTeams = Array.isArray(teamsData?.teams) ? teamsData.teams : [];
  const formattedTeams = rawTeams.map((t: any, idx: number) => {
    const comp = t.competition || "";
    const norm = normalizeFFBBCategory(`Équipe ${t.team_number || 1}`, comp);
    const teamMatches = [...mappedMatches, ...resultsList].filter((m: any) => m.pouleId === t.poule_id || m.competition === comp);
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
      status: "active",
    };
  });

  formattedTeams.sort((a: any, b: any) => {
    const rank = (str: string) => {
      if (str.includes("Seniors F")) return 1;
      if (str.includes("Seniors G")) return 2;
      if (str.includes("U18 F")) return 3;
      if (str.includes("U18 G")) return 4;
      if (str.includes("U15 F")) return 5;
      if (str.includes("U13 F1")) return 6;
      if (str.includes("U13 F2")) return 7;
      if (str.includes("U13 G")) return 8;
      if (str.includes("U11 F")) return 9;
      if (str.includes("U11 G")) return 10;
      return 99;
    };
    return rank(a.name) - rank(b.name);
  });

  return {
    success: true,
    source: "ffbb_api_desimone",
    clubCode: cleanCode,
    organismeId: orgId,
    clubName: clubNom,
    city: clubCommune,
    gymnasiumDefault: defaultGym,
    logoUrl: clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined,
    teams: formattedTeams,
    matches: mappedMatches,
    results: resultsList,
    totalCount: mappedMatches.length + resultsList.length,
    message: `API FFBB : ${mappedMatches.length} matchs à venir, ${resultsList.length} résultats officiels avec scores enregistrés.`,
  };
}

