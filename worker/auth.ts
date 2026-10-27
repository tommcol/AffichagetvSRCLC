import { Env } from './types';
const cookieName = 'club_admin';
const encoder = new TextEncoder();
async function signature(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}
export async function isAdmin(request: Request, env: Env) {
  if (!env.ADMIN_PASSWORD) return true; // Access protection is enabled by the configured server secret.
  const token = request.headers.get('cookie')?.split(';').map(p => p.trim()).find(p => p.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
  if (!token) return false;
  const [expiry, sig] = token.split('.');
  if (!sig || Number(expiry) <= Date.now()) return false;
  return sig === await signature(expiry, env.ADMIN_PASSWORD);
}
export async function verifyAdmin(request: Request, env: Env) {
  if (request.method === 'GET') return Response.json({ required: Boolean(env.ADMIN_PASSWORD), authenticated: await isAdmin(request, env) });
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const body = await request.json().catch(() => null) as any;
  if (env.ADMIN_PASSWORD && body?.password !== env.ADMIN_PASSWORD) return Response.json({ error: 'Mot de passe incorrect', ok: false }, { status: 401 });
  const expiry = String(Date.now() + 12 * 60 * 60 * 1000);
  const token = expiry + '.' + await signature(expiry, env.ADMIN_PASSWORD || 'local-development');
  return Response.json({ ok: true, success: true }, { headers: { 'Set-Cookie': `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=43200` } });
}
