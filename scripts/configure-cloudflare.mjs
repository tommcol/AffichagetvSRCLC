import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/** Produces a private configuration; never contacts Cloudflare or changes storage. */
export function createDeploymentConfig(base, env) {
  const required = name => {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Variable de compilation manquante : ${name}`);
    return value;
  };
  const name = required('DEPLOY_WORKER_NAME');
  const kv = required('DEPLOY_KV_NAMESPACE_ID');
  const bucket = required('DEPLOY_R2_BUCKET_NAME');
  const migration = required('DEPLOY_DO_MIGRATION_TAG');
  const instance = required('DEPLOY_DO_INSTANCE_NAME');
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(name)) throw new Error('DEPLOY_WORKER_NAME invalide');
  if (!/^[a-f0-9]{32}$/i.test(kv)) throw new Error('DEPLOY_KV_NAMESPACE_ID invalide');
  if (!/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error('DEPLOY_R2_BUCKET_NAME invalide');
  const config = structuredClone(base);
  config.name = name;
  config.keep_vars = true;
  config.kv_namespaces = [{ binding: 'AFFICHAGE_KV', id: kv }];
  config.r2_buckets = [{ binding: 'AFFICHAGE_R2', bucket_name: bucket }];
  // Preserve the already applied first migration on an existing installation.
  config.migrations = [{ tag: migration, new_sqlite_classes: ['AppDataCoordinator'] }];
  config.vars = { ...config.vars, APP_DATA_INSTANCE_NAME: instance };
  const suffix = env.DEPLOY_TELEGRAM_SECRET_SUFFIX;
  if (suffix) config.vars.TELEGRAM_SECRET_SUFFIX = suffix;
  return config;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const config = createDeploymentConfig(JSON.parse(readFileSync('wrangler.json', 'utf8')), process.env);
    writeFileSync('wrangler.private.json', JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
    console.log('Configuration privée de déploiement préparée (valeurs non affichées).');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
