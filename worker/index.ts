import { GoogleGenAI } from '@google/genai';

interface Env {
  AFFICHAGE_KV: KVNamespace;
  AFFICHAGE_R2?: R2Bucket;
  ADMIN_PASSWORD?: string;
  GEMINI_API_KEY?: string;
  ASSETS: { fetch: typeof fetch };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/get-app-data') return await getAppData(env);
      if (path === '/api/save-app-data') return await saveAppData(request, env);
      if (path === '/api/verify-password') return await verifyPassword(request, env);
      if (path === '/api/upload') return await uploadFile(request, env);
      if (path === '/api/upload-multiple') return await uploadMultiple(request, env);
      if (path.startsWith('/api/media/')) return await serveMedia(path.replace('/api/media/', ''), env);
      if (path.startsWith('/uploads/')) return await serveMedia(path.replace('/uploads/', ''), env);
      if (path === '/api/get-alerts') return await getAlerts(env);
      if (path === '/api/add-alert') return await addAlert(request, env);
      if (path === '/api/delete-alert') return await deleteAlert(request, env);
      if (path === '/api/ffbb/matches') return await ffbbMatches(request);
      if (path === '/api/ffbb/search') return await ffbbSearch(request);
      if (path === '/api/generate-caption') return await generateCaption(request, env);
      if (path === '/api/social/publish') return await socialPublish(request);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }

    // Tout le reste (page principale, fichiers) est géré automatiquement par Cloudflare
    return env.ASSETS.fetch(request);
  },
};

// ============================================================
// STOCKAGE PARTAGÉ (réglages, matchs, sponsors, etc.)
// ============================================================

async function getAppData(env: Env): Promise<Response> {
  const raw = await env.AFFICHAGE_KV.get('app-data');
  const data = raw ? JSON.parse(raw) : null;
  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function saveAppData(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  const body = (await request.json().catch(() => null)) as any;
  if (!body) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  const { data } = body;

  if (!data) {
    return new Response(JSON.stringify({ error: 'Champ "data" requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  await env.AFFICHAGE_KV.put('app-data', JSON.stringify(data));
  return new Response(JSON.stringify({ ok: true, success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function verifyPassword(_request: Request, _env: Env): Promise<Response> {
  return new Response(JSON.stringify({ ok: true, success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ============================================================
// GESTION DU STOCKAGE MULTIMÉDIA (PHOTOS, LOGOS HD, CLIPS)
// ============================================================

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

async function serveMedia(filename: string, env: Env): Promise<Response> {
  const decoded = decodeURIComponent(filename);
  const mime = getMimeType(decoded);

  // 1. Priorité à Cloudflare R2 (Streaming vidéo & stockage fichiers volumineux)
  if (env.AFFICHAGE_R2) {
    try {
      const object = await env.AFFICHAGE_R2.get(decoded);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Content-Type', mime);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
    } catch (e) {
      console.warn('Erreur lecture R2, essai KV:', e);
    }
  }

  // 2. Repli automatique sur Cloudflare KV
  const cleanKey = 'media:' + decoded;
  const data = await env.AFFICHAGE_KV.get(cleanKey, { type: 'arrayBuffer' });
  if (!data) {
    return new Response('Média non trouvé', { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

async function uploadFile(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return new Response(JSON.stringify({ error: 'Aucun fichier reçu' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
    const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(filename);
    const mime = file.type || getMimeType(filename);

    // Si Cloudflare R2 est activé, on stream directement dedans sans limite de 25 Mo
    if (env.AFFICHAGE_R2) {
      await env.AFFICHAGE_R2.put(filename, file.stream(), {
        httpMetadata: { contentType: mime },
      });
    } else {
      // Repli KV
      const arrayBuffer = await file.arrayBuffer();
      await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
    }

    return new Response(
      JSON.stringify({
        success: true,
        url: `/api/media/${filename}`,
        fileName: file.name,
        mediaType: isVideo ? 'video' : 'image',
        size: file.size,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur lors du téléversement' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function uploadMultiple(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun fichier reçu' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const uploaded = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(filename);
      const mime = file.type || getMimeType(filename);

      if (env.AFFICHAGE_R2) {
        await env.AFFICHAGE_R2.put(filename, file.stream(), {
          httpMetadata: { contentType: mime },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      uploaded.push({
        url: `/api/media/${filename}`,
        fileName: file.name,
        mediaType: isVideo ? 'video' : 'image',
        size: file.size,
      });
    }
    return new Response(
      JSON.stringify({
        success: true,
        files: uploaded,
        count: uploaded.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur upload multiple' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================
// ALERTES VICTOIRE / DÉFAITE
// ============================================================

async function getAlerts(env: Env): Promise<Response> {
  const raw = await env.AFFICHAGE_KV.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const actives = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);
  return new Response(JSON.stringify({ alerts: actives, count: actives.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function addAlert(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  const body = (await request.json().catch(() => null)) as any;
  if (!body || !body.team) {
    return new Response(JSON.stringify({ error: 'Champ "team" requis' }), { status: 400 });
  }
  const {
    team, isWin, ourScore, opponentScore, opponent, customImageUrl,
    triggeredBy = 'manual', durationMinutes = 60,
  } = body;
  const durationMs = (durationMinutes || 60) * 60 * 1000;
  const newAlert = {
    id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    team, isWin: Boolean(isWin),
    ourScore: ourScore ? Number(ourScore) : undefined,
    opponentScore: opponentScore ? Number(opponentScore) : undefined,
    opponent, customImageUrl, triggeredBy,
    timestamp: Date.now(),
    expiresAt: Date.now() + durationMs,
  };
  const raw = await env.AFFICHAGE_KV.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const alertesValides = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);
  alertesValides.unshift(newAlert);
  await env.AFFICHAGE_KV.put('alerts', JSON.stringify(alertesValides));
  return new Response(JSON.stringify({ success: true, alert: newAlert }), { status: 200 });
}

async function deleteAlert(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Paramètre "id" requis' }), { status: 400 });
  }
  const raw = await env.AFFICHAGE_KV.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const nouvelleListe = alerts.filter((a: { id: string }) => a.id !== id);
  await env.AFFICHAGE_KV.put('alerts', JSON.stringify(nouvelleListe));
  return new Response(JSON.stringify({ success: true, count: nouvelleListe.length }), { status: 200 });
}

// ============================================================
// FFBB — matchs et recherche
// ============================================================

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

function normalizeCategoryKey(raw?: string): string {
  if (!raw) return '';
  const clean = String(raw).trim();
  const normalized = normalizeFFBBCategory(clean);
  const key = (normalized.badgeCategory || clean).trim().toUpperCase();
  return key.replace(/\bG(\d*)\b/g, 'M$1').replace(/\s+/g, ' ');
}

function isTeamCategoryIgnored(category: string, ignoredCategories: string[] = []): boolean {
  if (!ignoredCategories || ignoredCategories.length === 0) return false;
  const targetKey = normalizeCategoryKey(category);
  return ignoredCategories.some((item) => normalizeCategoryKey(item) === targetKey);
}

async function ffbbMatches(request: Request): Promise<Response> {
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

    const [matchesData, clubData, teamsData] = await Promise.all([
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/matches`, { headers: { 'Accept': 'application/json' } })
        .then(r => r.ok ? r.json() : { matches: [] }).catch(() => ({ matches: [] })),
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}`, { headers: { 'Accept': 'application/json' } })
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://ffbb-api.desimone.fr/api/v1/club/${encodeURIComponent(orgId)}/teams`, { headers: { 'Accept': 'application/json' } })
        .then(r => r.ok ? r.json() : { teams: [] }).catch(() => ({ teams: [] })),
    ]);

    const rawMatches = Array.isArray(matchesData?.matches) ? matchesData.matches : [];
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

    if (pouleIds.length > 0) {
      try {
        const pouleResults = await Promise.all(
          pouleIds.map((pid) =>
            fetch(`https://ffbb-api.desimone.fr/api/v1/poule/${encodeURIComponent(String(pid))}`, {
              headers: { 'Accept': 'application/json' },
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
      const matchId = String(m.ffbbMatchId || idx);
      const pouleScore = scoreMap.get(matchId);
      const hasPouleScore = pouleScore && pouleScore.joue;
      const isPast = dateStr < todayStr || Boolean(hasPouleScore);

      let homeScore: number | undefined = undefined;
      let awayScore: number | undefined = undefined;
      let matchResult: 'win' | 'loss' | 'draw' | null = null;

      if (hasPouleScore && pouleScore) {
        homeScore = pouleScore.score1;
        awayScore = pouleScore.score2;
        const ourScore = isHome ? homeScore : awayScore;
        const oppScore = isHome ? awayScore : homeScore;
        matchResult = ourScore > oppScore ? 'win' : ourScore < oppScore ? 'loss' : 'draw';
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
        matchTime = '20:30';
      }

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

      if (hasPouleScore) {
        resultsList.push(matchItem);
      } else {
        mappedMatches.push(matchItem);
      }
    }

    mappedMatches.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
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

async function ffbbSearch(request: Request): Promise<Response> {
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

async function generateCaption(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  try {
    const body = (await request.json()) as any;
    const {
      platform = 'instagram', type = 'matches', matches = [], results = [],
      clubName = 'Notre Club', shortClub = 'Club', gymnasium = 'Gymnase du Club',
      tone = 'supporter', extraContext = '',
    } = body;

    const matchesSummary = (matches || []).map((m: any) =>
      `- ${m.category || 'Équipe'} : ${m.isHomeMatch ? 'à Domicile vs ' + (m.teamAway || 'Adversaire') : 'à l\'Extérieur @ ' + (m.teamHome || 'Adversaire')} le ${m.date || ''} à ${m.time || ''}`
    ).join('\n');
    const resultsSummary = (results || []).map((r: any) =>
      `- ${r.category || 'Équipe'} : ${r.homeScore ?? 0} - ${r.awayScore ?? 0} (${r.result === 'win' ? 'Victoire 🏆' : 'Défaite ❌'}) vs ${r.isHomeMatch ? (r.teamAway || 'Adversaire') : (r.teamHome || 'Adversaire')}`
    ).join('\n');

    const apiKey = env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Tu es le Community Manager passionné et créatif du club de basketball "${clubName}" (Aussi appelé ${shortClub}).
Rédige une légende captivante, moderne et prête à être publiée sur le réseau social "${platform.toUpperCase()}".

Contexte du post : ${type === 'matches' ? 'Annonce des prochains matchs du week-end' : 'Bilan et résultats des matchs passés'}.
Ton souhaité : ${tone === 'supporter' ? "Survolté, très enthousiaste, esprit d'équipe 🔥" : tone === 'officiel' ? 'Professionnel, chaleureux et institutionnel 🏛️' : tone === 'fun' ? 'Dynamique, jeune, punchy avec emojis ⚡' : "Centré sur la buvette, l'ambiance et les supporters 🍿"}.

${type === 'matches' ? `Matchs du week-end (${matches.length} rencontres retenues) :\n${matchesSummary || 'Matchs à venir du club'}\nLieu principal domicile : ${gymnasium}` : `Résultats des rencontres :\n${resultsSummary || 'Résultats récents du club'}`}
${extraContext ? `Instructions supplémentaires du club : ${extraContext}` : ''}

Directives :
1. Structurer clairement avec des sections lisibles et des emojis attrayants.
2. Pour Instagram / Facebook, inclure une accroche percutante, la liste des rencontres/résultats, une incitation à venir encourager au gymnase / à la buvette.
3. Pour TikTok, faire une version plus courte, dynamique et avec des hashtags tendance (#basketball #matchday #fyp etc.).
4. Terminer par des hashtags pertinents pour le club.
Restitue uniquement le texte de la légende rédigé, sans guillemets ni meta-commentaires.`;

        const response = await ai.models.generateContent({ model: 'gemini-3.6-flash', contents: prompt });
        const captionText = response.text?.trim();
        if (captionText) {
          return new Response(JSON.stringify({ success: true, provider: 'gemini', caption: captionText }), {
            status: 200, headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (geminiErr: any) {
        console.warn('[GEMINI API WARNING] Fallback local utilisé :', geminiErr.message);
      }
    }

    let generatedCaption = '';
    if (type === 'matches') {
      const matchCount = (matches || []).length;
      if (platform === 'tiktok') {
        generatedCaption = `⚡ WEEK-END DE BASKET INTENSE POUR ${shortClub.toUpperCase()} ! 🏀🔥\n${matchCount} matchs au programme ce week-end ! Qui vient faire chauffer la salle ? 🥁💥\n\n#basketball #matchday #bball #fyp #pourtoi #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else if (tone === 'officiel') {
        generatedCaption = `🏀 PROGRAMME OFFICIEL DES RENCONTRES • ${clubName.toUpperCase()} 🏀\n\nNous vous présentons l'ensemble des matchs programmés pour le week-end :\n\n${matchesSummary || 'Rencontres à venir'}\n\n📍 Gymnase : ${gymnasium}\nNous comptons sur votre présence pour soutenir nos joueuses et joueurs ! 🔴⚪\n\n#Basketball #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🔥 WEEK-END CHAUD BOUILLANT CHEZ LES ${shortClub.toUpperCase()} ! 🔥\n\nPréparez les tambours et les maillots, voici les ${matchCount} matchs clés sélectionnés du week-end !\n\n${matchesSummary || 'Prochaines rencontres'}\n\n🍿 Buvette & petite restauration assurées au ${gymnasium} !\nAllez ${shortClub} ! ❤️🤍\n\n#GameDay #MatchWeek #TeamBasket #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    } else {
      if (platform === 'tiktok') {
        generatedCaption = `🏆 BILAN DU WEEK-END DE ${shortClub.toUpperCase()} ! 🏀\nVoici les scores de nos équipes ! Laisse un ❤️ pour féliciter nos joueurs !\n\n#resultats #basket #victoire #fyp #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🏆 RÉSULTATS & BILAN DU WEEK-END — ${clubName.toUpperCase()} 🏆\n\nVoici le résumé complet des rencontres du week-end :\n\n${resultsSummary || 'Résultats récents'}\n\nUn grand bravo à toutes nos équipes, coachs et supporters pour leur ferveur ! 👏🔥\n\n#Résultats #Basket #TeamWork #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    }

    return new Response(JSON.stringify({ success: true, provider: 'smart_local_generator', caption: generatedCaption }), {
      status: 200, headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

async function socialPublish(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  try {
    const body = (await request.json()) as any;
    const { platform, type, title, caption, matches, results, webhookUrl } = body;
    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('http')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'match_social_publish', platform: platform || 'all', type: type || 'matches',
            title: title || 'Publication Club', caption: caption || '',
            matchCount: matches ? matches.length : 0, resultCount: results ? results.length : 0,
            matches: matches || [], results: results || [], timestamp: Date.now(),
          }),
        });
        return new Response(
          JSON.stringify({
            success: true, forwardedToWebhook: true, status: response.status,
            message: `Transmis avec succès au Webhook externe (Code HTTP ${response.status})`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fErr: any) {
        return new Response(
          JSON.stringify({
            success: false, forwardedToWebhook: true, error: fErr.message,
            message: `Échec d'envoi au Webhook : ${fErr.message}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    return new Response(
      JSON.stringify({
        success: true, forwardedToWebhook: false,
        message: `Contenu préparé avec succès pour ${platform || 'les réseaux sociaux'}`,
        data: { platform, type, title },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
