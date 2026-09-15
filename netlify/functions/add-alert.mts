import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Ajoute une alerte victoire/défaite (déclenchement manuel, Telegram ou FFBB).

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.team) {
    return new Response(JSON.stringify({ error: 'Champ "team" requis' }), { status: 400 });
  }

  const {
    team,
    isWin,
    ourScore,
    opponentScore,
    opponent,
    customImageUrl,
    triggeredBy = 'manual',
    durationMinutes = 60,
  } = body;

  const durationMs = (durationMinutes || 60) * 60 * 1000;
  const newAlert = {
    id: 'alert-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    team,
    isWin: Boolean(isWin),
    ourScore: ourScore ? Number(ourScore) : undefined,
    opponentScore: opponentScore ? Number(opponentScore) : undefined,
    opponent,
    customImageUrl,
    triggeredBy,
    timestamp: Date.now(),
    expiresAt: Date.now() + durationMs,
  };

  const store = getStore('affichage-alerts');
  const raw = await store.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const alertesValides = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);
  alertesValides.unshift(newAlert);
  await store.set('alerts', JSON.stringify(alertesValides));

  return new Response(JSON.stringify({ success: true, alert: newAlert }), { status: 200 });
};
