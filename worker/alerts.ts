// ============================================================
// Alertes TV (victoires / défaites) partagées
// ============================================================

import { Env } from './types';

export function getAlertDeduplicationKey(alert: any): string {
  const source = alert?.triggeredBy || 'manual';
  if (source === 'ffbb' || source === 'telegram') {
    if (alert?.matchId) return `${source}:match:${alert.matchId}`;
    return [
      source,
      String(alert?.team || '').trim().toLowerCase(),
      String(alert?.opponent || '').trim().toLowerCase(),
      alert?.isWin ? 'win' : 'loss',
      alert?.ourScore ?? '',
      alert?.opponentScore ?? '',
    ].join('|');
  }
  return `id:${alert?.id || ''}`;
}

export function deduplicateAlerts(alerts: any[]): any[] {
  const seen = new Set<string>();
  return alerts.filter((alert) => {
    const key = getAlertDeduplicationKey(alert);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function getAlerts(env: Env): Promise<Response> {
  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const activeAlerts = Array.isArray(alerts)
      ? alerts.filter((a: { expiresAt: number }) => a && a.expiresAt > now)
      : [];
    const actives = deduplicateAlerts(activeAlerts);

    if (Array.isArray(alerts) && JSON.stringify(alerts) !== JSON.stringify(actives)) {
      await env.AFFICHAGE_KV.put('alerts', JSON.stringify(actives));
    }

    return new Response(JSON.stringify({ alerts: actives, count: actives.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ alerts: [], count: 0, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function addAlert(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  const body = (await request.json().catch(() => null)) as any;
  if (!body || !body.team) {
    return new Response(JSON.stringify({ error: 'Champ "team" requis' }), { status: 400 });
  }
  const {
    id: inputId,
    team, isWin, ourScore, opponentScore, opponent, customImageUrl,
    triggeredBy = 'manual', durationMinutes = 60, expiresAt: inputExpiresAt, timestamp: inputTimestamp,
  } = body;
  const durationMs = (durationMinutes || 60) * 60 * 1000;

  let finalCustomImageUrl = customImageUrl;
  let customTitleConfig = undefined;
  if (!finalCustomImageUrl) {
    try {
      const appDataRaw = await env.AFFICHAGE_KV.get('app-data');
      if (appDataRaw) {
        const appData = JSON.parse(appDataRaw);
        const vt = appData.visualTemplates;
        const commonBank = isWin ? vt?.commonVictoryVisuals : vt?.commonDefeatVisuals;
        if (commonBank && Array.isArray(commonBank) && commonBank.length > 0) {
          finalCustomImageUrl = commonBank[Math.floor(Math.random() * commonBank.length)];
        } else if (Array.isArray(appData.teamVisuals)) {
          const tv = appData.teamVisuals.find((t: any) =>
            t.teamName?.toLowerCase().includes(team.toLowerCase()) ||
            t.category?.toLowerCase() === team.toLowerCase()
          );
          if (tv) {
            finalCustomImageUrl = isWin ? tv.winVisualUrl : tv.lossVisualUrl;
          }
        }
        if (finalCustomImageUrl && vt?.visualTitleConfigs?.[finalCustomImageUrl]) {
          customTitleConfig = vt.visualTitleConfigs[finalCustomImageUrl];
        }
      }
    } catch (e) {
      console.warn('Erreur lors de la sélection du visuel dans la banque commune:', e);
    }
  }

  const now = Date.now();
  const alertId = inputId || ('alert-' + now + '-' + Math.random().toString(36).substring(2, 6));
  const newAlert = {
    id: alertId,
    team,
    isWin: Boolean(isWin),
    ourScore: (ourScore !== undefined && ourScore !== null && ourScore !== '') ? Number(ourScore) : undefined,
    opponentScore: (opponentScore !== undefined && opponentScore !== null && opponentScore !== '') ? Number(opponentScore) : undefined,
    opponent: opponent || undefined,
    customImageUrl: finalCustomImageUrl,
    titleConfig: customTitleConfig,
    triggeredBy,
    timestamp: inputTimestamp || now,
    expiresAt: inputExpiresAt || (now + durationMs),
  };

  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const alertesValides = Array.isArray(alerts)
      ? alerts.filter((a: { id: string; expiresAt: number }) => a && a.id !== alertId && a.expiresAt > now)
      : [];

    const newKey = getAlertDeduplicationKey(newAlert);
    const dedupedExisting = alertesValides.filter(
      (existing: any) => getAlertDeduplicationKey(existing) !== newKey
    );

    dedupedExisting.unshift(newAlert);
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(dedupedExisting));
  } catch (kvErr) {
    console.error('Erreur KV put alerts:', kvErr);
  }

  return new Response(JSON.stringify({ success: true, alert: newAlert }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function deleteAlert(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  let id = url.searchParams.get('id') || url.pathname.replace('/api/alerts/', '').replace('/api/delete-alert/', '');
  if (!id || id === '/api/delete-alert' || id === '/api/alerts') {
    const body = (await request.json().catch(() => null)) as any;
    if (body?.id) id = body.id;
  }
  if (!id) {
    return new Response(JSON.stringify({ error: 'Paramètre "id" requis' }), { status: 400 });
  }
  try {
    const raw = await env.AFFICHAGE_KV.get('alerts');
    const alerts = raw ? JSON.parse(raw) : [];
    const nouvelleListe = Array.isArray(alerts) ? alerts.filter((a: { id: string }) => a && a.id !== id) : [];
    await env.AFFICHAGE_KV.put('alerts', JSON.stringify(nouvelleListe));
    const targetAlert = Array.isArray(alerts) ? alerts.find((a: { id: string }) => a && a.id === id) : null;
    if (targetAlert?.triggeredBy === 'telegram' && targetAlert.telegramChatId && targetAlert.telegramMessageId) {
      const botToken = env.TELEGRAM_BOT_TOKEN?.trim();
      if (botToken) {
        await fetch('https://api.telegram.org/bot' + botToken + '/deleteMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: targetAlert.telegramChatId, message_id: targetAlert.telegramMessageId }) }).catch(() => null);
      }
    }
    return new Response(JSON.stringify({ success: true, count: nouvelleListe.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

/**
 * Calcule de façon déterministe un jeton secret de signature pour le webhook Telegram.
 * Telegram envoie ce jeton dans le header HTTP 'X-Telegram-Bot-Api-Secret-Token' à chaque requête.
 * Seules les requêtes présentant exactement ce jeton secret sont acceptées.
 */
