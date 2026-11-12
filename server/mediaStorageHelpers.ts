import fs from 'node:fs';
import path from 'node:path';
import { Env } from '../worker/types';
import { mediaStorage } from '../worker/mediaStorage';
import { isStoredMediaKey } from '../src/utils/storedMedia';

// Même contrôle des usages en local ; uniquement les dossiers médias de cette instance.
export function localMediaStorage(request: Request, directories: string[], data: unknown, alerts: unknown, password?: string) {
  const files = () => new Map(directories.flatMap(dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && isStoredMediaKey(entry.name)).map(entry => [entry.name, path.join(dir, entry.name)] as const) : []));
  const env = {
    ADMIN_PASSWORD: password,
    AFFICHAGE_KV: {
      get: async (key: string) => key === 'app-data' ? (data ? JSON.stringify(data) : null) : key === 'alerts' ? JSON.stringify(alerts) : null,
      list: async () => ({ keys: [], list_complete: true }),
      delete: async () => {},
    },
    AFFICHAGE_R2: {
      list: async ({ cursor }: { cursor?: string }) => {
        const all = [...files()].sort(([a], [b]) => a.localeCompare(b));
        const start = cursor ? all.findIndex(([name]) => name === cursor) + 1 : 0;
        const page = all.slice(start, start + 100);
        return { objects: page.map(([key, filename]) => ({ key, size: fs.statSync(filename).size })),
          truncated: start + page.length < all.length, cursor: page.at(-1)?.[0] };
      },
      delete: async (key: string) => {
        for (const dir of directories) {
          const filename = path.join(dir, key);
          if (fs.existsSync(filename) && fs.lstatSync(filename).isFile()) fs.unlinkSync(filename);
        }
      },
    },
  };
  return mediaStorage(request, env as unknown as Env);
}
