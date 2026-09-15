import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Renvoie les alertes victoire/défaite actives (non expirées). Public en lecture.

export default async (_req: Request, _context: Context) => {
  const store = getStore('affichage-alerts');
  const raw = await store.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];

  const now = Date.now();
  const actives = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);

  return new Response(JSON.stringify({ alerts: actives, count: actives.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
