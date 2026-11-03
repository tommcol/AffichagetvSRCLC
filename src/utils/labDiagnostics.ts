export interface DiagnosticEntry {
  id: string; time: string; level: 'error' | 'warning' | 'info'; source: string; message: string; count: number;
}
export const DIAGNOSTIC_STORAGE_KEY = 'club_lab_diagnostics_v1';
export const DIAGNOSTIC_LIMIT = 150;
const MAX_AGE = 24 * 60 * 60 * 1000;
let entries: DiagnosticEntry[] = [];
let enabled = false;
const subscribers = new Set<() => void>();

/** Never capture API bodies, credentials, query parameters, or uploaded content. */
export function sanitizeDiagnostic(value: string): string {
  return value.replace(/data:[^\s]+/gi, '[média]')
    .replace(/https?:\/\/[^\s<>"')]+/gi, raw => {
      try { const url = new URL(raw); return url.origin + url.pathname; } catch { return '[adresse]'; }
    })
    .replace(/\b\d{7,}:[A-Za-z0-9_-]{20,}\b/g, '[secret masqué]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[jeton masqué]')
    .replace(/((?:password|secret|token|authorization|cookie|api[_-]?key)\s*[:=]\s*)[^\s,;]+/gi, '$1[masqué]')
    .slice(0, 1000);
}
export function retainDiagnostics(items: DiagnosticEntry[], now = Date.now()): DiagnosticEntry[] {
  return items.filter(item => item && typeof item.time === 'string' && Date.parse(item.time) > now - MAX_AGE
    && Date.parse(item.time) <= now && ['error','warning','info'].includes(item.level) && typeof item.message === 'string')
    .slice(-DIAGNOSTIC_LIMIT).map(item => ({ id: String(item.id).slice(0,80), time: item.time,
      level: item.level, source: sanitizeDiagnostic(String(item.source)).slice(0,80),
      message: sanitizeDiagnostic(item.message), count: Math.max(1, Math.min(999, Number(item.count) || 1)) }));
}
const notify = () => {
  try { localStorage.setItem(DIAGNOSTIC_STORAGE_KEY, JSON.stringify(entries)); } catch { /* Quota/private browsing: keep the in-memory journal. */ }
  subscribers.forEach(fn => fn());
};
export function diagnosticSnapshot() { return entries; }
export function subscribeDiagnostics(fn: () => void) { subscribers.add(fn); return () => { subscribers.delete(fn); }; }
export function clearDiagnostics() { entries = []; notify(); }
export function recordDiagnostic(level: DiagnosticEntry['level'], source: string, message: string) {
  if (!enabled) return;
  const safe = sanitizeDiagnostic(message), last = entries[entries.length - 1];
  if (last?.message === safe && last.source === source && last.level === level) {
    entries = [...entries.slice(0,-1), {...last,time:new Date().toISOString(),count:Math.min(999,last.count+1)}];
  } else entries = retainDiagnostics([...entries, {id:crypto.randomUUID(),time:new Date().toISOString(),level,source:sanitizeDiagnostic(source),message:safe,count:1}]);
  notify();
}
function messageOf(values: unknown[]) {
  return values.map(v => v instanceof Error ? `${v.name}: ${v.message}` : typeof v === 'string' ? v : '[détail non enregistré]').join(' ');
}
/** Installed only after the server identifies this origin as the isolated laboratory. */
export function installLabDiagnostics() {
  if (enabled) return () => {};
  enabled = true;
  try { const cached = JSON.parse(localStorage.getItem(DIAGNOSTIC_STORAGE_KEY) || '[]'); entries = retainDiagnostics(Array.isArray(cached) ? cached : []); } catch { entries = []; }
  const originalFetch = window.fetch;
  const originalError = console.error, originalWarn = console.warn;
  const errorListener = (event: ErrorEvent) => recordDiagnostic('error','JavaScript',event.message || 'Erreur de script');
  const rejectionListener = (event: PromiseRejectionEvent) => recordDiagnostic('error','Action asynchrone',messageOf([event.reason]));
  const resourceListener = (event: Event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement || target instanceof HTMLVideoElement) recordDiagnostic('warning','Média','Une image ou une vidéo n’a pas pu être chargée.');
  };
  console.error = (...values: unknown[]) => { originalError.apply(console,values); recordDiagnostic('error','Application',messageOf(values)); };
  console.warn = (...values: unknown[]) => { originalWarn.apply(console,values); recordDiagnostic('warning','Application',messageOf(values)); };
  window.fetch = async (input, init) => {
    let path = '';
    try { const url = new URL(input instanceof Request ? input.url : String(input), window.location.href); if(url.origin===window.location.origin && url.pathname.startsWith('/api/')) path=url.pathname; } catch { /* Preserve native fetch error semantics. */ }
    try {
      const response = await originalFetch.call(window,input,init);
      if(path && !response.ok) recordDiagnostic(response.status>=500?'error':'warning','API',`${init?.method || (input instanceof Request ? input.method : 'GET')} ${path} — HTTP ${response.status}`);
      return response;
    } catch(error) { if(path)recordDiagnostic('error','Réseau',`${path} — impossible de joindre le serveur.`); throw error; }
  };
  window.addEventListener('error', errorListener);
  window.addEventListener('unhandledrejection', rejectionListener);
  document.addEventListener('error',resourceListener,true);
  notify();
  return () => {
    enabled=false; window.fetch=originalFetch; console.error=originalError;console.warn=originalWarn;
    window.removeEventListener('error',errorListener);window.removeEventListener('unhandledrejection',rejectionListener);document.removeEventListener('error',resourceListener,true);
  };
}
