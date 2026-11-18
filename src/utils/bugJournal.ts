/** Device-local diagnostics. Never record request bodies, headers or application data. */
export interface BugEntry { at: number; source: string; message: string }
const KEY = 'club_bug_journal_v1';
const EVENT = 'club-bug-journal-change';
const LIMIT = 100;
let entries: BugEntry[] | undefined;
let recording = false;

export function sanitizeDiagnostic(text: string): string {
  return text.slice(0, 12000)
    .replace(/data:[^\s]+|blob:[^\s]+/gi, '[ressource intégrée]')
    .replace(/https?:\/\/[^\s)]+/gi, value => {
      try {
        const u = new URL(value);
        return /\/(assets\/[^/]+\.(?:js|css)(?::\d+)*|api\/[a-z-]+)$/.test(u.pathname) ? u.pathname : '[URL masquée]';
      } catch { return '[URL masquée]'; }
    })
    .replace(/([?&][^=\s]+)=([^\s&]+)/g, '$1=[masqué]')
    .replace(/\b(Bearer|Basic)\s+[^\s,;]+/gi, '$1 [masqué]')
    .replace(/((?:[\w-]*(?:token|password|secret|authorization|cookie|api[_-]?key)[\w-]*)["']?\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;}]+)/gi, '$1[masqué]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, '[jeton masqué]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email masqué]')
    .slice(0, 2000);
}
function describe(value: unknown): string {
  if (value instanceof Error) return sanitizeDiagnostic(value.stack || `${value.name}: ${value.message}`);
  if (typeof value === 'string') return sanitizeDiagnostic(value);
  if (value === null || ['number', 'boolean', 'undefined'].includes(typeof value)) return String(value);
  return '[objet non collecté]';
}
export function readBugJournal(): BugEntry[] {
  if (!entries) {
    entries = [];
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(saved)) entries = saved.slice(0, LIMIT).filter(e => e && Number.isFinite(e.at) && Number.isFinite(new Date(e.at).getTime()) && typeof e.source === 'string' && typeof e.message === 'string')
        .map(e => ({ at: e.at, source: sanitizeDiagnostic(e.source).slice(0, 60), message: sanitizeDiagnostic(e.message) }));
    } catch { /* Storage may be blocked. Keep working in memory. */ }
  }
  return entries.slice();
}
function publish() {
  try { localStorage.setItem(KEY, JSON.stringify(entries)); } catch { /* In-memory fallback. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}
export function recordBug(source: string, ...values: unknown[]) {
  if (recording) return;
  recording = true;
  try {
    entries = [{ at: Date.now(), source: sanitizeDiagnostic(source).slice(0, 60), message: values.map(describe).join(' ').slice(0, 2000) }, ...readBugJournal()].slice(0, LIMIT);
    publish();
  } catch { /* Diagnostics must never interrupt the application or its original console. */ }
  finally { recording = false; }
}
export function clearBugJournal() { entries = []; publish(); }
export function subscribeBugJournal(listener: () => void) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
export function bugReport(): string {
  return ['Rapport de bugs — Affichage TV', `Date : ${new Date().toISOString()}`, `Navigateur : ${typeof navigator === 'undefined' ? 'inconnu' : sanitizeDiagnostic(navigator.userAgent)}`,
    'Journal local de cet appareil. Décrire ici le problème et les étapes : …',
    ...readBugJournal().map(e => `\n[${new Date(e.at).toISOString()}] ${e.source}\n${e.message}`)].join('\n');
}
let installed = false;
export function installBugJournal(): () => void {
  if (installed || typeof window === 'undefined') return () => {};
  installed = true;
  const originalError = console.error, originalWarn = console.warn, originalFetch = window.fetch;
  console.error = (...args) => { recordBug('Console / erreur', ...args); originalError.apply(console, args); };
  console.warn = (...args) => { recordBug('Console / avertissement', ...args); originalWarn.apply(console, args); };
  const onError = (event: Event) => {
    if (event instanceof ErrorEvent) recordBug('JavaScript', event.error || event.message);
    else if (event.target instanceof Element) recordBug('Ressource', `Chargement impossible : ${event.target.tagName.toLowerCase()}`);
  };
  const onRejection = (event: PromiseRejectionEvent) => recordBug('Promesse rejetée', event.reason);
  window.addEventListener('error', onError, true);
  window.addEventListener('unhandledrejection', onRejection);
  const wrappedFetch: typeof fetch = async (...args) => {
    let route = '';
    try {
      const input = args[0];
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, window.location.href);
      if (url.origin === window.location.origin && url.pathname.startsWith('/api/')) route = url.pathname.split('/').slice(0, 3).join('/');
    } catch { /* No request content is inspected. */ }
    try {
      const response = await originalFetch.apply(window, args);
      if (route && !response.ok) recordBug('API', `${route} — HTTP ${response.status}`);
      return response;
    } catch (error) {
      if (route && !(error instanceof Error && error.name === 'AbortError')) recordBug('API', `${route} — réseau indisponible`);
      throw error;
    }
  };
  window.fetch = wrappedFetch;
  return () => {
    console.error = originalError; console.warn = originalWarn;
    if (window.fetch === wrappedFetch) window.fetch = originalFetch;
    window.removeEventListener('error', onError, true);
    window.removeEventListener('unhandledrejection', onRejection);
    installed = false;
  };
}
