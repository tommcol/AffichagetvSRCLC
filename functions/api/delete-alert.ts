interface Env {
  AFFICHAGE_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
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
};
