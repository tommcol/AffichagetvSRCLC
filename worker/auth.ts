import { Env } from './types';
const cookieName = 'club_admin';
const encoder = new TextEncoder();
const MAX_LOGIN_FAILURES = 5;
const LOGIN_LOCK_SECONDS = 15 * 60;

async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Comparaison dont la durée ne dépend pas du nombre de caractères identiques
// (empêche de deviner un secret caractère par caractère en mesurant le temps).
export function safeEqual(a: string, b: string) {
  const left = encoder.encode(String(a));
  const right = encoder.encode(String(b));
  let diff = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i++) diff |= (left[i] || 0) ^ (right[i] || 0);
  return diff === 0;
}

// Limitation des essais de mot de passe, par adresse IP. Si le stockage est
// indisponible, la connexion reste possible (aucun blocage par erreur).
function failureKey(request: Request) {
  return 'login-fail:' + (request.headers.get('cf-connecting-ip') || 'inconnu');
}
async function readFailures(env: Env, key: string): Promise<number> {
  try { return Number(await env.AFFICHAGE_KV.get(key)) || 0; } catch { return 0; }
}
async function recordFailure(env: Env, key: string, previous: number) {
  try { await env.AFFICHAGE_KV.put(key, String(previous + 1), { expirationTtl: LOGIN_LOCK_SECONDS }); } catch { /* sans effet */ }
}
async function clearFailures(env: Env, key: string) {
  try { await env.AFFICHAGE_KV.delete(key); } catch { /* sans effet */ }
}

export async function isAdmin(request: Request, env: Env) {
  if (!env.ADMIN_PASSWORD) return true; // Access protection is enabled by the configured server secret.
  const token = request.headers.get('cookie')?.split(';').map(p => p.trim()).find(p => p.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token) return false;
  const [expiry, sig] = token.split('.');
  if (!sig || Number(expiry) <= Date.now()) return false;
  return safeEqual(sig, await signature(expiry, env.ADMIN_PASSWORD));
}
export async function verifyAdmin(request: Request, env: Env) {
  if (request.method === 'GET') return Response.json({ required: Boolean(env.ADMIN_PASSWORD), authenticated: await isAdmin(request, env) });
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const body = await request.json().catch(() => null) as any;
  if (env.ADMIN_PASSWORD) {
    const key = failureKey(request);
    const failures = await readFailures(env, key);
    if (failures >= MAX_LOGIN_FAILURES) {
      return Response.json(
        { error: 'Trop de tentatives. Réessayez dans 15 minutes.', ok: false },
        { status: 429, headers: { 'Retry-After': String(LOGIN_LOCK_SECONDS) } }
      );
    }
    if (typeof body?.password !== 'string' || !safeEqual(body.password, env.ADMIN_PASSWORD)) {
      await recordFailure(env, key, failures);
      return Response.json({ error: 'Mot de passe incorrect', ok: false }, { status: 401 });
    }
    if (failures > 0) await clearFailures(env, key);
  }
  const expiry = String(Date.now() + 12 * 60 * 60 * 1000);
  const token = expiry + '.' + await signature(expiry, env.ADMIN_PASSWORD || 'local-development');
  return Response.json({ ok: true, success: true }, { headers: { 'Set-Cookie': `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200` } });
}
