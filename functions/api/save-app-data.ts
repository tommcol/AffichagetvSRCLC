interface Env {
  AFFICHAGE_KV: KVNamespace;
  ADMIN_PASSWORD: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const body = (await request.json().catch(() => null)) as any;
  if (!body) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400 });
  }

  const { password, data } = body;

  const expectedPassword = env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;
  if (expectedPassword && password !== expectedPassword) {
    return new Response(JSON.stringify({ error: 'Mot de passe incorrect' }), { status: 401 });
  }

  if (!data) {
    return new Response(JSON.stringify({ error: 'Champ "data" requis' }), { status: 400 });
  }

  await env.AFFICHAGE_KV.put('app-data', JSON.stringify(data));

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
