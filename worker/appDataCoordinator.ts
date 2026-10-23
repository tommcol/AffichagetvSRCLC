import { Env } from './types';

const localQueues = new WeakMap<object, Promise<unknown>>();

/** One serial writer shared by admin saves, cron and Telegram across Workers. */
type DocumentStore = Pick<DurableObjectTransaction, 'get' | 'put' | 'delete'>;
const CHUNK_SIZE = 256 * 1024; // Below SQLite's 2 MB value limit, including UTF-8 text.
async function readDocument(store: DocumentStore): Promise<string | null> {
  const meta = await store.get<{ chunks: number }>('document');
  if (!meta) return null;
  const chunks = await Promise.all(Array.from({ length: meta.chunks }, (_, i) => store.get<string>(`chunk:${i}`)));
  if (chunks.some(chunk => chunk === undefined)) throw new Error('Document incomplet ; aucune écriture autorisée.');
  return chunks.join('');
}
async function writeDocument(store: DocumentStore, raw: string) {
  const previous = await store.get<{ chunks: number }>('document');
  const count = Math.ceil(raw.length / CHUNK_SIZE);
  for (let i = 0; i < count; i++) await store.put(`chunk:${i}`, raw.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  for (let i = count; i < (previous?.chunks || 0); i++) await store.delete(`chunk:${i}`);
  await store.put('document', { chunks: count });
}
export class AppDataCoordinator {
  private ready: Promise<void>;
  private mirrorQueue: Promise<unknown> = Promise.resolve();
  constructor(private state: DurableObjectState, private env: Env) {
    this.ready = state.blockConcurrencyWhile(async () => {
      if (!await state.storage.get('initialized')) {
        const raw = await env.AFFICHAGE_KV.get('app-data');
        await state.storage.transaction(async tx => {
          if (raw) await writeDocument(tx, raw);
          await tx.put('initialized', true);
        });
      }
    });
  }
  async fetch(request: Request): Promise<Response> {
    await this.ready;
    if (request.method === 'GET') return new Response(await this.state.storage.transaction(tx => readDocument(tx)) || 'null');
    const { data, expectedVersion } = await request.json() as any;
    const accepted = await this.state.storage.transaction(async tx => {
      const raw = await readDocument(tx);
      const current = raw ? JSON.parse(raw) : null;
      if ((current?.version || 0) !== expectedVersion) return false;
      await writeDocument(tx, JSON.stringify(data));
      return true;
    });
    if (!accepted) return new Response('Conflit de sauvegarde', { status: 409 });
    // Serial mirrors always read the latest committed snapshot; no lock across external I/O.
    this.mirrorQueue = this.mirrorQueue.catch(() => {}).then(async () => {
      const raw = await this.state.storage.transaction(tx => readDocument(tx));
      if (raw) await this.env.AFFICHAGE_KV.put('app-data', raw);
    });
    try { await this.mirrorQueue; } catch { console.warn('Miroir KV indisponible ; données conservées dans le stockage transactionnel.'); }
    return new Response('OK');
  }
}

function coordinator(env: Env) {
  return env.APP_DATA_COORDINATOR?.get(env.APP_DATA_COORDINATOR.idFromName('club-app-data'));
}
export async function readSharedAppData(env: Env): Promise<string | null> {
  const stub = coordinator(env);
  if (!stub) return env.AFFICHAGE_KV.get('app-data');
  const raw = await (await stub.fetch('https://storage.internal/')).text();
  return raw === 'null' ? null : raw;
}
export async function commitSharedAppData(env: Env, data: any, expectedVersion: number): Promise<boolean> {
  const stub = coordinator(env);
  if (stub) {
    const response = await stub.fetch('https://storage.internal/', {
      method: 'PUT', body: JSON.stringify({ data, expectedVersion }),
    });
    if (response.status === 409) return false;
    if (!response.ok) throw new Error('Enregistrement impossible');
    return true;
  }
  // Development/test adapter only; production binds the Durable Object in wrangler.json.
  const previous = localQueues.get(env.AFFICHAGE_KV) || Promise.resolve();
  const task = previous.catch(() => {}).then(async () => {
    const raw = await env.AFFICHAGE_KV.get('app-data');
    const current = raw ? JSON.parse(raw) : null;
    if ((current?.version || 0) !== expectedVersion) return false;
    await env.AFFICHAGE_KV.put('app-data', JSON.stringify(data));
    return true;
  });
  localQueues.set(env.AFFICHAGE_KV, task);
  return task;
}
export async function commitSharedAppDataOrThrow(env: Env, data: any, expectedVersion: number) {
  if (!await commitSharedAppData(env, data, expectedVersion)) {
    throw new Error('Les données ont changé pendant cette opération. Réessayez ; aucune donnée n’a été écrasée.');
  }
}
