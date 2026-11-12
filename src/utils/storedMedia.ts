// Seuls les fichiers plats créés par les téléversements sont gérés ici.
export function isStoredMediaKey(key: unknown): key is string {
  return typeof key === 'string' && key.length > 0 && key.length <= 512
    && key !== '.' && key !== '..' && !/[\\/\x00-\x1f\x7f]/.test(key);
}

export function storedMediaKey(value: string, origin: string): string | null {
  try {
    const url = new URL(value, origin);
    if (url.origin !== origin) return null;
    const match = /^\/(?:uploads|api\/media)\/([^/]+)$/.exec(url.pathname);
    const key = match ? decodeURIComponent(match[1]) : '';
    return isStoredMediaKey(key) ? key : null;
  } catch { return null; }
}

export function getStoredMediaUsages(key: string, data: unknown, alerts: unknown, origin: string): string[] {
  const found = new Set<string>();
  const names: Record<string, string> = { sponsors: 'Sponsors', photos: 'Photos', logos: 'Logos',
    events: 'Annonces', teamVisuals: 'Visuels des équipes', clubSettings: 'Identité et paramètres du club',
    visualTemplates: 'Studios graphiques', matches: 'Matchs', results: 'Résultats' };
  const visit = (value: unknown, path: string[]) => {
    if (typeof value === 'string') {
      if (storedMediaKey(value, origin) === key) found.add(names[path[0]] || path[0] || 'Réglages');
    } else if (Array.isArray(value)) value.forEach(child => visit(child, path));
    else if (value && typeof value === 'object') Object.entries(value).forEach(([name, child]) => {
      // Le catalogue est un index, pas une utilisation. Même masqués, les autres calques restent protégés.
      if (path.length === 1 && path[0] === 'visualTemplates' && name === 'mediaBank') return;
      visit(child, [...path, name]);
    });
  };
  visit(data, []);
  if (Array.isArray(alerts)) alerts.filter(a => a?.expiresAt > Date.now()).forEach(a => visit(a, ['Alertes TV actives']));
  return [...found];
}

export interface StoredMediaFile {
  key: string;
  size?: number;
  usages: string[];
}
