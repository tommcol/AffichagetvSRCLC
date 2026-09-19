interface Env {
  AFFICHAGE_KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const raw = await context.env.AFFICHAGE_KV.get('app-data');
  const data = raw ? JSON.parse(raw) : null;

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
