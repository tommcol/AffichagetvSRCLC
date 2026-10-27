// ============================================================
// Légendes IA & publication réseaux sociaux
// ============================================================

import { Env } from './types';

// ============================================================
// RÉSEAUX SOCIAUX — légendes IA et passerelle webhook
// ============================================================

export async function generateCaption(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return new Response('Méthode non autorisée', { status: 405 });
  const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), {
    status, headers: { 'Content-Type': 'application/json' },
  });

  try {
    const body = await request.json() as any;
    const {
      platform = 'instagram', type = 'matches', matches = [], results = [],
      clubName = 'Notre Club', shortClub = 'Club', gymnasium = 'Gymnase du Club',
      tone = 'supporter', extraContext = '', provider = 'gemini',
    } = body;

    const matchesSummary = (matches || []).map((m: any) =>
      `- ${m.category || 'Équipe'} : ${m.isHomeMatch ? 'à Domicile vs ' + (m.teamAway || 'Adversaire') : "à l'Extérieur @ " + (m.teamHome || 'Adversaire')} le ${m.date || ''} à ${m.time || ''}`
    ).join('\\n');
    const resultsSummary = (results || []).map((r: any) =>
      `- ${r.category || 'Équipe'} : ${r.homeScore ?? 0} - ${r.awayScore ?? 0} (${r.result === 'win' ? 'Victoire 🏆' : 'Défaite ❌'}) vs ${r.isHomeMatch ? (r.teamAway || 'Adversaire') : (r.teamHome || 'Adversaire')}`
    ).join('\\n');

    const prompt = `Tu es le Community Manager passionné et créatif du club de basketball "${clubName}" (aussi appelé ${shortClub}).
Rédige une légende captivante, moderne et prête à publier sur "${String(platform).toUpperCase()}".

Contexte : ${type === 'matches' ? 'annonce des prochains matchs du week-end' : 'bilan et résultats des matchs passés'}.
Ton : ${tone === 'supporter' ? "survolté, très enthousiaste, esprit d'équipe 🔥" : tone === 'officiel' ? 'professionnel, chaleureux et institutionnel' : tone === 'fun' ? 'dynamique, jeune, punchy avec emojis ⚡' : "centré sur la buvette, l'ambiance et les supporters 🍿"}.

${type === 'matches' ? `Matchs du week-end (${matches.length} rencontres retenues) :\\n${matchesSummary || 'Matchs à venir du club'}\\nLieu principal à domicile : ${gymnasium}` : `Résultats des rencontres :\\n${resultsSummary || 'Résultats récents du club'}`}
${extraContext ? `Instructions supplémentaires du club : ${extraContext}` : ''}

Directives :
1. Structurer clairement avec des sections lisibles et des emojis attrayants.
2. Pour Instagram/Facebook, inclure une accroche, les rencontres/résultats et une incitation à venir encourager au gymnase ou à la buvette.
3. Pour TikTok, faire une version plus courte, dynamique et avec des hashtags pertinents.
4. Terminer par des hashtags pertinents pour le club.
Restitue uniquement la légende, sans guillemets ni méta-commentaires.`;

    const providers: Record<string, { key?: string; label: string }> = {
      mistral: { key: env.MISTRAL_API_KEY, label: 'Mistral' },
      openai: { key: env.OPENAI_API_KEY, label: 'OpenAI / ChatGPT' },
      claude: { key: env.ANTHROPIC_API_KEY, label: 'Anthropic / Claude' },
      gemini: { key: env.GEMINI_API_KEY, label: 'Google / Gemini' },
    };
    const selected = providers[String(provider)];
    if (!selected) return json({ success: false, error: 'FOURNISSEUR_INCONNU', message: "Fournisseur IA inconnu. Choisissez Mistral, ChatGPT, Claude ou Gemini." }, 400);
    if (!selected.key) {
      const secretName: Record<string, string> = {
        mistral: 'MISTRAL_API_KEY', openai: 'OPENAI_API_KEY',
        claude: 'ANTHROPIC_API_KEY', gemini: 'GEMINI_API_KEY',
      };
      return json({
        success: false, error: 'IA_NON_CONFIGUREE',
        message: `Le fournisseur ${selected.label} est sélectionné, mais son secret ${secretName[String(provider)]} n'est pas configuré dans Cloudflare Workers > Settings > Variables and Secrets.`,
      }, 503);
    }

    let captionText = '';
    if (provider === 'mistral' || provider === 'openai') {
      const endpoint = provider === 'mistral'
        ? 'https://api.mistral.ai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';
      const model = provider === 'mistral' ? 'mistral-small-latest' : 'gpt-4o-mini';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${selected.key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], temperature: 0.7 }),
      });
      const data = await response.json() as any;
      if (!response.ok) {
        console.error(`[${selected.label} API ERROR]`, response.status, data?.error?.message || data?.message || '');
        return json({ success: false, error: 'ECHEC_GENERATION_IA', message: `Impossible de générer le texte avec ${selected.label} (HTTP ${response.status}). Vérifiez la clé API, les autorisations et le quota.` }, 502);
      }
      captionText = data?.choices?.[0]?.message?.content?.trim() || '';
    } else if (provider === 'claude') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': selected.key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 900, messages: [{ role: 'user', content: prompt }] }),
      });
      const data = await response.json() as any;
      if (!response.ok) {
        console.error('[Anthropic API ERROR]', response.status, data?.error?.message || '');
        return json({ success: false, error: 'ECHEC_GENERATION_IA', message: `Impossible de générer le texte avec Claude (HTTP ${response.status}). Vérifiez la clé API, les autorisations et le quota.` }, 502);
      }
      captionText = Array.isArray(data?.content) ? data.content.filter((part: any) => part.type === 'text').map((part: any) => part.text).join('').trim() : '';
    } else {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(selected.key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 900 } }),
      });
      const data = await response.json() as any;
      if (!response.ok) {
        console.error('[Gemini API ERROR]', response.status, data?.error?.message || '');
        return json({ success: false, error: 'ECHEC_GENERATION_IA', message: `Impossible de générer le texte avec Gemini (HTTP ${response.status}). Vérifiez la clé API, les autorisations et le quota.` }, 502);
      }
      captionText = data?.candidates?.[0]?.content?.parts?.map((part: any) => part.text || '').join('').trim() || '';
    }

    if (!captionText) return json({ success: false, error: 'REPONSE_IA_VIDE', message: `L'IA ${selected.label} n'a pas fourni de texte. Réessayez.` }, 502);
    return json({ success: true, provider, caption: captionText });
  } catch (err: any) {
    console.error('[AI CAPTION ERROR]', err?.message || err);
    return json({ success: false, error: 'ECHEC_GENERATION_IA', message: "Une erreur est survenue pendant la génération du texte. Vérifiez la configuration du fournisseur IA puis réessayez." }, 502);
  }
}

export async function socialPublish(request: Request): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }
  try {
    const body = (await request.json()) as any;
    const { platform, type, title, caption, matches, results, webhookUrl } = body;
    if (webhookUrl && typeof webhookUrl === 'string' && webhookUrl.startsWith('http')) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'match_social_publish', platform: platform || 'all', type: type || 'matches',
            title: title || 'Publication Club', caption: caption || '',
            matchCount: matches ? matches.length : 0, resultCount: results ? results.length : 0,
            matches: matches || [], results: results || [], timestamp: Date.now(),
          }),
        });
        return new Response(
          JSON.stringify({
            success: true, forwardedToWebhook: true, status: response.status,
            message: `Transmis avec succès au Webhook externe (Code HTTP ${response.status})`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (fErr: any) {
        return new Response(
          JSON.stringify({
            success: false, forwardedToWebhook: true, error: fErr.message,
            message: `Échec d'envoi au Webhook : ${fErr.message}`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
    return new Response(
      JSON.stringify({
        success: true, forwardedToWebhook: false,
        message: `Contenu préparé avec succès pour ${platform || 'les réseaux sociaux'}`,
        data: { platform, type, title },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

// Diagnostic en lecture seule : données brutes d'un match (FFBB + stockage local).
