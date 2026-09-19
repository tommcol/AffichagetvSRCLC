interface Env {
  AFFICHAGE_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const raw = await context.env.AFFICHAGE_KV.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];

  const now = Date.now();
  const actives = alerts.filter((a: { expiresAt: number }) => a.expiresAt > now);

  return new Response(JSON.stringify({ alerts: actives, count: actives.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
