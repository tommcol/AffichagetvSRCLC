import { MatchItem } from '../types';

/**
 * Normalise un identifiant ou numéro de match FFBB en supprimant les préfixes "ffbb-" et "FFBB-"
 * Ex: "FFBB-12345" -> "12345", "ffbb-12345" -> "12345", "ffbb-FFBB-12345" -> "12345"
 */
export function normalizeFfbbNumber(raw?: string): string | null {
  if (!raw) return null;
  let clean = String(raw).trim();
  if (!clean) return null;
  while (/^ffbb-/i.test(clean)) {
    clean = clean.replace(/^ffbb-/i, '').trim();
  }
  return clean ? clean.toLowerCase() : null;
}

/**
 * Extrait la clé FFBB normalisée et stable pour un MatchItem
 */
export function getFfbbKey(m: MatchItem): string | null {
  if (m.ffbbMatchNumber) {
    const num = normalizeFfbbNumber(m.ffbbMatchNumber);
    if (num) return `ffbb-${num}`;
  }
  if (m.id && /^ffbb-/i.test(m.id)) {
    const num = normalizeFfbbNumber(m.id);
    if (num) return `ffbb-${num}`;
  }
  return null;
}

/**
 * Fusionne intelligemment une liste de rencontres existantes avec une nouvelle liste venant de la FFBB.
 * Les données officielles FFBB (compétition, poule, ville, etc.) sont actualisées
 * sauf si l'utilisateur a explicitement modifié le champ concerné dans l'application.
 */
export function mergeMatchItems(existingList: MatchItem[], incomingList: MatchItem[]): MatchItem[] {
  const incomingFfbbMap = new Map<string, MatchItem>();
  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key) {
      incomingFfbbMap.set(key, inc);
    }
  });

  const merged: MatchItem[] = [];
  const processedFfbbKeys = new Set<string>();

  // 1. Parcourir les rencontres existantes
  existingList.forEach((existing) => {
    const key = getFfbbKey(existing);

    // Si c'est un match amical / local ou non présent dans cette réponse FFBB :
    if (!key || !incomingFfbbMap.has(key)) {
      merged.push(existing);
      if (key) processedFfbbKeys.add(key);
      return;
    }

    // Rencontre FFBB correspondante trouvée
    processedFfbbKeys.add(key);
    const incoming = incomingFfbbMap.get(key)!;

    // Date & Heure : mettre à jour avec FFBB sauf si modifiés manuellement
    const finalDate = existing.isDateManual ? existing.date : (incoming.date || existing.date);
    const finalTime = existing.isTimeManual ? existing.time : (incoming.time || existing.time);

    // Gymnase : mettre à jour avec FFBB sauf si modifié manuellement
    const finalGymnasium = existing.isGymnasiumManual
      ? existing.gymnasium
      : (incoming.gymnasium || existing.gymnasium);

    // Logo adverse : préserver le logo sélectionné manuellement ou existant
    const finalOpponentLogo = existing.isOpponentLogoManual || existing.opponentLogo
      ? existing.opponentLogo
      : incoming.opponentLogo;

    // Score : préserver le score si saisi/corrigé manuellement ou en conflit local
    let finalHomeScore = incoming.homeScore;
    let finalAwayScore = incoming.awayScore;
    let finalResult = incoming.result;
    let finalStatus = incoming.status;
    let finalIsScoreManual = existing.isScoreManual;

    if (existing.isScoreManual) {
      // Score saisi/modifié manuellement -> conserver le score local
      finalHomeScore = existing.homeScore;
      finalAwayScore = existing.awayScore;
      finalResult = existing.result;
      finalStatus = existing.status || incoming.status;
    } else if (existing.homeScore !== undefined) {
      if (incoming.homeScore === undefined) {
        // FFBB n'a pas encore de score, conserver le score local existant
        finalHomeScore = existing.homeScore;
        finalAwayScore = existing.awayScore;
        finalResult = existing.result;
      } else if (existing.homeScore !== incoming.homeScore || existing.awayScore !== incoming.awayScore) {
        // Conflit entre score local enregistré et score FFBB -> préserver le score local et marquer comme manuel
        finalHomeScore = existing.homeScore;
        finalAwayScore = existing.awayScore;
        finalResult = existing.result;
        finalIsScoreManual = true;
      }
    }

    // Choix individuel de diffusion TV (selectedForWeekend) : TOUJOURS conserver le choix utilisateur
    const finalSelectedForWeekend = existing.selectedForWeekend !== undefined
      ? existing.selectedForWeekend
      : (incoming.selectedForWeekend !== false);

    // On part des données entrantes OFFICIELLES (pour actualiser compétition, poule, ville, etc.)
    // et on applique les surcharges et protections locales
    merged.push({
      ...incoming,
      id: existing.id || incoming.id,
      ffbbMatchNumber: incoming.ffbbMatchNumber || existing.ffbbMatchNumber,
      date: finalDate,
      time: finalTime,
      gymnasium: finalGymnasium,
      homeScore: finalHomeScore,
      awayScore: finalAwayScore,
      result: finalResult,
      status: finalStatus,
      opponentLogo: finalOpponentLogo,
      teamLogo: existing.teamLogo || incoming.teamLogo,
      selectedForWeekend: finalSelectedForWeekend,
      isDateManual: existing.isDateManual,
      isTimeManual: existing.isTimeManual,
      isScoreManual: finalIsScoreManual,
      isGymnasiumManual: existing.isGymnasiumManual,
      isOpponentLogoManual: existing.isOpponentLogoManual,
      isManualMatch: existing.isManualMatch,
    });
  });

  // 2. Ajouter les nouvelles rencontres FFBB reçues
  incomingList.forEach((inc) => {
    const key = getFfbbKey(inc);
    if (key && !processedFfbbKeys.has(key)) {
      merged.push({
        ...inc,
        selectedForWeekend: inc.selectedForWeekend !== false,
      });
      processedFfbbKeys.add(key);
    }
  });

  return merged;
}
