import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Renvoie toutes les données de l'affichage (réglages, matchs, sponsors, etc.)
// Public en lecture. Si rien n'a encore été enregistré, renvoie null
// (le site utilisera alors ses données de démonstration par défaut).

export default async (_req: Request, _context: Context) => {
  const store = getStore('affichage-data');
  const raw = await store.get('data');
  const data = raw ? JSON.parse(raw) : null;

  return new Response(JSON.stringify({ data }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
