/** Read-only mobile API fixtures shared by the existing cron regression tests. */
export function fixtureFfbbFetch(getRows: () => any[], competition: string, clubId = '999999'): typeof fetch {
  return async (input) => {
    const u = new URL(String(input));
    if (u.pathname === '/items/configuration') return Response.json({ data: { key_dh: 'fixture-only' } });
    if (u.pathname === '/items/ffbbserver_organismes') return Response.json({ data: [{ id: clubId }] });
    if (u.pathname.includes('ffbbserver_organismes/')) return Response.json({ data: {
      id: clubId, nom: 'CLUB EXEMPLE', engagements: [{ id: 'engagement', numeroEquipe: '1',
        idPoule: { id: 'poule' }, idCompetition: { nom: competition } }],
    } });
    if (u.pathname.includes('ffbbserver_rencontres')) {
      const ids = u.searchParams.get('filter[id][_in]')?.split(',');
      const rows = getRows().filter(r => !ids || ids.includes(String(r.ffbbMatchId))).map(r => ({
        id: r.ffbbMatchId, idPoule: 'poule',
        idOrganismeEquipe1: r.isHome === false ? '88' : clubId,
        idOrganismeEquipe2: r.isHome === false ? clubId : '88',
        idEngagementEquipe1: r.isHome === false ? 'other' : 'engagement',
        idEngagementEquipe2: r.isHome === false ? 'engagement' : 'other',
        nomEquipe1: r.isHome === false ? r.opponent : r.team,
        nomEquipe2: r.isHome === false ? r.team : r.opponent,
        date_rencontre: `${r.dateISO}T${r.time || '00:00'}:00`,
        resultatEquipe1: (r.isHome === false ? r.scoreOpponent : r.scoreLocal) ?? null,
        resultatEquipe2: (r.isHome === false ? r.scoreLocal : r.scoreOpponent) ?? null,
        salle: { libelle: r.location },
      }));
      return Response.json({ data: rows });
    }
    throw new Error(`Unexpected fixture request: ${u.pathname}`);
  };
}
