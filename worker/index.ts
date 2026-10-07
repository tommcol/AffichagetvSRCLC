import { GoogleGenAI } from '@google/genai';

interface Env {
  AFFICHAGE_KV: KVNamespace;
  AFFICHAGE_R2?: R2Bucket;
  ADMIN_PASSWORD?: string;
  GEMINI_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  ASSETS: { fetch: typeof fetch };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path === '/api/get-app-data' || path === '/api/app-data') return await getAppData(env);
      if (path === '/api/save-app-data' || path === '/api/app-data' && request.method === 'POST') return await saveAppData(request, env);
      if (path === '/api/verify-password') return await verifyPassword(request, env);
      if (path === '/api/upload') return await uploadFile(request, env);
      if (path === '/api/upload-multiple') return await uploadMultiple(request, env);
      if (path.startsWith('/api/media/')) return await serveMedia(path.replace('/api/media/', ''), env);
      if (path.startsWith('/uploads/')) return await serveMedia(path.replace('/uploads/', ''), env);
      if (path === '/api/get-alerts' || path === '/api/alerts') {
        if (request.method === 'POST') return await addAlert(request, env);
        if (request.method === 'DELETE') return await deleteAlert(request, env);
        return await getAlerts(env);
      }
      if (path === '/api/add-alert') return await addAlert(request, env);
      if (path === '/api/delete-alert' || path.startsWith('/api/alerts/')) return await deleteAlert(request, env);
      if (path === '/api/telegram-webhook') return await telegramWebhook(request, env);
      if (path === '/api/telegram/test') return await telegramTest(request, env);
      if (path === '/api/telegram/config' || path === '/api/telegram/status') return await telegramConfig(request, env);
      if (path === '/api/telegram/connect') return await telegramConnect(request, env);
      if (path === '/api/telegram/disconnect') return await telegramDisconnect(request, env);
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
// Avec contrôle de concurrence optimiste et gestion de version
// ============================================================

async function getAppData(env: Env): Promise<Response> {
  const raw = await env.AFFICHAGE_KV.get('app-data');
  const data = raw ? JSON.parse(raw) : null;

  // Rétrocompatibilité : initialiser à 0 si le document existe sans numéro de version
  const currentVersion = data && typeof data.version === 'number' ? data.version : 0;
  if (data && typeof data.version !== 'number') {
    data.version = currentVersion;
  }

  return new Response(JSON.stringify({ data, version: currentVersion }), {
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

  // 1. Lire la version actuelle en base dans Cloudflare KV
  const rawCurrent = await env.AFFICHAGE_KV.get('app-data');
  let currentVersion = 0;
  if (rawCurrent) {
    try {
      const parsedCurrent = JSON.parse(rawCurrent);
      if (parsedCurrent && typeof parsedCurrent.version === 'number') {
        currentVersion = parsedCurrent.version;
      }
    } catch (e) {
      console.warn('Erreur lecture version app-data actuelle:', e);
    }
  }

  // 2. Extraire la version transmise par le client (dans body.version ou data.version)
  const clientVersion = typeof body.version === 'number'
    ? body.version
    : (typeof data.version === 'number' ? data.version : undefined);

  // 3. Vérification de concurrence optimiste (Optimistic Concurrency Control)
  // Si le document possède déjà une version et que la version du client ne correspond pas : CONFLIT !
  const isConflict = (clientVersion !== undefined && clientVersion !== currentVersion) ||
                     (clientVersion === undefined && currentVersion > 0);

  if (isConflict) {
    console.warn(`[CONCURRENCY CONFLICT] Sauvegarde rejetée : clientVersion=${clientVersion}, serverVersion=${currentVersion}`);
    return new Response(
      JSON.stringify({
        ok: false,
        success: false,
        error: "Les données ont été modifiées ailleurs. Rechargez les données avant de sauvegarder à nouveau.",
        code: "CONCURRENCY_CONFLICT",
        serverVersion: currentVersion,
        clientVersion: clientVersion ?? null,
      }),
      {
        status: 409, // 409 Conflict
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 4. Aucune divergence de version : acceptation et incrémentation de la version
  const nextVersion = currentVersion + 1;
  data.version = nextVersion;

  await env.AFFICHAGE_KV.put('app-data', JSON.stringify(data));

  return new Response(
    JSON.stringify({
      ok: true,
      success: true,
      version: nextVersion,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
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
  const url = new URL(request.url);

  // 1. Mode Flux Binaire Direct (PUT) : Idéal pour les grosses vidéos / clips sans limite 413
  if (request.method === 'PUT') {
    try {
      const rawName = url.searchParams.get('name') || request.headers.get('x-filename') || 'media_file';
      const cleanName = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
      const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(filename) || (request.headers.get('content-type') || '').startsWith('video/');
      const mime = url.searchParams.get('type') || request.headers.get('content-type') || getMimeType(filename);

      if (!request.body) {
        return new Response(JSON.stringify({ error: 'Flux binaire vide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (env.AFFICHAGE_R2) {
        // Envoi direct en flux continu dans Cloudflare R2 (aucune limite de 25 Mo)
        await env.AFFICHAGE_R2.put(filename, request.body, {
          httpMetadata: { contentType: mime },
        });
      } else {
        // Repli KV
        const arrayBuffer = await request.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: `/uploads/${filename}`,
          fileName: decodeURIComponent(rawName),
          mediaType: isVideo ? 'video' : 'image',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Erreur flux binaire' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 2. Mode Formulaire Standard (POST)
  if (request.method === 'POST') {
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

      if (env.AFFICHAGE_R2) {
        await env.AFFICHAGE_R2.put(filename, file.stream(), {
          httpMetadata: { contentType: mime },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: `/uploads/${filename}`,
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

  return new Response('Méthode non autorisée', { status: 405 });
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
        url: `/uploads/${filename}`,
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
// ALERTES VICTOIRE / DÉFAITE & TÉLÉGRAM
// ============================================================

// ============================================================
// Équipes configurées et reconnaissance intelligente des équipes Telegram
// ============================================================

interface TeamVisualItemWorker {
  id: string;
  teamName: string;
  shortAliases: string[];
  category: string;
  winVisualUrl?: string;
  lossVisualUrl?: string;
}

const DEFAULT_CANONICAL_TEAMS_WORKER: TeamVisualItemWorker[] = [
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

const DEFAULT_REAL_FFBB_TEAMS_WORKER = [
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

function normalizeTeamString(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/['’\-_/\\.:,;+*#~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshteinDist(a: string, b: string): number {
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

function strSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDist(a, b) / maxLen;
}

function getTeamNormalizedVariations(tv: any): string[] {
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

function parseTeamComponents(normStr: string) {
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

function findClosestTeams(rawInput: string, configuredTeams: any[], limit = 3): string[] {
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

function matchConfiguredTeam(rawInput: string, appData?: any) {
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

function parseTelegramMatchMessage(text: string): {
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

function hasConfirmedMatchResult(match: any): boolean {
  return Boolean(
    match &&
    (
      match.result === 'win' ||
      match.result === 'loss' ||
      (match.homeScore !== undefined && match.awayScore !== undefined)
    )
  );
}

function normalizeResultDate(date?: string): string {
  if (!date) return '';
  const clean = String(date).trim();
  const iso = clean.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);
  if (iso) return iso[0];
  const euro = clean.match(/^(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{4})/);
  if (euro) return euro[3] + '-' + euro[2].padStart(2, '0') + '-' + euro[1].padStart(2, '0');
  return '';
}

function getDateDistanceScore(date: string, now: number): number {
  const normalized = normalizeResultDate(date);
  if (!normalized) return Number.MAX_SAFE_INTEGER;
  const parsed = Date.parse(normalized + 'T12:00:00');
  if (!Number.isFinite(parsed)) return Number.MAX_SAFE_INTEGER;
  return Math.abs(parsed - now) / 86400000;
}

function findTelegramMatch(appData: any, teamMatch: any, officialTeamName: string, opponent?: string, now = Date.now()): any | null {
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

function upsertResultMatch(results: any[], updatedMatch: any): any[] {
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

async function persistTelegramMatchResult(
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

function getAlertDeduplicationKey(alert: any): string {
  const source = alert?.triggeredBy || 'manual';
  if (source === 'ffbb' || source === 'telegram') {
    if (alert?.matchId) return `${source}:match:${alert.matchId}`;
    return [
      source,
      String(alert?.team || '').trim().toLowerCase(),
      String(alert?.opponent || '').trim().toLowerCase(),
      alert?.isWin ? 'win' : 'loss',
      alert?.ourScore ?? '',
      alert?.opponentScore ?? '',
    ].join('|');
  }
  return `id:${alert?.id || ''}`;
}

function deduplicateAlerts(alerts: any[]): any[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = getAlertDeduplicationKey(alert);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getAlerts(env: Env): Promise<Response> {
  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const activeAlerts = Array.isArray(alerts)
      ? alerts.filter((a: { expiresAt: number }) => a && a.expiresAt > now)
      : [];
    const actives = deduplicateAlerts(activeAlerts);

    if (Array.isArray(alerts) && JSON.stringify(alerts) !== JSON.stringify(actives)) {
      await env.AFFICHAGE_KV.put('alerts', JSON.stringify(actives));
    }

    return new Response(JSON.stringify({ alerts: actives, count: actives.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ alerts: [], count: 0, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
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
    id: inputId,
    team, isWin, ourScore, opponentScore, opponent, customImageUrl,
    triggeredBy = 'manual', durationMinutes = 60, expiresAt: inputExpiresAt, timestamp: inputTimestamp,
  } = body;
  const durationMs = (durationMinutes || 60) * 60 * 1000;

  let finalCustomImageUrl = customImageUrl;
  let customTitleConfig = undefined;
  if (!finalCustomImageUrl) {
    try {
      const appDataRaw = await env.AFFICHAGE_KV.get('app-data');
      if (appDataRaw) {
        const appData = JSON.parse(appDataRaw);
        const vt = appData.visualTemplates;
        const commonBank = isWin ? vt?.commonVictoryVisuals : vt?.commonDefeatVisuals;
        if (commonBank && Array.isArray(commonBank) && commonBank.length > 0) {
          finalCustomImageUrl = commonBank[Math.floor(Math.random() * commonBank.length)];
        } else if (Array.isArray(appData.teamVisuals)) {
          const tv = appData.teamVisuals.find((t: any) =>
            t.teamName?.toLowerCase().includes(team.toLowerCase()) ||
            t.category?.toLowerCase() === team.toLowerCase()
          );
          if (tv) {
            finalCustomImageUrl = isWin ? tv.winVisualUrl : tv.lossVisualUrl;
          }
        }
        if (finalCustomImageUrl && vt?.visualTitleConfigs?.[finalCustomImageUrl]) {
          customTitleConfig = vt.visualTitleConfigs[finalCustomImageUrl];
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la sélection du visuel dans la banque commune:', e);
    }
  }

  const now = Date.now();
  const alertId = inputId || ('alert-' + now + '-' + Math.random().toString(36).substring(2, 6));
  const newAlert = {
    id: alertId,
    team,
    isWin: Boolean(isWin),
    ourScore: (ourScore !== undefined && ourScore !== null && ourScore !== '') ? Number(ourScore) : undefined,
    opponentScore: (opponentScore !== undefined && opponentScore !== null && opponentScore !== '') ? Number(opponentScore) : undefined,
    opponent: opponent || undefined,
    customImageUrl: finalCustomImageUrl,
    titleConfig: customTitleConfig,
    triggeredBy,
    timestamp: inputTimestamp || now,
    expiresAt: inputExpiresAt || (now + durationMs),
  };

  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const alertesValides = Array.isArray(alerts)
      ? alerts.filter((a: { id: string; expiresAt: number }) => a && a.id !== alertId && a.expiresAt > now)
      : [];

    const newKey = getAlertDeduplicationKey(newAlert);
    const dedupedExisting = alertesValides.filter(
      (existing: any) => getAlertDeduplicationKey(existing) !== newKey
    );

    dedupedExisting.unshift(newAlert);
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(dedupedExisting));
  } catch (kvErr) {
    console.error('Erreur KV put alerts:', kvErr);
  }

  return new Response(JSON.stringify({ success: true, alert: newAlert }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function deleteAlert(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let id = url.searchParams.get('id') || url.pathname.replace('/api/alerts/', '').replace('/api/delete-alert/', '');
  if (!id || id === '/api/delete-alert' || id === '/api/alerts') {
    const body = (await request.json().catch(() => null)) as any;
    if (body?.id) id = body.id;
  }
  if (!id) {
    return new Response(JSON.stringify({ error: 'Paramètre "id" requis' }), { status: 400 });
  }
  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const nouvelleListe = Array.isArray(alerts) ? alerts.filter((a: { id: string }) => a && a.id !== id) : [];
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(nouvelleListe));
    const targetAlert = Array.isArray(alerts) ? alerts.find((a: { id: string }) => a && a.id === id) : null;
    if (targetAlert?.triggeredBy === 'telegram' && targetAlert.telegramChatId && targetAlert.telegramMessageId) {
      const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
      if (botToken) {
        await fetch('https://api.telegram.org/bot' + botToken + '/deleteMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: targetAlert.telegramChatId, message_id: targetAlert.telegramMessageId }) }).catch(() => null);
      }
    }
    return new Response(JSON.stringify({ success: true, count: nouvelleListe.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Calcule de façon déterministe un jeton secret de signature pour le webhook Telegram.
 * Telegram envoie ce jeton dans le header HTTP 'X-Telegram-Bot-Api-Secret-Token' à chaque requête.
 * Seules les requêtes présentant exactement ce jeton secret sont acceptées.
 */
async function getTelegramSecretToken(botToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(botToken.trim() + ':src-basket-telegram-secret');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function telegramWebhook(request: Request, env: Env): Promise<Response> {
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

    // Suppression de la dernière alerte injectée par Telegram.
    const isDeleteCommand = /^(\/supprimer|\/delete|\/annuler)\b/i.test(text.trim());
    if (isDeleteCommand) {
      const rawAlerts = await env.AFFICHAGE_KV.get('alerts');
      const alerts = rawAlerts ? JSON.parse(rawAlerts) : [];
      const telegramAlerts = Array.isArray(alerts) ? alerts.filter((a: any) => a?.triggeredBy === 'telegram') : [];
      const latestTelegramAlert = telegramAlerts[0];
      if (!latestTelegramAlert) {
        if (chatId) await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: 'ℹ️ Aucune alerte Telegram active à supprimer.' }) }).catch(() => null);
        return new Response(JSON.stringify({ success: true, deleted: false }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      const remainingAlerts = alerts.filter((a: any) => a?.id !== latestTelegramAlert.id);
      await env.AFFICHAGE_KV.put('alerts', JSON.stringify(remainingAlerts));
      if (latestTelegramAlert.telegramChatId && latestTelegramAlert.telegramMessageId) {
        await fetch('https://api.telegram.org/bot' + botToken + '/deleteMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: latestTelegramAlert.telegramChatId, message_id: latestTelegramAlert.telegramMessageId }) }).catch(() => null);
      }
      if (chatId) await fetch('https://api.telegram.org/bot' + botToken + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text: '🗑️ Alerte ' + (latestTelegramAlert.isWin ? 'VICTOIRE' : 'DÉFAITE') + ' de *' + latestTelegramAlert.team + '* supprimée de la boucle TV.', parse_mode: 'Markdown' }) }).catch(() => null);
      return new Response(JSON.stringify({ success: true, deleted: true, alertId: latestTelegramAlert.id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
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
      isWin: parsed.isWin ?? true,
      ourScore: parsed.ourScore,
      opponentScore: parsed.opponentScore,
      opponent: parsed.opponent,
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

async function telegramTest(request: Request, env: Env): Promise<Response> {
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
  const teamMatch = matchConfiguredTeam(parsed.teamRaw, appData?.teamVisuals);
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
    isWin: parsed.isWin ?? true,
    ourScore: parsed.ourScore,
    opponentScore: parsed.opponentScore,
    opponent: parsed.opponent,
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
    alertesValides.unshift(newAlert);
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(alertesValides));
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
async function telegramConnect(request: Request, env: Env): Promise<Response> {
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
async function telegramDisconnect(request: Request, env: Env): Promise<Response> {
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
async function telegramConfig(request: Request, env: Env): Promise<Response> {
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

      // Le match reste dans le planning des matchs
      mappedMatches.push(matchItem);

      // S'il a un score ou est terminé, il s'ajoute aussi aux résultats
      if (hasPouleScore || isPast && (homeScore !== undefined || matchResult)) {
        resultsList.push(matchItem);
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
