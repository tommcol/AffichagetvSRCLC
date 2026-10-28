// ============================================================
// Types partagés du worker (environnement Cloudflare)
// ============================================================

export interface Env {
  AFFICHAGE_KV: KVNamespace;
  APP_DATA_COORDINATOR?: DurableObjectNamespace;
  AFFICHAGE_R2?: R2Bucket;
  APP_DATA_INSTANCE_NAME?: string;
  TELEGRAM_SECRET_SUFFIX?: string;
  ADMIN_PASSWORD?: string;
  GEMINI_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  ASSETS: { fetch: typeof fetch };
}
