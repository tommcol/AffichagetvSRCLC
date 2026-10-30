/** Server-only FFBB adapter. Uses the mobile API documented by ffbb-data-client
 * v2.4.42, while preserving the REST shapes consumed by our existing mappers.
 * Tokens remain in this request's closure: never persisted, logged or returned.
 */
const ORIGIN = 'https://api.ffbb.com/';
const MOBILE_AGENT = 'FFBB/1.6.7.42 Dalvik/2.1.0 (Linux; U; Android 5.1.1; Android SDK built for x86 Build/LMY48X)';
type Row = Record<string, any>;
const id = (v: any): string => String(v?.id ?? v ?? '');
const PAGE_SIZE = 500;

export function createFfbbDataSource(fetcher: typeof fetch = fetch) {
  let tokenPromise: Promise<string> | undefined;
  const clubs = new Map<string, Promise<Row>>();
  const poules = new Map<string, Promise<Row>>();
  const calendars = new Map<string, Promise<Row>>();

  async function read(url: string, token?: string): Promise<Row> {
    const response = await fetcher(url, {
      headers: { Accept: 'application/json', 'User-Agent': MOBILE_AGENT,
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      signal: AbortSignal.timeout(20000),
    });
    // Do not include upstream bodies/URLs in errors: configuration contains tokens.
    if (!response.ok) throw new Error(`Service FFBB indisponible (HTTP ${response.status}).`);
    const body = await response.json() as Row;
    if (!body || typeof body !== 'object' || body.errors || body.error) {
      throw new Error('Réponse FFBB invalide.');
    }
    return body;
  }

  async function official(path: string, params: Record<string, string> = {}): Promise<any> {
    tokenPromise ??= read(`${ORIGIN}items/configuration`).then(body => {
      const token = body.data?.key_dh;
      if (typeof token !== 'string' || !token.trim()) throw new Error('Configuration FFBB indisponible.');
      return token;
    });
    const url = new URL(`items/${path}`, ORIGIN);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    const body = await read(url.toString(), await tokenPromise);
    if (body.data === undefined || body.data === null) throw new Error('Données FFBB absentes.');
    return body.data;
  }

  async function resolveClub(code: string): Promise<string | null> {
    const clean = code.trim();
    if (/^\d+$/.test(clean)) return clean;
    if (!clean) return null;
    const byCode = /^[A-Z]{2,}\d+$/i.test(clean);
    const rows = await official('ffbbserver_organismes', {
      [`filter[${byCode ? 'code' : 'nom'}][_eq]`]: byCode ? clean.toUpperCase() : clean,
      fields: 'id', limit: '2',
    });
    return Array.isArray(rows) && rows.length === 1 && rows[0].id ? id(rows[0]) : null;
  }

  function club(orgId: string): Promise<Row> {
    if (!clubs.has(orgId)) clubs.set(orgId, official(`ffbbserver_organismes/${encodeURIComponent(orgId)}`, {
      fields: 'id,nom,code,commune.libelle,salle.libelle,logo.id,engagements.id,engagements.numeroEquipe,engagements.idPoule.id,engagements.idCompetition.nom',
      'deep[engagements][_limit]': '1000',
    }).then(data => {
      if (!data.id || !data.nom || !Array.isArray(data.engagements) || data.engagements.length >= 1000) {
        throw new Error('Fiche club FFBB incomplète.');
      }
      return data;
    }));
    return clubs.get(orgId)!;
  }

  function poule(pid: string): Promise<Row> {
    if (!poules.has(pid)) poules.set(pid, (async () => {
      // Paginate the collection rather than silently truncating nested relations.
      const rows: Row[] = [];
      for (let page = 0; page < 20; page++) {
        const batch = await official('ffbbserver_rencontres', {
          'filter[idPoule][_eq]': pid,
          fields: 'id,numero,numeroJournee,idPoule,idOrganismeEquipe1,idOrganismeEquipe2,idEngagementEquipe1,idEngagementEquipe2,nomEquipe1,nomEquipe2,date_rencontre,date,horaire,joue,resultatEquipe1,resultatEquipe2,salle.libelle,salle.commune.libelle',
          sort: 'id', limit: String(PAGE_SIZE), offset: String(page * PAGE_SIZE),
        });
        if (!Array.isArray(batch)) throw new Error('Calendrier FFBB invalide.');
        rows.push(...batch);
        if (batch.length < PAGE_SIZE) return { id: pid, rencontres: rows, source: 'ffbb_mobile', degraded: false };
      }
      throw new Error('Calendrier FFBB trop volumineux : récupération interrompue sans remplacement des données.');
    })());
    return poules.get(pid)!;
  }

  function calendar(orgId: string): Promise<Row> {
    if (!calendars.has(orgId)) calendars.set(orgId, (async () => {
      const c = await club(orgId);
      const engagements = c.engagements as Row[];
      const byPoule = new Map<string, Row[]>();
      for (const e of engagements) {
        const pid = id(e.idPoule);
        if (pid) byPoule.set(pid, [...(byPoule.get(pid) || []), e]);
      }
      const matches = new Map<string, Row>();
      // Bounded concurrency for Workers and upstream; all failures propagate.
      const entries = [...byPoule];
      let cursor = 0;
      const loads = await Promise.allSettled(Array.from({ length: Math.min(4, entries.length) }, async () => {
        while (cursor < entries.length) {
          const [pid, teamEngagements] = entries[cursor++];
          const p = await poule(pid);
          for (const r of p.rencontres) {
            const home = id(r.idOrganismeEquipe1) === orgId;
            const away = id(r.idOrganismeEquipe2) === orgId;
            if (!home && !away) continue;
            const e = teamEngagements.find(e => id(e) === id(home ? r.idEngagementEquipe1 : r.idEngagementEquipe2));
            // A club can have several teams in one poule: don't guess the engagement.
            if (!e || !r.id || !/^\d{4}-\d{2}-\d{2}/.test(r.date_rencontre || r.date || '')) {
              throw new Error('Rencontre FFBB incomplète : aucun calendrier partiel ne sera présenté comme complet.');
            }
            const date = String(r.date_rencontre || r.date);
            const timePart = date.match(/[T ](\d{2}:\d{2})/);
            const hour = String(r.horaire || '').replace(/^(\d{2})(\d{2})$/, '$1:$2');
            const time = timePart?.[1] || (/^\d{2}:\d{2}$/.test(hour) ? hour : '');
            const validScore = (v: any) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
            const scored = validScore(r.resultatEquipe1) && validScore(r.resultatEquipe2);
            matches.set(id(r), {
              engagementId: id(e), team_number: e.numeroEquipe || '1',
              ffbbMatchId: id(r), dateISO: date.slice(0, 10), time: time === '00:00' ? '' : time,
              team: home ? r.nomEquipe1 : r.nomEquipe2, opponent: home ? r.nomEquipe2 : r.nomEquipe1,
              competition: e.idCompetition?.nom || '', isHome: home,
              pouleId: pid, location: [r.salle?.libelle, r.salle?.commune?.libelle].filter(Boolean).join(', '),
              scoreEquipe1: scored ? Number(r.resultatEquipe1) : undefined,
              scoreEquipe2: scored ? Number(r.resultatEquipe2) : undefined,
              isPlayed: r.joue === true || r.joue === 1 || scored,
            });
          }
        }
      }));
      if (loads.some(result => result.status === 'rejected')) throw new Error('Calendrier FFBB incomplet.');
      return { matches: [...matches.values()], total: matches.size, source: 'ffbb_mobile', degraded: false };
    })());
    return calendars.get(orgId)!;
  }

  async function inspectMembership(orgId: string, matchIds: string[]) {
    const foreignMatchIds: string[] = [];
    const owned = new Map<string, Row>();
    const ids = [...new Set(matchIds.filter(value => /^\d+$/.test(value)))];
    for (let start = 0; start < ids.length; start += 50) {
      const rows = await official('ffbbserver_rencontres', {
        'filter[id][_in]': ids.slice(start, start + 50).join(','), limit: '50',
        fields: 'id,idOrganismeEquipe1,idOrganismeEquipe2,idEngagementEquipe1,idEngagementEquipe2,nomEquipe1,nomEquipe2',
      });
      if (!Array.isArray(rows)) throw new Error('Appartenance des rencontres FFBB invérifiable.');
      for (const row of rows) {
        if (!ids.includes(id(row)) || !id(row.idOrganismeEquipe1) || !id(row.idOrganismeEquipe2)) continue;
        if ([id(row.idOrganismeEquipe1), id(row.idOrganismeEquipe2)].includes(orgId)) owned.set(id(row), row);
        else foreignMatchIds.push(id(row));
      }
    }
    return { foreignMatchIds, owned };
  }

  async function get(path: string): Promise<Row> {
    const match = path.match(/^\/api\/v1\/(club|poule)\/([\w-]+)(?:\/(matches|teams))?(?:\?.*)?$/);
    try {
      if (!match) throw new Error('Route non prise en charge.');
      const [, kind, itemId, action] = match;
      if (kind === 'poule') return await poule(itemId);
      if (action === 'matches') return await calendar(itemId);
      const c = await club(itemId);
      if (action === 'teams') return { teams: c.engagements.map((e: Row) => ({
        engagement_id: id(e), team_number: e.numeroEquipe || '1',
        poule_id: id(e.idPoule), competition: e.idCompetition?.nom || '',
      })), source: 'ffbb_mobile' };
      return { ...c, source: 'ffbb_mobile' };
    } catch {
      // Keep the existing REST service as fallback. Never persist an API failure as empty data.
      const body = await read(`https://ffbb-api.desimone.fr${path}`);
      if (match?.[3] === 'matches') {
        if (!Array.isArray(body.matches)) throw new Error('Calendrier de secours FFBB invalide.');
        const c = await club(match[2]);
        const proof = await inspectMembership(match[2], body.matches.map((m: Row) => id(m.ffbbMatchId || m.id)));
        body.matches = body.matches.flatMap((m: Row) => {
          const row = proof.owned.get(id(m.ffbbMatchId || m.id));
          if (!row) return [];
          const home = id(row.idOrganismeEquipe1) === match[2];
          const e = c.engagements.find((e: Row) => id(e) === id(home ? row.idEngagementEquipe1 : row.idEngagementEquipe2));
          if (!e) return [];
          return [{ ...m, engagementId: id(e), team_number: e.numeroEquipe || '1', isHome: home, team: home ? row.nomEquipe1 : row.nomEquipe2,
            opponent: home ? row.nomEquipe2 : row.nomEquipe1, competition: e.idCompetition?.nom || '' }];
        });
        body.total = body.matches.length;
      }
      return { ...body, source: 'ffbb_api_desimone', degraded: true };
    }
  }
  return { get, resolveClub, inspectMembership };
}
