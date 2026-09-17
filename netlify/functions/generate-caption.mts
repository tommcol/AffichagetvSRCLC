import type { Context } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';

// Génère une légende réseaux sociaux via l'IA Gemini, avec repli local si la clé
// GEMINI_API_KEY n'est pas configurée ou si l'appel échoue.

export default async (req: Request, _context: Context) => {
  if (req.method !== 'POST') {
    return new Response('Méthode non autorisée', { status: 405 });
  }

  try {
    const body = await req.json();
    const {
      platform = 'instagram',
      type = 'matches',
      matches = [],
      results = [],
      clubName = 'Notre Club',
      shortClub = 'Club',
      gymnasium = 'Gymnase du Club',
      tone = 'supporter',
      extraContext = '',
    } = body;

    const matchesSummary = (matches || []).map((m: any) =>
      `- ${m.category || 'Équipe'} : ${m.isHomeMatch ? 'à Domicile vs ' + (m.teamAway || 'Adversaire') : 'à l\'Extérieur @ ' + (m.teamHome || 'Adversaire')} le ${m.date || ''} à ${m.time || ''}`
    ).join('\n');

    const resultsSummary = (results || []).map((r: any) =>
      `- ${r.category || 'Équipe'} : ${r.homeScore ?? 0} - ${r.awayScore ?? 0} (${r.result === 'win' ? 'Victoire 🏆' : 'Défaite ❌'}) vs ${r.isHomeMatch ? (r.teamAway || 'Adversaire') : (r.teamHome || 'Adversaire')}`
    ).join('\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Tu es le Community Manager passionné et créatif du club de basketball "${clubName}" (Aussi appelé ${shortClub}).
Rédige une légende captivante, moderne et prête à être publiée sur le réseau social "${platform.toUpperCase()}".

Contexte du post : ${type === 'matches' ? 'Annonce des prochains matchs du week-end' : 'Bilan et résultats des matchs passés'}.
Ton souhaité : ${tone === 'supporter' ? "Survolté, très enthousiaste, esprit d'équipe 🔥" : tone === 'officiel' ? 'Professionnel, chaleureux et institutionnel 🏛️' : tone === 'fun' ? 'Dynamique, jeune, punchy avec emojis ⚡' : "Centré sur la buvette, l'ambiance et les supporters 🍿"}.

${type === 'matches' ? `Matchs du week-end (${matches.length} rencontres retenues) :\n${matchesSummary || 'Matchs à venir du club'}\nLieu principal domicile : ${gymnasium}` : `Résultats des rencontres :\n${resultsSummary || 'Résultats récents du club'}`}
${extraContext ? `Instructions supplémentaires du club : ${extraContext}` : ''}

Directives :
1. Structurer clairement avec des sections lisibles et des emojis attrayants.
2. Pour Instagram / Facebook, inclure une accroche percutante, la liste des rencontres/résultats, une incitation à venir encourager au gymnase / à la buvette.
3. Pour TikTok, faire une version plus courte, dynamique et avec des hashtags tendance (#basketball #matchday #fyp etc.).
4. Terminer par des hashtags pertinents pour le club.
Restitue uniquement le texte de la légende rédigé, sans guillemets ni meta-commentaires.`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: prompt,
        });

        const captionText = response.text?.trim();
        if (captionText) {
          return new Response(
            JSON.stringify({ success: true, provider: 'gemini', caption: captionText }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (geminiErr: any) {
        console.warn('[GEMINI API WARNING] Fallback local utilisé :', geminiErr.message);
      }
    }

    let generatedCaption = '';
    if (type === 'matches') {
      const matchCount = (matches || []).length;
      if (platform === 'tiktok') {
        generatedCaption = `⚡ WEEK-END DE BASKET INTENSE POUR ${shortClub.toUpperCase()} ! 🏀🔥\n${matchCount} matchs au programme ce week-end ! Qui vient faire chauffer la salle ? 🥁💥\n\n#basketball #matchday #bball #fyp #pourtoi #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else if (tone === 'officiel') {
        generatedCaption = `🏀 PROGRAMME OFFICIEL DES RENCONTRES • ${clubName.toUpperCase()} 🏀\n\nNous vous présentons l'ensemble des matchs programmés pour le week-end :\n\n${matchesSummary || 'Rencontres à venir'}\n\n📍 Gymnase : ${gymnasium}\nNous comptons sur votre présence pour soutenir nos joueuses et joueurs ! 🔴⚪\n\n#Basketball #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🔥 WEEK-END CHAUD BOUILLANT CHEZ LES ${shortClub.toUpperCase()} ! 🔥\n\nPréparez les tambours et les maillots, voici les ${matchCount} matchs clés sélectionnés du week-end !\n\n${matchesSummary || 'Prochaines rencontres'}\n\n🍿 Buvette & petite restauration assurées au ${gymnasium} !\nAllez ${shortClub} ! ❤️🤍\n\n#GameDay #MatchWeek #TeamBasket #FFBB #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    } else {
      if (platform === 'tiktok') {
        generatedCaption = `🏆 BILAN DU WEEK-END DE ${shortClub.toUpperCase()} ! 🏀\nVoici les scores de nos équipes ! Laisse un ❤️ pour féliciter nos joueurs !\n\n#resultats #basket #victoire #fyp #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      } else {
        generatedCaption = `🏆 RÉSULTATS & BILAN DU WEEK-END — ${clubName.toUpperCase()} 🏆\n\nVoici le résumé complet des rencontres du week-end :\n\n${resultsSummary || 'Résultats récents'}\n\nUn grand bravo à toutes nos équipes, coachs et supporters pour leur ferveur ! 👏🔥\n\n#Résultats #Basket #TeamWork #${shortClub.replace(/[^a-zA-Z0-9]/g, '')}`;
      }
    }

    return new Response(
      JSON.stringify({ success: true, provider: 'smart_local_generator', caption: generatedCaption }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
