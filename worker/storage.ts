import { isAdmin } from './auth';
import { readSharedAppData, commitSharedAppData, commitSharedAppDataOrThrow } from './appDataCoordinator';
// ============================================================
// Stockage partagé (app-data, sauvegarde avec contrôle de concurrence)
// ============================================================

import { Env } from './types';

export async function getAppData(env: Env): Promise<Response> {
  const raw = await readSharedAppData(env);
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

export async function saveAppData(request: Request, env: Env): Promise<Response> {
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
  if (!await isAdmin(request, env)) return Response.json({ error: 'Authentification requise' }, { status: 401 });

  if (!data) {
    return new Response(JSON.stringify({ error: 'Champ "data" requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // 1. Lire la version actuelle en base dans Cloudflare KV
  const rawCurrent = await readSharedAppData(env);
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

  if (rawCurrent && JSON.stringify({ ...JSON.parse(rawCurrent), version: undefined }) === JSON.stringify({ ...data, version: undefined })) return Response.json({ ok: true, version: currentVersion });

  // 4. Aucune divergence de version : acceptation et incrémentation de la version
  const nextVersion = currentVersion + 1;
  data.version = nextVersion;

  if (!await commitSharedAppData(env, data, currentVersion)) return Response.json({ code: 'CONCURRENCY_CONFLICT', error: 'Les données ont changé. Rechargez avant de réessayer.' }, { status: 409 });

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

export { verifyAdmin as verifyPassword } from './auth';
