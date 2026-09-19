interface Env {
  AFFICHAGE_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const body = (await request.json().catch(() => null)) as any;
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

  const raw = await env.AFFICHAGE_KV.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const now = Date.now();
  const alertesValides = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);
  alertesValides.unshift(newAlert);
  await env.AFFICHAGE_KV.put('alerts', JSON.stringify(alertesValides));

  return new Response(JSON.stringify({ success: true, alert: newAlert }), { status: 200 });
};
