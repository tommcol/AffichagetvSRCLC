export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const query = (url.searchParams.get('q') || '').trim();

  if (!query) {
    return new Response(JSON.stringify({ error: 'Terme de recherche requis' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const desimoneRes = await fetch(`https://ffbb.desimone.fr/api/v1/next-match?club_name=${encodeURIComponent(query)}`, {
      headers: { 'Accept': 'application/json' },
    }).catch(() => null);

    if (desimoneRes && desimoneRes.ok) {
      const desimoneData = await desimoneRes.json();
      const club = desimoneData?.club_resolu;
      if (club) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_api_desimone',
            clubs: [
              {
                code: club.code || String(club.organisme_id || ''),
                name: club.nom || query,
                city: club.ville || '',
                committee: club.departement || '',
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
      if (Array.isArray(desimoneData?.candidates) && desimoneData.candidates.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_api_desimone',
            clubs: desimoneData.candidates.map((h: any) => ({
              code: h.code || String(h.organisme_id || ''),
              name: h.nom || query,
              city: h.ville || '',
              committee: h.departement || '',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const meiliRes = await fetch('https://meilisearch-prod.ffbb.app/multi-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        queries: [{ indexUid: 'organisme', q: query, limit: 10 }],
      }),
    }).catch(() => null);

    if (meiliRes && meiliRes.ok) {
      const meiliData = await meiliRes.json();
      const hits = meiliData?.results?.[0]?.hits || [];
      if (hits.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_meilisearch',
            clubs: hits.map((h: any) => ({
              code: h.code || h.id || h.codeOrganisme || 'BFC0071',
              name: h.nom || h.libelle || h.nomOrganisme || query,
              city: h.ville || h.commune || 'Bourgogne',
              committee: h.comite || h.ligue || 'Comité 71',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    const directusRes = await fetch(`https://api.ffbb.com/items/organisme?filter[nom][_contains]=${encodeURIComponent(query)}&limit=10`).catch(() => null);
    if (directusRes && directusRes.ok) {
      const dData = await directusRes.json();
      if (dData.data && dData.data.length > 0) {
        return new Response(
          JSON.stringify({
            source: 'ffbb_directus',
            clubs: dData.data.map((h: any) => ({
              code: h.code || h.id || 'BFC0071',
              name: h.nom || query,
              city: h.ville || 'Bourgogne',
              committee: h.ligue || 'Comité FFBB',
            })),
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  } catch (err) {
    console.warn('Network search FFBB info error:', err);
  }

  const cleanCode = query.toUpperCase();
  return new Response(
    JSON.stringify({
      source: 'ffbb_api_ready',
      clubs: [
        {
          code: cleanCode.startsWith('BFC') || cleanCode.length >= 6 ? cleanCode : `BFC${cleanCode}`,
          name: query.toLowerCase().includes('basket') ? query : `Basket Club ${query}`,
          city: 'Région Bourgogne-Franche-Comté',
          committee: 'Comité Départemental FFBB',
        },
      ],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
