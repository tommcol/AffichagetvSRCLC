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

export function parseByteRange(value: string | null, size: number): { offset: number; length: number } | null | false {
  if (!value) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(value);
  if (!match || (!match[1] && !match[2]) || size <= 0) return false;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(size - 1, Number(match[2])) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || end < start) return false;
  return { offset: start, length: end - start + 1 };
}

export async function serveMedia(filename: string, env: Env, request?: Request): Promise<Response> {
  const decoded = decodeURIComponent(filename);
  const headers = new Headers({ 'Content-Type': getMimeType(decoded), 'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable', 'Access-Control-Allow-Origin': '*' });
  const requestedRange = request?.headers.get('range') || null;
  if (env.AFFICHAGE_R2) {
    const meta = await env.AFFICHAGE_R2.head(decoded);
    if (meta) {
      meta.writeHttpMetadata(headers); headers.set('etag', meta.httpEtag);
      const range = parseByteRange(requestedRange, meta.size);
      if (range === false) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${meta.size}` } });
      if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${meta.size}`);
      headers.set('Content-Length', String(range ? range.length : meta.size));
      const object = request?.method === 'HEAD' ? null : await env.AFFICHAGE_R2.get(decoded, range ? { range } : undefined);
      return new Response(object?.body || null, { status: range ? 206 : 200, headers });
    }
  }
  const data = await env.AFFICHAGE_KV.get('media:' + decoded, { type: 'arrayBuffer' });
  if (!data) return new Response('Média non trouvé', { status: 404 });
  const range = parseByteRange(requestedRange, data.byteLength);
  if (range === false) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${data.byteLength}` } });
  if (range) headers.set('Content-Range', `bytes ${range.offset}-${range.offset + range.length - 1}/${data.byteLength}`);
  const bytes = range ? data.slice(range.offset, range.offset + range.length) : data;
  headers.set('Content-Length', String(bytes.byteLength));
  return new Response(request?.method === 'HEAD' ? null : bytes, { status: range ? 206 : 200, headers });
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
      const file = formData.get('file') as unknown as File | null;
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
    const files = formData.getAll('files') as unknown as File[];
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
