import { Env } from './types';
import { isAdmin } from './auth';
import { readSharedAppData } from './appDataCoordinator';
import { getStoredMediaUsages, isStoredMediaKey } from '../src/utils/storedMedia';

export async function mediaStorage(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  if (!['GET', 'DELETE'].includes(request.method)) return new Response('Méthode non autorisée', { status: 405 });
  if (!await isAdmin(request, env) || (request.headers.get('origin') && request.headers.get('origin') !== url.origin)) {
    return Response.json({ error: 'Authentification requise' }, { status: 401 });
  }
  const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
  try {
    const raw = await readSharedAppData(env);
    // Sans document valide, aucune suppression : impossible de vérifier les usages.
    if (!raw) return json({ error: 'Réglages indisponibles : rechargez les données avant de supprimer un fichier.' }, 503);
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Réglages invalides');
    const rawAlerts = await env.AFFICHAGE_KV.get('alerts');
    const alerts = rawAlerts ? JSON.parse(rawAlerts) : [];
    if (!Array.isArray(alerts)) throw new Error('Alertes invalides');
    const usages = (key: string) => getStoredMediaUsages(key, data, alerts, url.origin);
    if (request.method === 'GET') {
      const source = url.searchParams.get('source') || 'r2';
      const cursor = url.searchParams.get('cursor') || undefined;
      if (source === 'r2') {
        if (!env.AFFICHAGE_R2) return json({ files: [], source, cursor: null });
        const page = await env.AFFICHAGE_R2.list({ limit: 100, cursor });
        return json({ source, files: page.objects.filter(o => isStoredMediaKey(o.key)).map(o => ({ key: o.key, size: o.size, usages: usages(o.key) })),
          cursor: page.truncated ? page.cursor : null });
      }
      if (source !== 'kv') return json({ error: 'Stockage invalide' }, 400);
      const page = await env.AFFICHAGE_KV.list({ prefix: 'media:', limit: 100, cursor });
      return json({ source, files: page.keys.map(o => o.name.slice(6)).filter(isStoredMediaKey).map(key => ({ key, usages: usages(key) })),
        cursor: 'cursor' in page ? page.cursor : null });
    }
    const body = await request.json().catch(() => null) as { key?: unknown; confirm?: boolean } | null;
    if (!body?.confirm || !isStoredMediaKey(body.key)) return json({ error: 'Fichier ou confirmation invalide' }, 400);
    const used = usages(body.key);
    if (used.length) return json({ error: 'Ce fichier est encore utilisé. Retirez-le des rubriques indiquées, attendez l’enregistrement puis réessayez.', usages: used }, 409);
    // Supprimer les deux copies éventuelles : sinon serveMedia retomberait sur le KV.
    if (env.AFFICHAGE_R2) await env.AFFICHAGE_R2.delete(body.key);
    await env.AFFICHAGE_KV.delete('media:' + body.key);
    return json({ success: true, key: body.key });
  } catch {
    return json({ error: 'Vérification ou suppression impossible. Actualisez la liste avant de réessayer.' }, 503);
  }
}
