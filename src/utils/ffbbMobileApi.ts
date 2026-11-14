import { isAwaitingOfficialScore } from './ffbbMatchDays';
/** Server-only FFBB adapter. Uses the mobile API documented by ffbb-data-client
 * v2.4.42, while preserving the REST shapes consumed by our existing mappers.
 * Tokens remain in this request's closure: never persisted, logged or returned.
 */
const ORIGIN = 'https://api.ffbb.com/';
const MOBILE_AGENT = 'FFBB/1.6.7.42 Dalvik/2.1.0 (Linux; U; Android 5.1.1; Android SDK built for x86 Build/LMY48X)';
type Row = Record<string, any>;
const id = (v: any): string => String(v?.id ?? v ?? '');
const PAGE_SIZE = 500;

export function createFfbbDataSource(fetcher: typeof fetch = fetch, existingRows: Row[] = []) {
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
        if (!ids.includes(id(row))) continue;
        const sides = [row.idOrganismeEquipe1, row.idOrganismeEquipe2];
        if (sides.some(value => id(value) === orgId)) {
          owned.set(id(row), row);
        } else if (Object.hasOwn(row, 'idOrganismeEquipe1') && Object.hasOwn(row, 'idOrganismeEquipe2')
          && sides.every(value => value === null || /^\d+$/.test(id(value)))
          && sides.some(value => /^\d+$/.test(id(value)))) {
          // An explicit null means no club occupies that side (e.g. an exempt match).
          // A missing/unreadable field is still not proof that the match is foreign.
          foreignMatchIds.push(id(row));
        }
      }
    }
    return { foreignMatchIds, owned };
  }

  const mergedCalendars = new Map<string, Promise<Row>>();
  async function parallelCalendar(path: string, orgId: string): Promise<Row> {
    if (mergedCalendars.has(orgId)) return mergedCalendars.get(orgId)!;
    const pending = (async () => {
      const primary = calendar(orgId);
      const secondary = read(`https://ffbb-api.desimone.fr${path}`);
      const [a, b] = await Promise.allSettled([primary, secondary]);
      if (a.status === 'rejected' && b.status === 'rejected') throw new Error('Services FFBB indisponibles.');
      const main = a.status === 'fulfilled' ? a.value : undefined;
      const combined = new Map<string, Row>((main?.matches || []).map((m: Row) => [id(m.ffbbMatchId), m]));
      let secondaryAccepted = false;
      if (b.status === 'fulfilled' && Array.isArray(b.value.matches)) {
        try {
          const c = await club(orgId);
          const unknown = b.value.matches.filter((m: Row) => !combined.has(id(m.ffbbMatchId || m.id)));
          const proof = await inspectMembership(orgId, unknown.map((m: Row) => id(m.ffbbMatchId || m.id)));
          for (const m of b.value.matches) {
            const key = id(m.ffbbMatchId || m.id);
            const existing = combined.get(key);
            const row = proof.owned.get(key);
            const home = row && id(row.idOrganismeEquipe1) === orgId;
            const e = row && c.engagements.find((e: Row) => id(e) === id(home ? row.idEngagementEquipe1 : row.idEngagementEquipe2));
            if (!existing && (!row || !e)) continue;
            // Normalize scores into the official home/away pair before merging.
            const valid = (v: any) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
            const local = m.scoreLocal ?? m.score_local;
            const opponent = m.scoreOpponent ?? m.score_opponent;
            const isHome = existing?.isHome ?? home;
            const h = valid(local) && valid(opponent) ? (isHome ? local : opponent) : (m.resultatEquipe1 ?? m.scoreEquipe1 ?? m.score1);
            const v = valid(local) && valid(opponent) ? (isHome ? opponent : local) : (m.resultatEquipe2 ?? m.scoreEquipe2 ?? m.score2);
            if (existing) {
              if (!(valid(existing.scoreEquipe1) && valid(existing.scoreEquipe2)) && valid(h) && valid(v)) {
                combined.set(key, { ...existing, scoreEquipe1: Number(h), scoreEquipe2: Number(v), isPlayed: true });
              }
            } else {
              // Never trust club/category/orientation supplied by an unverified external row.
              combined.set(key, { ...m, ffbbMatchId: key, engagementId: id(e), team_number: e.numeroEquipe || '1',
                isHome, team: home ? row.nomEquipe1 : row.nomEquipe2, opponent: home ? row.nomEquipe2 : row.nomEquipe1,
                competition: e.idCompetition?.nom || '', scoreLocal: undefined, scoreOpponent: undefined,
                score_local: undefined, score_opponent: undefined,
                scoreEquipe1: valid(h) && valid(v) ? Number(h) : undefined, scoreEquipe2: valid(h) && valid(v) ? Number(v) : undefined });
            }
          }
          secondaryAccepted = true;
        } catch { /* Keep the verified official calendar if secondary verification fails. */ }
      }
      if (!main && !secondaryAccepted) throw new Error('Calendrier FFBB invérifiable ; données conservées.');
      // Poule lists can lag behind the individual official match record.
      // Read only started, unscored fixtures, with bounded concurrency. A failed
      // detail request leaves the calendar untouched for the next polling pass.
      const complete = (v: any) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v));
      const resolvedIds = new Set(existingRows.filter(m => m.isScoreManual || (complete(m.homeScore) && complete(m.awayScore)))
        .map(m => String(m.ffbbMatchNumber || m.id || '').replace(/^ffbb[-_]/i, '')));
      const pendingScores = [...combined.values()].filter(m => !resolvedIds.has(id(m.ffbbMatchId)) && isAwaitingOfficialScore({
        id: m.ffbbMatchId, date: m.dateISO, time: m.time, status: m.status,
        teamHome: m.isHome ? m.team : m.opponent, teamAway: m.isHome ? m.opponent : m.team,
        homeScore: m.scoreEquipe1, awayScore: m.scoreEquipe2,
      }));
      let detailCursor = 0;
      await Promise.all(Array.from({ length: Math.min(4, pendingScores.length) }, async () => {
        while (detailCursor < pendingScores.length) {
          const m = pendingScores[detailCursor++];
          try {
            const r = await official(`ffbbserver_rencontres/${encodeURIComponent(id(m.ffbbMatchId))}`, {
              fields: 'id,idOrganismeEquipe1,idOrganismeEquipe2,idEngagementEquipe1,idEngagementEquipe2,resultatEquipe1,resultatEquipe2',
            });
            const home = m.isHome === true;
            // Prove both identity and orientation before accepting the pair.
            if (id(r) !== id(m.ffbbMatchId)
              || id(home ? r.idOrganismeEquipe1 : r.idOrganismeEquipe2) !== orgId
              || id(home ? r.idEngagementEquipe1 : r.idEngagementEquipe2) !== id(m.engagementId)) continue;
            const valid = (v: any) => v !== null && v !== undefined && v !== '' && Number.isFinite(Number(v)) && Number(v) >= 0;
            if (!valid(r.resultatEquipe1) || !valid(r.resultatEquipe2)) continue;
            combined.set(id(m.ffbbMatchId), { ...m, scoreEquipe1: Number(r.resultatEquipe1),
              scoreEquipe2: Number(r.resultatEquipe2), isPlayed: true });
          } catch { /* No score is cleared; retry on the next synchronization. */ }
        }
      }));
      return { matches: [...combined.values()], total: combined.size, source: main ? 'ffbb_mobile' : 'ffbb_api_desimone',
        degraded: !main, secondaryAvailable: secondaryAccepted };
    })();
    mergedCalendars.set(orgId, pending);
    return pending;
  }

  async function get(path: string): Promise<Row> {
    const match = path.match(/^\/api\/v1\/(club|poule)\/([\w-]+)(?:\/(matches|teams))?(?:\?.*)?$/);
    if (match?.[1] === 'club' && match[3] === 'matches') return parallelCalendar(path, match[2]);
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
