import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Supprime une alerte active par son id.

export default async (req: Request, _context: Context) => {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(JSON.stringify({ error: 'Paramètre "id" requis' }), { status: 400 });
  }

  const store = getStore('affichage-alerts');
  const raw = await store.get('alerts');
  const alerts = raw ? JSON.parse(raw) : [];
  const nouvelleListe = alerts.filter((a: { id: string }) => a.id !== id);
  await store.set('alerts', JSON.stringify(nouvelleListe));

  return new Response(JSON.stringify({ success: true, count: nouvelleListe.length }), { status: 200 });
};
