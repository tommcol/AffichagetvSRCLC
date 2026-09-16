import type { Context } from '@netlify/functions';

// Passerelle de publication réseaux sociaux : transmet le contenu vers un webhook
// externe configuré (Zapier, Make, n8n, ou un proxy Meta Graph API).

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  try {
    const body = await req.json();
    const { platform, type, title, caption, matches, results, webhookUrl } = body;

    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('http')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'match_social_publish',
            platform: platform || 'all',
            type: type || 'matches',
            title: title || 'Publication Club',
            caption: caption || '',
            matchCount: matches ? matches.length : 0,
            resultCount: results ? results.length : 0,
            matches: matches || [],
            results: results || [],
            timestamp: Date.now(),
          }),
        });
        return new Response(
          JSON.stringify({
            success: true,
            forwardedToWebhook: true,
            status: response.status,
            message: `Transmis avec succès au Webhook externe (Code HTTP ${response.status})`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fErr: any) {
        return new Response(
          JSON.stringify({
            success: false,
            forwardedToWebhook: true,
            error: fErr.message,
            message: `Échec d'envoi au Webhook : ${fErr.message}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        forwardedToWebhook: false,
        message: `Contenu préparé avec succès pour ${platform || 'les réseaux sociaux'}`,
        data: { platform, type, title },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
