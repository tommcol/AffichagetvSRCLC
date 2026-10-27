import { isAdmin } from './auth';
export { AppDataCoordinator } from './appDataCoordinator';
// ============================================================
// Routeur principal du worker Cloudflare
// Toute la logique métier est découpée dans les modules frères :
// types.ts, storage.ts, media.ts, alerts.ts, telegram.ts, ffbb.ts, ai.ts
// ============================================================

import { Env } from './types';
import { getAppData, saveAppData, verifyPassword } from './storage';
import { serveMedia, uploadFile, uploadMultiple } from './media';
import { getAlerts, addAlert, deleteAlert } from './alerts';
import { telegramWebhook, telegramTest, telegramConnect, telegramDisconnect, telegramConfig } from './telegram';
import { ffbbMatches, ffbbSearch, ffbbDebug, runScheduledFfbbSync } from './ffbb';
import { generateCaption, socialPublish } from './ai';

export default {
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(runScheduledFfbbSync(env));
  },

  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      if (path.startsWith('/api/') && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
          && path !== '/api/verify-password' && path !== '/api/telegram-webhook') {
        const origin = request.headers.get('origin');
        if ((origin && origin !== url.origin) || !await isAdmin(request, env)) {
          return Response.json({ error: 'Authentification requise' }, { status: 401 });
        }
      }
      if ((path === '/api/get-app-data' || path === '/api/app-data') && request.method === 'GET') return await getAppData(env);
      if (path === '/api/save-app-data' || path === '/api/app-data' && request.method === 'POST') return await saveAppData(request, env);
      if (path === '/api/verify-password') return await verifyPassword(request, env);
      if (path === '/api/upload') return await uploadFile(request, env);
      if (path === '/api/upload-multiple') return await uploadMultiple(request, env);
      if (path.startsWith('/api/media/')) return await serveMedia(path.replace('/api/media/', ''), env, request);
      if (path.startsWith('/uploads/')) return await serveMedia(path.replace('/uploads/', ''), env, request);
      if (path === '/api/get-alerts' || path === '/api/alerts') {
        if (request.method === 'POST') return await addAlert(request, env);
        if (request.method === 'DELETE') return await deleteAlert(request, env);
        return await getAlerts(env);
      }
      if (path === '/api/add-alert') return await addAlert(request, env);
      if (path === '/api/delete-alert' || path.startsWith('/api/alerts/')) return await deleteAlert(request, env);
      if (path === '/api/telegram-webhook') return await telegramWebhook(request, env);
      if (path === '/api/telegram/test') return await telegramTest(request, env);
      if (path === '/api/telegram/config' || path === '/api/telegram/status') return await telegramConfig(request, env);
      if (path === '/api/telegram/connect') return await telegramConnect(request, env);
      if (path === '/api/telegram/disconnect') return await telegramDisconnect(request, env);
      if (path === '/api/ffbb/matches') return await ffbbMatches(request, env);
      if (path === '/api/ffbb/search') return await ffbbSearch(request);
      if (path === '/api/ffbb/debug') return await ffbbDebug(request, env);
      if (path === '/api/generate-caption') return await generateCaption(request, env);
      if (path === '/api/social/publish') return await socialPublish(request);
    } catch (err: any) {
      return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }

    // Tout le reste (page principale, fichiers) est géré automatiquement par Cloudflare
    return env.ASSETS.fetch(request);
  },
};
