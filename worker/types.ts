// ============================================================
// Types partagés du worker (environnement Cloudflare)
// ============================================================

export interface Env {
  AFFICHAGE_KV: KVNamespace;
  AFFICHAGE_R2?: R2Bucket;
  ADMIN_PASSWORD?: string;
  GEMINI_API_KEY?: string;
  MISTRAL_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  TELEGRAM_BOT_TOKEN?: string;
  ASSETS: { fetch: typeof fetch };
}
