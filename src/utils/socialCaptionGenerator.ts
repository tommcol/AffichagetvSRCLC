import {
  MatchItem,
  ClubSettings,
  FinishedMatchNotification,
} from '../types';
import { isMatchWin } from './matchStatus';

export interface GenerateSocialCaptionsParams {
  contentType: 'matches' | 'results' | 'notification';
  badgeTitle: string;
  captionMatches: MatchItem[];
  captionResults: MatchItem[];
  captionStyleProposal: 'standard' | 'short' | 'hype';
  customCaptions: {
    instagram?: string;
    tiktok?: string;
    facebook?: string;
  };
  isCustomCaptionEdited: {
    instagram?: boolean;
    tiktok?: boolean;
    facebook?: boolean;
  };
  specificNotification?: FinishedMatchNotification | null;
  clubSettings: ClubSettings;
  safeShortName: string;
  safeClubName: string;
  safeGymnasium: string;
  formatMatchDate?: (dateStr?: string, timeStr?: string) => string;
}

export function isExemptItem(item?: { teamAway?: string; teamHome?: string; category?: string } | null): boolean {
  if (!item) return false;
  const away = (item.teamAway || '').toLowerCase();
  const home = (item.teamHome || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  return away.includes('exempt') || home.includes('exempt') || cat.includes('exempt');
}

function defaultFormatPosterMatchDate(dateStr?: string, timeStr?: string): string {
  const formattedTime = timeStr ? timeStr.replace(':', 'h') : '14h00';

  if (!dateStr || !dateStr.trim()) {
    return `Samedi | ${formattedTime}`;
  }

  const months = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
  ];
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

  const trimmed = dateStr.trim();

  try {
    const parts = trimmed.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        const dayName = days[d.getDay()];
        const monthName = months[d.getMonth()];
        return `${dayName} ${day} ${monthName} | ${formattedTime}`;
      }
    }
  } catch (e) {}

  return `${trimmed} | ${formattedTime}`;
}

export function generateSocialCaptions({
  contentType,
  badgeTitle,
  captionMatches,
  captionResults,
  captionStyleProposal,
  customCaptions,
  isCustomCaptionEdited,
  specificNotification,
  clubSettings,
  safeShortName,
  safeClubName,
  safeGymnasium,
  formatMatchDate = defaultFormatPosterMatchDate,
}: GenerateSocialCaptionsParams): {
  instagram: string;
  tiktok: string;
  facebook: string;
} {
  const clubTag = clubSettings?.instagramHandle || `@${safeShortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const fbTag = clubSettings?.facebookPage || safeClubName;

  if (contentType === 'matches') {
    const matchLinesStandard = captionMatches.map((m) => {
      const isExempt = isExemptItem(m);
      if (isExempt) return `⏸️ ${m.category || 'Équipe'} : EXEMPT ce week-end`;
      return `🏀 ${m.category || 'Équipe'} : ${m.isHomeMatch ? (m.teamHome || safeShortName) : (m.category || 'Équipe')} vs ${m.isHomeMatch ? (m.teamAway || 'Adversaire') : (m.teamHome || safeShortName)} (${formatMatchDate(m.date, m.time)})`;
    }).join('\n');

    const matchLinesShort = captionMatches.map((m) => {
      const isExempt = isExemptItem(m);
      if (isExempt) return `⏸️ ${m.category || 'Équipe'} : EXEMPT`;
      return `👉 ${m.category || 'Équipe'} - ${m.time || 'Horaire'} (${m.isHomeMatch ? 'DOM' : 'EXT'})`;
    }).join('\n');

    const matchLinesHype = captionMatches.map((m) => {
      const isExempt = isExemptItem(m);
      if (isExempt) return `⏸️ ${m.category || 'Équipe'} : Repos (EXEMPT)`;
      return `🔥 ${m.category || 'Équipe'} : ${m.isHomeMatch ? 'A DOMICILE 🏠' : 'A L\'EXTERIEUR 🚌'} vs ${m.isHomeMatch ? (m.teamAway || 'Adversaire') : (m.teamHome || safeShortName)} à ${m.time || '20h30'} !`;
    }).join('\n');

    let insta = '';
    let tiktok = '';
    let fb = '';

    if (captionStyleProposal === 'short') {
      insta = `⚡ AGENDA ${badgeTitle} | ${safeShortName.toUpperCase()} ⚡\n\n${matchLinesShort}\n\n📍 ${safeGymnasium}\nIdentifiez-nous : ${clubTag}\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Story #MatchDay`;
      tiktok = `⚡ Matchs du week-end ! 🏀👇\n\n${matchLinesShort}\n\n#fyp #pourtoi #basketball #${safeShortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      fb = `⚡ RAPPEL PROGRAMME DU WEEK-END [${badgeTitle}] ⚡\n\n${matchLinesShort}\n\nVenez encourager nos équipes au ${safeGymnasium} ! 🍿🏀\nAllez le ${safeShortName} !`;
    } else if (captionStyleProposal === 'hype') {
      insta = `🔴⚪ GAMEDAY ! TOUS ENSEMBLE AVEC LE ${safeShortName.toUpperCase()} ! 🔥🚨\n\nCe week-end, nos équipes ont besoin de VOS ENCOURAGEMENTS ! 🔥⚡\n\n${matchLinesHype}\n\nFaisons du bruit dans les tribunes ! 📣🔥 Buvette & snack sur place ! 🥤🍿\n\nIdentifiez-nous dans vos stories : ${clubTag} 📸\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #TousEnsemble #Gameday #Basketball #Supporters`;
      tiktok = `🔥 CE WEEK-END C'EST MATCHDAY ! 🚨 Qui vient faire du bruit en tribunes ? 📢⚡\n\n${matchLinesShort}\n\n#fyp #pourtoi #basketball #gameday #hype #${safeShortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      fb = `🔥 WEEK-END DE BASKETBALL ET DE PASSION ! 🏀\n\nNos équipes entrent en piste pour ${badgeTitle} ! Chers supporters, rendez-vous au ${safeGymnasium} pour pousser les rouges et blancs vers la victoire ! 💪🍿\n\n${matchLinesHype}\n\nAllez ${safeShortName} ! 🔴⚪\nPage officielle : ${fbTag}`;
    } else {
      insta = `🔥 PROGRAMME ${badgeTitle} | ${safeShortName.toUpperCase()} 🔥\n\nRetrouvez nos équipes sur les terrains ce week-end :\n\n${matchLinesStandard}\n\n📍 Soutenez nos couleurs au ${safeGymnasium} !\nBuvette & ambiance assurées ☕🍿\n\nIdentifiez-nous : ${clubTag} 📸\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #MatchDay #${(badgeTitle || '').replace(/\s+/g, '')} #Basketball #FFBB #BasketFrance`;
      tiktok = `🏀 Le programme ${badgeTitle} du week-end est là ! Qui vient au gymnase soutenir nos équipes ? 🔥⚡\n\n${matchLinesShort}\n\n#fyp #pourtoi #basketball #matchday #${safeShortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      fb = `🏀 PROGRAMME DU WEEK-END [${badgeTitle}] - ${safeClubName.toUpperCase()} 🏀\n\nChers supporters, voici le planning de nos rencontres :\n\n${matchLinesStandard}\n\nVenez nombreux encourager nos joueuses et joueurs !\n\nAllez le ${safeShortName} ! 🧡🖤\nPage officielle : ${fbTag}\n#Basketball #FFBB #${(badgeTitle || '').replace(/\s+/g, '')}`;
    }

    return {
      instagram: isCustomCaptionEdited.instagram ? (customCaptions.instagram ?? insta) : insta,
      tiktok: isCustomCaptionEdited.tiktok ? (customCaptions.tiktok ?? tiktok) : tiktok,
      facebook: isCustomCaptionEdited.facebook ? (customCaptions.facebook ?? fb) : fb,
    };
  }

  if (contentType === 'results') {
    const wins = captionResults.filter((r) => isMatchWin(r, safeClubName, safeShortName)).length;
    const total = captionResults.length;
    const resultLinesStandard = captionResults.map((r) => {
      const isWin = isMatchWin(r, safeClubName, safeShortName);
      return `${isWin ? '✅ VICTOIRE' : '❌ DÉFAITE'} [${r.category || 'Équipe'}] : ${r.teamHome || safeShortName} ${r.homeScore ?? ''} - ${r.awayScore ?? ''} ${r.teamAway || 'Adversaire'}`;
    }).join('\n');

    const resultLinesShort = captionResults.map((r) => {
      const isWin = isMatchWin(r, safeClubName, safeShortName);
      return `${isWin ? '✅' : '❌'} ${r.category || 'Équipe'} : ${r.homeScore ?? ''}-${r.awayScore ?? ''}`;
    }).join('\n');

    let insta = '';
    let tiktok = '';
    let fb = '';

    if (captionStyleProposal === 'short') {
      insta = `⚡ RÉSULTATS ${badgeTitle} | ${safeShortName.toUpperCase()} ⚡\n\nBilan : ${wins}/${total} victoires !\n\n${resultLinesShort}\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Resultats`;
      tiktok = `🏆 Bilan week-end : ${wins} victoires sur ${total} ! 🔥\n\n${resultLinesShort}\n\n#fyp #basketball #${safeShortName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      fb = `⚡ BILAN EXPRESS [${badgeTitle}] : ${wins} victoires / ${total} matchs !\n\n${resultLinesShort}\n\nMerci aux supporters ! 👏`;
    } else if (captionStyleProposal === 'hype') {
      insta = `🏆 QUEL WEEK-END POUR LE ${safeShortName.toUpperCase()} ! 🔥💪\n\nBilan : ${wins} victoires sur ${total} rencontres ! Gros travail de nos équipes et du staff 👏⚡\n\n${resultLinesStandard}\n\nUn grand MERCI à nos supporters et bénévoles en tribunes ! ❤️🖤\n\nIdentifiez-nous : ${clubTag}\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Victoire #Basketball #Supporters`;
      tiktok = `🏆 Gros bilans pour le club ! ${wins} victoires sur ${total} matchs 🔥💪 Quelle performance t'a le plus marqué ? Dis-le en commentaire ! 👇\n\n#fyp #pourtoi #basketball #victoire`;
      fb = `🏆 EXCELLENT BILAN DE RENCONTRES [${badgeTitle}] - ${safeClubName.toUpperCase()} 🏆\n\nFélicitations à tous nos joueurs et coachs pour ces résultats : ${wins} victoires sur ${total} matchs !\n\n${resultLinesStandard}\n\nMerci aux supporters pour l'ambiance au gymnase ! 🎉🍿\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Basketball`;
    } else {
      insta = `🏆 ${badgeTitle} | ${safeShortName.toUpperCase()} 🏆\n\nBilan : ${wins} victoires sur ${total} matchs ! Bravo à tous pour l'engagement. 👏🔥\n\n${resultLinesStandard}\n\nMerci aux supporters, coachs et bénévoles ! ❤️\n\nIdentifiez-nous : ${clubTag}\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Resultats #Victoire #Basketball #FFBB`;
      tiktok = `🏆 Les ${(badgeTitle || '').toLowerCase()} du week-end sont là ! ${wins} victoires au compteur 🔥💪 Quelle équipe t'a le plus impressionné ? 👇\n\n#fyp #pourtoi #basketball #resultats #victoire`;
      fb = `🏆 BILAN DES RENCONTRES [${badgeTitle}] - ${safeClubName.toUpperCase()} 🏆\n\nFélicitations à nos équipes pour ce week-end ! Bilan : ${wins} victoires sur ${total} matchs.\n\n${resultLinesStandard}\n\nMerci à nos bénévoles pour la buvette et la table de marque !\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #Basketball #ResultatsWeekend`;
    }

    return {
      instagram: isCustomCaptionEdited.instagram ? (customCaptions.instagram ?? insta) : insta,
      tiktok: isCustomCaptionEdited.tiktok ? (customCaptions.tiktok ?? tiktok) : tiktok,
      facebook: isCustomCaptionEdited.facebook ? (customCaptions.facebook ?? fb) : fb,
    };
  }

  const alert = specificNotification;
  const isWin = alert ? alert.isWin : true;
  const team = alert?.team || 'Seniors 1';
  const ourScore = alert?.ourScore ?? 78;
  const oppScore = alert?.opponentScore ?? 72;
  const opp = alert?.opponent || 'Adversaire';

  const insta = `${isWin ? '🚨 VICTOIRE ÉCLATANTE ! 🏆' : '🚨 FIN DU MATCH ! 🏀'}\n\nScore final : ${team} ${ourScore} - ${oppScore} ${opp} !\n${isWin ? 'Bravo à toute l’équipe pour cette belle performance !' : 'Gros combat sur le terrain, on se remobilise pour le prochain match !'}\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #BasketFrance #FFBB`;
  const tiktok = `${isWin ? '🏆 VICTOIRE !!' : '🏀 Fin de match !'} ${team} l'emporte ${ourScore}-${oppScore} contre ${opp} ! 🔥⚡ #fyp #pourtoi #basketball #victoire`;
  const fb = `${isWin ? '🏆 VICTOIRE DE NOTRE ÉQUIPE ! 🏆' : '🏀 RÉSULTAT DE LA RENCONTRE 🏀'}\n\n${team} ${ourScore} - ${oppScore} ${opp} !\nFélicitations aux joueurs et au staff.\n\n#${safeShortName.replace(/[^a-zA-Z0-9]/g, '')} #FFBB #Basketball`;

  return {
    instagram: isCustomCaptionEdited.instagram ? (customCaptions.instagram ?? insta) : insta,
    tiktok: isCustomCaptionEdited.tiktok ? (customCaptions.tiktok ?? tiktok) : tiktok,
    facebook: isCustomCaptionEdited.facebook ? (customCaptions.facebook ?? fb) : fb,
  };
}
