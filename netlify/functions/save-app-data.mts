import type { Context } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

// Enregistre toutes les données de l'affichage. Protégé par mot de passe
// (variable d'environnement ADMIN_PASSWORD).

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return new Response(JSON.stringify({ error: 'JSON invalide' }), { status: 400 });
  }

  const { password, data } = body;

  // TEMPORAIRE : vérification du mot de passe désactivée pendant la construction dans AI Studio.
  // À RÉACTIVER avant la mise en ligne définitive (remettre la vérification ADMIN_PASSWORD).

  if (!data) {
    return new Response(JSON.stringify({ error: 'Champ "data" requis' }), { status: 400 });
  }

  const store = getStore('affichage-data');
  await store.set('data', JSON.stringify(data));

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};
