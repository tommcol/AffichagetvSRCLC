import { clubDateTimeTimestamp } from '../src/utils/clubTime';
import { readSharedAppData, commitSharedAppData, commitSharedAppDataOrThrow } from './appDataCoordinator';
// ============================================================
// API FFBB (synchronisation matchs/résultats, cron)
// ============================================================

import { Env } from './types';
import { syncActiveTelegramAlertsWithFfbbResults } from './telegram';

// ============================================================
// FFBB — matchs et recherche
// ============================================================

export async function resolveOrganismeId(codeOrName: string): Promise<string | null> {
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
      const data: any = await res.json();
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

export async function ffbbMatches(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clubCode = (url.searchParams.get('code') || 'BFC0071024').trim();

  try {
    const orgId = await resolveOrganismeId(clubCode);
    if (!orgId) {
      return new Response(
        JSON.stringify({
          success: false, source: 'ffbb_api_desimone', clubCode,
          matches: [], results: [], totalCount: 0,
          message: `Club FFBB "${clubCode}" non trouvé sur les registres officiels. Aucune fausse donnée générée.`,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Contrat REST documenté dans nickdesi/ffbb-data-client :
    // GET /api/v1/club/{organisme_id}/matches renvoie { organisme_id, club, matches, count, total, pagination }.
    // Ne jamais convertir une erreur HTTP en liste vide : le cron doit conserver les données déjà en KV.
    const fetchApiJson = async (endpoint: string): Promise<any> => {
      const response = await fetch(`https://ffbb-api.desimone.fr${endpoint}`, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'AffichageTV-SRC/1.0' },
        signal: AbortSignal.timeout(20000),
      });
      const body: any = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = body?.error?.message || body?.detail || `HTTP ${response.status}`;
        throw new Error(`API FFBB ${endpoint}: ${detail}`);
      }
      if (!body || typeof body !== 'object' || body.error) {
        throw new Error(`Réponse invalide de l'API FFBB pour ${endpoint}`);
      }
      return body;
    };

    const [matchesData, clubData, teamsData] = await Promise.all([
      fetchApiJson(`/api/v1/club/${encodeURIComponent(orgId)}/matches?limit=500&offset=0`),
      fetchApiJson(`/api/v1/club/${encodeURIComponent(orgId)}`).catch((err) => {
        console.warn('[FFBB API] Fiche club indisponible; utilisation des valeurs de secours.', err);
        return null;
      }),
      fetchApiJson(`/api/v1/club/${encodeURIComponent(orgId)}/teams`).catch((err) => {
        console.warn('[FFBB API] Liste des équipes indisponible; déduction depuis les matchs.', err);
        return null;
      }),
    ]);

    const rawMatches: any[] = Array.isArray(matchesData?.matches) ? matchesData.matches : [];
    if (!Array.isArray(matchesData?.matches)) {
      throw new Error('Réponse API FFBB inattendue : le champ matches est absent.');
    }
    console.log(`[FFBB API] Club ${orgId}: ${rawMatches.length}/${matchesData?.total ?? rawMatches.length} rencontres récupérées.`);
    const clubNom = clubData?.nom || 'Sports Réunis Clayettois';
    const clubCommune = clubData?.commune?.libelle || 'La Clayette';
    const defaultGym = clubData?.salle?.libelle || 'COSEC';
    const clubLogoUrl = clubData?.logo?.id
      ? `https://api.ffbb.com/assets/${clubData.logo.id}`
      : (clubData?.logo_url || clubData?.logo || undefined);
    const todayStr = new Date().toISOString().slice(0, 10);

    // Extract unique poule IDs to query official match scores and finished state
    const pouleIds = Array.from(new Set(rawMatches.map((m: any) => m.pouleId).filter(Boolean)));
    const scoreMap = new Map<string, { score1: number; score2: number; joue: boolean }>();
    // Rencontres brutes de chaque poule (toutes, avec ou sans score), pour retrouver aussi l'heure officielle.
    const rencontreMap = new Map<string, any>();
    const normalizeMatchId = (value: unknown): string => {
      if (value === undefined || value === null || String(value).trim() === '') return '';
      return String(value).trim().replace(/^FFBB[-_]?/i, '').replace(/^ffbb-/i, '');
    };
    const storeScoreAliases = (match: any, score: { score1: number; score2: number; joue: boolean }) => {
      for (const key of [match?.id, match?.ffbbMatchId, match?.matchId, match?.rencontreId, match?.numero, match?.numeroRencontre]) {
        const normalized = normalizeMatchId(key);
        if (normalized) scoreMap.set(normalized, score);
      }
    };

    if (pouleIds.length > 0) {
      try {
        const pouleResults: any[] = await Promise.all(
          pouleIds.map((pid) =>
            fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, {
              headers: { 'Accept': 'application/json' },
            }).then(r => r.ok ? r.json() : null).catch(() => null)
          )
        );

        for (const p of pouleResults) {
          if (p && Array.isArray(p.rencontres)) {
            for (const r of p.rencontres) {
              for (const k of [r?.id, r?.ffbbMatchId, r?.matchId, r?.rencontreId, r?.numero, r?.numeroRencontre]) {
                const nk = normalizeMatchId(k);
                if (nk) rencontreMap.set(nk, r);
              }
              const rawScore1 = r.resultatEquipe1;
              const rawScore2 = r.resultatEquipe2;
              const validScore = rawScore1 !== undefined && rawScore1 !== null && rawScore1 !== ''
                && rawScore1 !== 'None' && rawScore1 !== 'null'
                && rawScore2 !== undefined && rawScore2 !== null && rawScore2 !== ''
                && rawScore2 !== 'None' && rawScore2 !== 'null'
                && Number.isFinite(Number(rawScore1)) && Number.isFinite(Number(rawScore2));
              const isPlayed = r.joue === 1 || r.joue === true || validScore;
              if (isPlayed && validScore) {
                storeScoreAliases(r, {
                  score1: Number(rawScore1),
                  score2: Number(rawScore2),
                  joue: true,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Erreur chargement poules FFBB direct:', err);
      }
    }

    const mappedMatches: any[] = [];
    const resultsList: any[] = [];

    for (let idx = 0; idx < rawMatches.length; idx++) {
      const m = rawMatches[idx];
      const isHome = m.isHome ?? true;
      const ourClubName = clubNom;
      const opp = m.opponent || 'Adversaire Inconnu';
      const teamHome = isHome ? ourClubName : opp;
      const teamAway = isHome ? opp : ourClubName;
      let gym = defaultGym;
      if (m.location) {
        const parts = m.location.split(',');
        if (parts[0] && parts[0].trim()) gym = parts[0].trim();
      }
      const dateStr = m.dateISO && m.dateISO.length >= 10 ? m.dateISO.slice(0, 10) : todayStr;
      const normCat = normalizeFFBBCategory(m.team, m.competition);
      const matchId = String(m.ffbbMatchId || m.id || m.matchId || m.rencontreId || idx);
      // Selon les endpoints FFBB, l'identifiant peut être exposé sous plusieurs formes.
      const candidateIds = [m.ffbbMatchId, m.id, m.matchId, m.rencontreId, m.numero, m.numeroRencontre]
        .map(normalizeMatchId).filter(Boolean);
      const pouleScore = candidateIds.map((id: string) => scoreMap.get(id)).find(Boolean);
      // Priorité aux scores renvoyés dans la rencontre du club : ils sont liés directement
      // au match et évitent de réutiliser par erreur un score de poule associé à un ID ambigu.
      // scoreLocal/scoreOpponent sont orientés club/adversaire; scoreEquipe1/2 sont orientés
      // équipe 1/équipe 2 (domicile/extérieur dans le contrat REST FFBB).
      const localScore = m.scoreLocal ?? m.score_local;
      const opponentScore = m.scoreOpponent ?? m.score_opponent;
      const hasLocalScores = localScore !== undefined && localScore !== null && localScore !== ''
        && localScore !== 'None' && localScore !== 'null'
        && opponentScore !== undefined && opponentScore !== null && opponentScore !== ''
        && opponentScore !== 'None' && opponentScore !== 'null'
        && Number.isFinite(Number(localScore)) && Number.isFinite(Number(opponentScore));
      const directScore1 = m.resultatEquipe1 ?? m.resultat_equipe1 ?? m.scoreEquipe1 ?? m.score_equipe1 ?? m.score1;
      const directScore2 = m.resultatEquipe2 ?? m.resultat_equipe2 ?? m.scoreEquipe2 ?? m.score_equipe2 ?? m.score2;
      const hasDirectScore = directScore1 !== undefined && directScore1 !== null && directScore1 !== ''
        && directScore1 !== 'None' && directScore1 !== 'null'
        && directScore2 !== undefined && directScore2 !== null && directScore2 !== ''
        && directScore2 !== 'None' && directScore2 !== 'null'
        && Number.isFinite(Number(directScore1)) && Number.isFinite(Number(directScore2));
      const matchScore = hasLocalScores
        ? {
            score1: Number(isHome ? localScore : opponentScore),
            score2: Number(isHome ? opponentScore : localScore),
            joue: true,
          }
        : hasDirectScore
          ? { score1: Number(directScore1), score2: Number(directScore2), joue: true }
          : pouleScore;
      const hasPouleScore = Boolean(matchScore?.joue);
      const isPast = dateStr < todayStr || Boolean(hasPouleScore);

      let homeScore: number | undefined = undefined;
      let awayScore: number | undefined = undefined;
      let matchResult: 'win' | 'loss' | 'draw' | null = null;

      if (hasPouleScore && matchScore) {
        homeScore = matchScore.score1;
        awayScore = matchScore.score2;
        const ourScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        matchResult = ourScore > oppScore ? 'win' : ourScore < oppScore ? 'loss' : 'draw';
      }

      // Extraire l'heure officielle depuis les champs possibles de l'API FFBB.
      // Selon la réponse, l'heure peut être dans "time"/"heure"/"horaire"
      // ou incluse dans un champ date ISO (dateISO/date_rencontre).
      let matchTime = '';
      const normalizeTime = (value: unknown): string => {
        if (value === undefined || value === null) return '';
        const raw = String(value).trim();
        if (!raw || /^horaire\s+à\s+fixer$/i.test(raw) || /^(?:null|none|undefined)$/i.test(raw)) return '';
        const candidate = raw.replace(/[hH]/g, ':');
        const match = candidate.match(/(?:^|T|\s)(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?$/);
        if (!match) return '';
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour > 23 || minute > 59 || (hour === 0 && minute === 0)) return '';
        return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      };
      for (const candidate of [m.time, m.heure, m.horaire, m.date_rencontre, m.dateISO, m.date_iso, m.datetime, m.dateTime]) {
        matchTime = normalizeTime(candidate);
        if (matchTime) break;
      }
      // Repli : l'heure officielle est parfois seulement dans la rencontre de la poule,
      // ou sous un autre nom de champ. On cherche d'abord dans la poule, puis dans tous les champs texte.
      if (!matchTime) {
        const poulesRencontre = candidateIds.map((id: string) => rencontreMap.get(id)).find(Boolean);
        for (const src of [poulesRencontre, m]) {
          if (!src || matchTime) continue;
          for (const key of ['heure', 'horaire', 'time', 'heureRencontre', 'heure_rencontre', 'date_rencontre', 'dateRencontre', 'dateHeure', 'date_heure', 'dateISO', 'datetime', 'date']) {
            matchTime = normalizeTime((src as any)[key]);
            if (matchTime) break;
          }
          if (!matchTime) {
            for (const [key, value] of Object.entries(src as any)) {
              if (typeof value !== 'string' || !/(heure|horaire|time|date)/i.test(key)) continue;
              matchTime = normalizeTime(value);
              if (matchTime) break;
            }
          }
        }
      }

      // Ne jamais inventer une heure si la FFBB ne la fournit pas.
      // Une heure vide pourra être complétée automatiquement lors d'une prochaine synchronisation.

      const matchItem = {
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
        city: isHome ? clubCommune : (m.location ? m.location.split(',').pop()?.trim() || '' : ''),
        status: isPast ? 'finished' : 'upcoming',
        result: matchResult,
        homeScore,
        awayScore,
        ffbbMatchNumber: m.ffbbMatchId ? `FFBB-${m.ffbbMatchId}` : undefined,
        teamLogo: m.teamLogo || (clubData?.logo?.id ? `https://api.ffbb.com/assets/${clubData.logo.id}` : undefined),
        opponentLogo: m.opponentLogo || undefined,
        poule: m.poule || undefined,
        pouleId: m.pouleId || undefined,
      };

      // Le match reste dans le planning des matchs
      mappedMatches.push(matchItem);

      // S'il a un score ou est terminé, il s'ajoute aussi aux résultats
      if (hasPouleScore || isPast && (homeScore !== undefined || matchResult)) {
        resultsList.push(matchItem);
      }
    }

    mappedMatches.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    await syncActiveTelegramAlertsWithFfbbResults(env, mappedMatches);

    resultsList.sort((a: any, b: any) => b.date.localeCompare(a.date));

    const rawTeams = Array.isArray(teamsData?.teams) && teamsData.teams.length > 0 ? teamsData.teams : [];
    let formattedTeams = rawTeams.map((t: any, idx: number) => {
      const comp = t.competition || '';
      const norm = normalizeFFBBCategory(`Équipe ${t.team_number || 1}`, comp);
      const teamMatches = [...mappedMatches, ...resultsList].filter((m: any) => m.pouleId === t.poule_id || m.competition === comp);
      const pouleName = teamMatches.find((m: any) => m.poule)?.poule;
      return {
        id: `team-${t.engagement_id || idx}`,
        name: norm.displayName, category: norm.badgeCategory, gender: norm.gender,
        competition: comp, poule: pouleName, pouleId: t.poule_id,
        matchesCount: teamMatches.length, status: 'active',
      };
    });

    if (formattedTeams.length === 0 && (mappedMatches.length > 0 || resultsList.length > 0)) {
      const distinctCats = Array.from(new Set([...mappedMatches, ...resultsList].map((m: any) => m.category))).filter(Boolean);
      formattedTeams = distinctCats.map((cat: any, idx: number) => {
        const catMatches = [...mappedMatches, ...resultsList].filter((m: any) => m.category === cat);
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
          status: 'active',
        };
      });
    }

    formattedTeams.sort((a: any, b: any) => {
      const rank = (str: string) => {
        if (str.includes('Seniors F')) return 1;
        if (str.includes('Seniors G') || str.includes('Seniors M')) return 2;
        if (str.includes('U18 F')) return 3;
        if (str.includes('U18 G') || str.includes('U18 M')) return 4;
        if (str.includes('U15 F')) return 5;
        if (str.includes('U15 G') || str.includes('U15 M')) return 6;
        if (str.includes('U13 F1')) return 7;
        if (str.includes('U13 F2')) return 8;
        if (str.includes('U13 G') || str.includes('U13 M')) return 9;
        if (str.includes('U11 F')) return 10;
        if (str.includes('U11 G') || str.includes('U11 M')) return 11;
        return 99;
      };
      return rank(a.name) - rank(b.name);
    });

    return new Response(
      JSON.stringify({
        success: true, source: 'ffbb_api_desimone', clubCode, organismeId: orgId,
        clubName: clubNom, city: clubCommune, gymnasiumDefault: defaultGym,
        logoUrl: clubLogoUrl,
        teams: formattedTeams,
        matches: mappedMatches, results: resultsList, totalCount: mappedMatches.length + resultsList.length,
        message: `API FFBB Officielle : ${mappedMatches.length} rencontres à venir et ${resultsList.length} résultats récents avec scores pour ${clubNom}.`,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false, source: 'ffbb_api_desimone', clubCode,
        matches: [], results: [], totalCount: 0, error: err.message,
        message: "Erreur lors de la récupération des données FFBB officielles. Aucune fausse donnée générée.",
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function ffbbSearch(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) {
    return new Response(JSON.stringify({ error: 'Terme de recherche requis' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }
  try {
    const desimoneRes = await fetch(`https://ffbb-api.desimone.fr/clubs?q=${encodeURIComponent(query)}`, { headers: { 'Accept': 'application/json' } }).catch(() => null);
    if (desimoneRes && desimoneRes.ok) {
      const desimoneData = await desimoneRes.json();
      const items = Array.isArray(desimoneData) ? desimoneData : desimoneData.clubs || desimoneData.results || [];
      if (items.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_api_desimone',
            clubs: items.map((h: any) => ({
              code: h.code || h.id || h.codeOrganisme || h.clubId || 'BFC0071',
              name: h.nom || h.libelle || h.nomOrganisme || h.name || query,
              city: h.ville || h.commune || h.town || 'Bourgogne',
              committee: h.comite || h.ligue || h.department || 'Comité 71',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    const meiliRes = await fetch('https://meilisearch-prod.ffbb.app/multi-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queries: [{ indexUid: 'organisme', q: query, limit: 10 }] }),
    }).catch(() => null);
    if (meiliRes && meiliRes.ok) {
      const meiliData = await meiliRes.json();
      const hits = meiliData?.results?.[0]?.hits || [];
      if (hits.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_meilisearch',
            clubs: hits.map((h: any) => ({
              code: h.code || h.id || h.codeOrganisme || 'BFC0071',
              name: h.nom || h.libelle || h.nomOrganisme || query,
              city: h.ville || h.commune || 'Bourgogne',
              committee: h.comite || h.ligue || 'Comité 71',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    const directusRes = await fetch(`https://api.ffbb.com/items/organisme?filter[nom][_contains]=${encodeURIComponent(query)}&limit=10`).catch(() => null);
    if (directusRes && directusRes.ok) {
      const dData = await directusRes.json();
      if (dData.data && dData.data.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_directus',
            clubs: dData.data.map((h: any) => ({
              code: h.code || h.id || 'BFC0071',
              name: h.nom || query,
              city: h.ville || 'Bourgogne',
              committee: h.ligue || 'Comité FFBB',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (err) {
    console.warn('Network search FFBB info error:', err);
  }
  const cleanCode = query.toUpperCase();
  return new Response(
    JSON.stringify({
      source: 'ffbb_api_ready',
      clubs: [{
        code: cleanCode.startsWith('BFC') || cleanCode.length >= 6 ? cleanCode : `BFC${cleanCode}`,
        name: query.toLowerCase().includes('basket') ? query : `Basket Club ${query}`,
        city: 'Région Bourgogne-Franche-Comté',
        committee: 'Comité Départemental FFBB',
      }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

// ============================================================
// RÉSEAUX SOCIAUX — légendes IA et passerelle webhook
// ============================================================

// Diagnostic en lecture seule : données brutes d'un match (FFBB + stockage local).
export async function ffbbDebug(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const code = (url.searchParams.get('code') || 'BFC0071024').trim();
  const needle = (url.searchParams.get('opponent') || 'estr').toLowerCase();
  const norm = (v: any) => String(v || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const hit = (obj: any) => norm(JSON.stringify(obj)).includes(norm(needle));
  const out: any = { needle };
  try {
    const orgId = await resolveOrganismeId(code);
    out.orgId = orgId;
    const md: any = await fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(String(orgId))}/matches`, { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
    const all = Array.isArray(md?.matches) ? md.matches : [];
    out.clubMatches = all.filter(hit);
    const pouleIds = Array.from(new Set(out.clubMatches.map((m: any) => m.pouleId).filter(Boolean)));
    out.poules = [];
    for (const pid of pouleIds) {
      const p: any = await fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, { headers: { Accept: 'application/json' } }).then(r => r.json()).catch(() => null);
      out.poules.push({ pouleId: pid, rencontres: (Array.isArray(p?.rencontres) ? p.rencontres : []).filter(hit) });
    }
  } catch (e: any) {
    out.error = String(e?.message || e);
  }
  try {
    const raw = await readSharedAppData(env);
    const data = raw ? JSON.parse(raw) : {};
    out.storedMatches = (data.matches || []).filter(hit);
    out.storedResults = (data.results || []).filter(hit);
  } catch (e: any) {
    out.kvError = String(e?.message || e);
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
}

// ============================================================
// STOCKAGE PARTAGÉ (réglages, matchs, sponsors, etc.)
// Avec contrôle de concurrence optimiste et gestion de version
// ============================================================

const syncsInProgress = new WeakSet<object>();
export async function runScheduledFfbbSync(env: Env): Promise<void> {
  if (syncsInProgress.has(env.AFFICHAGE_KV)) return;
  syncsInProgress.add(env.AFFICHAGE_KV);
  const startedAt = Date.now();
  console.log('[FFBB CRON] Début de la synchronisation automatique.');
  try {
    const response = await ffbbMatches(new Request('https://worker.local/api/ffbb/matches?code=BFC0071024'), env);
    if (!response.ok) throw new Error(`FFBB HTTP ${response.status}`);
    const payload = await response.json() as any;
    if (!payload?.success || !Array.isArray(payload.matches)) {
      throw new Error(payload?.message || payload?.error || 'Réponse FFBB invalide; données conservées.');
    }

    const raw = await readSharedAppData(env);
    if (!raw) {
      console.warn('[FFBB CRON] Aucun app-data en KV; aucune donnée écrite.');
      return;
    }
    const data = JSON.parse(raw);
    // Respecter les équipes décochées dans « Sync FFBB », y compris lors du cron automatique.
    const ignoredCategories: string[] = Array.isArray(data.clubSettings?.ignoredTeamCategories)
      ? data.clubSettings.ignoredTeamCategories
      : [];
    const isIgnoredMatch = (match: any) => isTeamCategoryIgnored(String(match?.category || ''), ignoredCategories);
    const existingMatches = (Array.isArray(data.matches) ? data.matches : []);
    const existingResults = (Array.isArray(data.results) ? data.results : []);
    const incomingMatches = (payload.matches as any[]).filter((match: any) => !isIgnoredMatch(match));
    const incomingResults = (Array.isArray(payload.results) ? payload.results : []).filter((match: any) => !isIgnoredMatch(match));
    const beforeSync = JSON.stringify(data);
    const now = Date.now();
    let updatedResults = 0;

    // Détection des nouveaux scores officiels FFBB (pour déclencher la boucle victoire/défaite TV)
    const hasConfirmedScore = (m: any) =>
      (m?.result === 'win' || m?.result === 'loss' || m?.result === 'draw')
      && typeof m?.homeScore === 'number' && typeof m?.awayScore === 'number';
    const isNewlyScored = (m: any) => hasConfirmedScore(m);
    const alreadyScoredKeys = new Map<string, boolean>();
    const newlyScoredMatches: { match: any; previousSource: string | null }[] = [];

    const matchKey = (match: any) => String(match?.ffbbMatchNumber || match?.id || '');
    const mergeCollection = (existing: any[], incoming: any[], isResults = false) => {
      const byKey = new Map<string, any>();
      for (const item of existing) byKey.set(matchKey(item), item);
      for (const incomingItem of incoming) {
        const names = data.clubSettings?.customTeamNames || {};
        const rawCategory = incomingItem.rawFfbbCategory || incomingItem.category;
        const fresh = { ...incomingItem, rawFfbbCategory: rawCategory,
          category: names[incomingItem.ffbbTeamId] || names[rawCategory] || incomingItem.category };

        const key = matchKey(fresh);
        const previous = byKey.get(key);
        const hasOfficialScore = (fresh.result === 'win' || fresh.result === 'loss' || fresh.result === 'draw')
          && typeof fresh.homeScore === 'number' && typeof fresh.awayScore === 'number';
        // Nouveau score officiel FFBB détecté : programmer la boucle victoire/défaite d'une heure.
        // Uniquement à la PREMIÈRE publication du score (previous sans résultat confirmé) : les crons
        // suivants ne relancent pas la boucle, et un score déjà couvert par Telegram n'est pas retraité.
        if (hasOfficialScore && previous && !isNewlyScored(previous)) {
          const keyCat = String(fresh.category || previous.category || '');
          const keyMatch = String(fresh.id || previous.id || matchKey(fresh));
          if (!alreadyScoredKeys.has(keyMatch)) {
            alreadyScoredKeys.set(keyMatch, true);
            newlyScoredMatches.push({
              match: fresh,
              previousSource: previous.resultSource || null,
            });
          }
        }

        if (previous) {
          const merged = { ...previous, ...fresh };
          const names = data.clubSettings?.customTeamNames || {};
          merged.category = names[fresh.ffbbTeamId] || names[fresh.rawFfbbCategory || fresh.category] || previous.category || fresh.category;
          merged.selectedForWeekend = previous.selectedForWeekend;
          // Si la FFBB ne fournit plus d'heure pour la même date, garder la dernière heure connue
          // plutôt que de l'effacer (une heure vide ne doit jamais écraser une heure existante).
          if (!fresh.time && previous.time && previous.date === fresh.date) merged.time = previous.time;
          // Conserver les champs que l'utilisateur a explicitement modifiés dans l'interface.
          for (const field of ['date', 'time', 'gymnasium', 'opponentLogo']) {
            const manualFlag = field === 'date' ? 'isDateManual'
              : field === 'time' ? 'isTimeManual'
              : field === 'gymnasium' ? 'isGymnasiumManual'
              : 'isOpponentLogoManual';
            if (previous[manualFlag]) merged[field] = previous[field];
          }
          if (previous.isScoreManual) {
            merged.homeScore = previous.homeScore;
            merged.awayScore = previous.awayScore;
            merged.result = previous.result;
            merged.resultSource = previous.resultSource;
            merged.resultReceivedAt = previous.resultReceivedAt;
          } else if (hasOfficialScore) {
            merged.status = 'finished';
            merged.resultSource = 'ffbb';
            merged.resultReceivedAt = previous.resultReceivedAt || now;
            merged.finishedAt = previous.finishedAt || now;
            updatedResults++;
          } else if (previous.resultSource === 'telegram' && (previous.result === 'win' || previous.result === 'loss')) {
            // Ne pas effacer un résultat Telegram valide si la FFBB n'a pas encore publié son score.
            merged.result = previous.result;
            merged.homeScore = previous.homeScore;
            merged.awayScore = previous.awayScore;
            merged.resultSource = previous.resultSource;
            merged.resultReceivedAt = previous.resultReceivedAt;
            merged.finishedAt = previous.finishedAt;
            merged.status = 'finished';
          }
          byKey.set(key, merged);
        } else {
          const inserted = hasOfficialScore
            ? { ...fresh, resultSource: 'ffbb', resultReceivedAt: now, finishedAt: now, status: 'finished' }
            : fresh;
          byKey.set(key, inserted);
          if (hasOfficialScore) updatedResults++;
        }
      }
      const merged = Array.from(byKey.values());
      if (isResults) {
        for (const item of merged) {
          if ((item.result === 'win' || item.result === 'loss' || item.result === 'draw')
            && typeof item.homeScore === 'number' && typeof item.awayScore === 'number') {
            item.status = 'finished';
          }
        }
      }
      return merged;
    };

    data.matches = mergeCollection(existingMatches, incomingMatches);
    data.results = mergeCollection(existingResults, incomingResults, true);

    // Finalisation automatique des matchs commencés depuis plus de deux heures sans résultat.
    const parseMatchStart = (match: any): number | null => {
      if (!match?.date || !match?.time || !/^\d{1,2}:\d{2}$/.test(String(match.time))) return null;
      return clubDateTimeTimestamp(String(match.date), String(match.time));
    };
    const finishWithoutScore = (match: any) => {
      if (!match || (match.result === 'win' || match.result === 'loss' || match.result === 'draw')) return match;
      const start = parseMatchStart(match);
      if (start !== null && now >= start + 2 * 60 * 60 * 1000) return { ...match, status: 'finished' };
      if (start !== null && now < start) return { ...match, status: 'upcoming' };
      return match;
    };
    data.matches = data.matches.map(finishWithoutScore);

    // Garantir que tout résultat existant avec score soit aussi présent dans la liste des résultats.
    const resultKeys = new Set(data.results.map(matchKey));
    for (const match of data.matches) {
      if ((match.result === 'win' || match.result === 'loss' || match.result === 'draw')
        && typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
        && !resultKeys.has(matchKey(match))) {
        data.results.push({ ...match, status: 'finished' });
        resultKeys.add(matchKey(match));
      }
    }


    if (JSON.stringify(data) === beforeSync) return;
    data.version = (typeof data.version === 'number' ? data.version : 0) + 1;
    await commitSharedAppDataOrThrow(env, data, data.version - 1);

    // Déclencher la boucle victoire/défaite (1 h) pour chaque nouveau score officiel FFBB,
    // SAUF si une alerte Telegram/manuelle existe déjà pour ce match (pas de double boucle).
    if (newlyScoredMatches.length > 0) {
      let alertsRaw: string | null = null;
      let existingAlerts: any[] = [];
      try {
        alertsRaw = await env.AFFICHAGE_KV.get('alerts');
        existingAlerts = alertsRaw ? JSON.parse(alertsRaw) : [];
        if (!Array.isArray(existingAlerts)) existingAlerts = [];
      } catch (e) {
        existingAlerts = [];
      }
      const nowAlert = Date.now();
      const activeAlerts = existingAlerts.filter((a: any) => a && a.expiresAt > nowAlert);
      // Un match est identifié par son id (ex. ffbb-123) ET par son numéro FFBB (FFBB-123) :
      // les alertes Telegram stockent matchId = id du match, on compare donc sur les deux formes.
      const matchIdForms = (m: any) => {
        const forms = new Set<string>();
        if (m?.id) forms.add(String(m.id));
        if (m?.ffbbMatchNumber) forms.add(String(m.ffbbMatchNumber));
        if (m?.ffbbMatchNumber) forms.add(String(m.ffbbMatchNumber).replace(/^FFBB-/i, 'ffbb-'));
        return forms;
      };

      // Nom complet de l équipe pour le titre TV (VICTOIRE DES {team}) :
      // on privilégie le nom FFBB (renommage personnalisé éventuel), pas le badge court (ex U13 M1).
      const customTeamNames = (data.clubSettings?.customTeamNames as Record<string, string>) || {};
      const ffbbTeamsForAlert = Array.isArray(data.ffbbTeams) ? data.ffbbTeams : [];
      const resolveTeamDisplayName = (category: string): string => {
        if (!category) return '';
        const team = ffbbTeamsForAlert.find((t: any) =>
          normalizeCategoryKey(t?.category) === normalizeCategoryKey(category)
        );
        if (team) {
          const custom = customTeamNames[team.id] || customTeamNames[team.category] || team.customName;
          return custom || team.name || category;
        }
        return category;
      };

      let alertsChanged = false;
      for (const { match } of newlyScoredMatches) {
        const keyForms = matchIdForms(match);
        const alreadyAlerted = activeAlerts.some((a: any) => {
          const aMatch = String(a?.matchId || '');
          if (!aMatch) return false;
          return keyForms.has(aMatch) || keyForms.has(aMatch.replace(/^FFBB-/i, 'ffbb-'));
        });
        if (alreadyAlerted) continue;
        const isWin = match.result === 'win';
        const isLoss = match.result === 'loss';
        if (!isWin && !isLoss) continue; // match nul : pas de boucle
        const ourScore = match.isHomeMatch ? match.homeScore : match.awayScore;
        const opponentScore = match.isHomeMatch ? match.awayScore : match.homeScore;
        const opponent = match.isHomeMatch ? match.teamAway : match.teamHome;
        const newAlert = {
          id: 'alert-ffbb-' + String(match.id || match.ffbbMatchNumber || 'unknown') + '-' + nowAlert,
          team: resolveTeamDisplayName(match.category) || match.category || match.ourClubName || 'SRC Basket',
          isWin,
          ourScore: typeof ourScore === 'number' ? ourScore : undefined,
          opponentScore: typeof opponentScore === 'number' ? opponentScore : undefined,
          opponent,
          customImageUrl: undefined,
          titleConfig: undefined,
          triggeredBy: 'ffbb',
          matchId: match.id,
          category: match.category,
          timestamp: nowAlert,
          expiresAt: nowAlert + 60 * 60 * 1000,
        };
        activeAlerts.unshift(newAlert);
        alertsChanged = true;
        console.log('[FFBB CRON] Nouveau score officiel: boucle ' + (isWin ? 'VICTOIRE' : 'DÉFAITE') + ' programmée 1 h pour ' + match.category + '.');
      }
      if (alertsChanged) {
        await env.AFFICHAGE_KV.put('alerts', JSON.stringify(activeAlerts));
      }
    }

    console.log(`[FFBB CRON] Terminé: ${payload.matches.length} matchs FFBB, ${updatedResults} résultats mis à jour, durée ${Date.now() - startedAt} ms.`);
  } catch (error) {
    console.error('[FFBB CRON] Échec de synchronisation; données existantes conservées.', error);
  } finally { syncsInProgress.delete(env.AFFICHAGE_KV); }
}
