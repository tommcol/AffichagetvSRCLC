// ============================================================
// Gestion du stockage multimédia (photos, logos HD, clips)
// ============================================================

import { Env } from './types';

// ============================================================
// GESTION DU STOCKAGE MULTIMÉDIA (PHOTOS, LOGOS HD, CLIPS)
// ============================================================

export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'svg': return 'image/svg+xml';
    case 'gif': return 'image/gif';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export async function serveMedia(filename: string, env: Env): Promise<Response> {
  const decoded = decodeURIComponent(filename);
  const mime = getMimeType(decoded);

  // 1. Priorité à Cloudflare R2 (Streaming vidéo & stockage fichiers volumineux)
  if (env.AFFICHAGE_R2) {
    try {
      const object = await env.AFFICHAGE_R2.get(decoded);
      if (object) {
        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Content-Type', mime);
        headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        headers.set('Access-Control-Allow-Origin', '*');
        return new Response(object.body, { headers });
      }
    } catch (e) {
      console.warn('Erreur lecture R2, essai KV:', e);
    }
  }

  // 2. Repli automatique sur Cloudflare KV
  const cleanKey = 'media:' + decoded;
  const data = await env.AFFICHAGE_KV.get(cleanKey, { type: 'arrayBuffer' });
  if (!data) {
    return new Response('Média non trouvé', { status: 404 });
  }

  return new Response(data, {
    status: 200,
    headers: {
      'Content-Type': mime,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function uploadFile(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // 1. Mode Flux Binaire Direct (PUT) : Idéal pour les grosses vidéos / clips sans limite 413
  if (request.method === 'PUT') {
    try {
      const rawName = url.searchParams.get('name') || request.headers.get('x-filename') || 'media_file';
      const cleanName = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
      const isVideo = /\.(mp4|webm|mov|m4v)$/i.test(filename) || (request.headers.get('content-type') || '').startsWith('video/');
      const mime = url.searchParams.get('type') || request.headers.get('content-type') || getMimeType(filename);

      if (!request.body) {
        return new Response(JSON.stringify({ error: 'Flux binaire vide' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (env.AFFICHAGE_R2) {
        // Envoi direct en flux continu dans Cloudflare R2 (aucune limite de 25 Mo)
        await env.AFFICHAGE_R2.put(filename, request.body, {
          httpMetadata: { contentType: mime },
        });
      } else {
        // Repli KV
        const arrayBuffer = await request.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: `/uploads/${filename}`,
          fileName: decodeURIComponent(rawName),
          mediaType: isVideo ? 'video' : 'image',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Erreur flux binaire' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 2. Mode Formulaire Standard (POST)
  if (request.method === 'POST') {
    try {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return new Response(JSON.stringify({ error: 'Aucun fichier reçu' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(filename);
      const mime = file.type || getMimeType(filename);

      if (env.AFFICHAGE_R2) {
        await env.AFFICHAGE_R2.put(filename, file.stream(), {
          httpMetadata: { contentType: mime },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      return new Response(
        JSON.stringify({
          success: true,
          url: `/uploads/${filename}`,
          fileName: file.name,
          mediaType: isVideo ? 'video' : 'image',
          size: file.size,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message || 'Erreur lors du téléversement' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response('Méthode non autorisée', { status: 405 });
}

export async function uploadMultiple(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    if (!files || files.length === 0) {
      return new Response(JSON.stringify({ error: 'Aucun fichier reçu' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const uploaded = [];
    for (const file of files) {
      const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}-${cleanName}`;
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/i.test(filename);
      const mime = file.type || getMimeType(filename);

      if (env.AFFICHAGE_R2) {
        await env.AFFICHAGE_R2.put(filename, file.stream(), {
          httpMetadata: { contentType: mime },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        await env.AFFICHAGE_KV.put('media:' + filename, arrayBuffer);
      }

      uploaded.push({
        url: `/uploads/${filename}`,
        fileName: file.name,
        mediaType: isVideo ? 'video' : 'image',
        size: file.size,
      });
    }
    return new Response(
      JSON.stringify({
        success: true,
        files: uploaded,
        count: uploaded.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Erreur upload multiple' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ============================================================
// ALERTES VICTOIRE / DÉFAITE & TÉLÉGRAM
// ============================================================

// ============================================================
// Équipes configurées et reconnaissance intelligente des équipes Telegram
// ============================================================
