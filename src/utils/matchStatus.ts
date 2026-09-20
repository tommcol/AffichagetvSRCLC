import { MatchItem } from '../types';

/**
 * Détermine le statut temporel d'une rencontre :
 * - 'live' : l'heure du match est arrivée (et < 2h depuis le coup d'envoi)
 * - 'finished' : plus de 2h se sont écoulées depuis le coup d'envoi (si pas déjà validé)
 * - 'upcoming' : avant le coup d'envoi
 */
export function getMatchTimingStatus(
  match: MatchItem,
  now: Date = new Date()
): 'upcoming' | 'live' | 'finished' {
  if (match.status === 'finished') return 'finished';
  if (match.status === 'live') return 'live';

  if (!match.time) return 'upcoming';

  // Nettoyage de l'heure : "15:00", "15h30", "15H30", "15:00:00"
  const timeClean = match.time.toLowerCase().replace('h', ':').trim();
  const timeParts = timeClean.split(':');
  if (timeParts.length < 2) return 'upcoming';
  const matchHours = parseInt(timeParts[0], 10);
  const matchMinutes = parseInt(timeParts[1], 10);
  if (isNaN(matchHours) || isNaN(matchMinutes)) return 'upcoming';

  // Vérification de la date si renseignée
  if (match.date) {
    const nowYear = now.getFullYear();
    const nowMonth = now.getMonth(); // 0 à 11
    const nowDate = now.getDate(); // 1 à 31
    const nowDayOfWeek = now.getDay(); // 0 = Dimanche, 6 = Samedi

    let isToday = false;
    let isPastDate = false;
    const dateLower = match.date.toLowerCase();

    if (dateLower.includes("aujourd'hui") || dateLower.includes("ce jour") || dateLower.includes("today")) {
      isToday = true;
    } else if (dateLower.includes('dimanche') && nowDayOfWeek === 0) {
      isToday = true;
    } else if (dateLower.includes('samedi') && nowDayOfWeek === 6) {
      isToday = true;
    } else if (dateLower.includes('vendredi') && nowDayOfWeek === 5) {
      isToday = true;
    } else if (match.date.includes('-')) {
      const parts = match.date.split('-');
      if (parts.length >= 3) {
        let matchDateObj: Date | null = null;
        if (parts[0].length === 4) {
          // YYYY-MM-DD
          matchDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // DD-MM-YYYY
          matchDateObj = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        const todayStart = new Date(nowYear, nowMonth, nowDate).getTime();
        const matchStart = matchDateObj.getTime();
        if (matchStart === todayStart) {
          isToday = true;
        } else if (matchStart < todayStart) {
          isPastDate = true;
        }
      }
    } else if (match.date.includes('/')) {
      const parts = match.date.split('/');
      if (parts.length >= 2) {
        let matchDateObj: Date | null = null;
        if (parts[0].length === 4) {
          // YYYY/MM/DD
          matchDateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        } else {
          // DD/MM ou DD/MM/YYYY
          const y = parts.length > 2 ? parseInt(parts[2], 10) : nowYear;
          matchDateObj = new Date(y, parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        }
        const todayStart = new Date(nowYear, nowMonth, nowDate).getTime();
        const matchStart = matchDateObj.getTime();
        if (matchStart === todayStart) {
          isToday = true;
        } else if (matchStart < todayStart) {
          isPastDate = true;
        }
      }
    }

    if (isPastDate) {
      return 'finished';
    }
    if (!isToday) {
      return 'upcoming';
    }
  }

  // Vérification de la plage horaire aujourd'hui :
  // Coup d'envoi jusqu'à 2h (120 minutes) plus tard
  const startMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), matchHours, matchMinutes, 0, 0).getTime();
  const endMs = startMs + 120 * 60 * 1000; // 2 heures
  const currentMs = now.getTime();

  if (currentMs < startMs) {
    return 'upcoming';
  } else if (currentMs <= endMs) {
    return 'live';
  } else {
    // Au bout de 2h, passe en terminé automatiquement si pas de notif
    return 'finished';
  }
}

/**
 * Détermine si une rencontre est actuellement "En cours"
 */
export function isMatchLive(match: MatchItem, now: Date = new Date()): boolean {
  if (match.status === 'finished') return false;
  if (match.status === 'live') return true;
  return getMatchTimingStatus(match, now) === 'live';
}

/**
 * Détermine si une rencontre est terminée (explicitement ou après 2h écoulées)
 */
export function isMatchFinished(match: MatchItem, now: Date = new Date()): boolean {
  if (match.status === 'finished') return true;
  return getMatchTimingStatus(match, now) === 'finished';
}

/**
 * Détermine si notre club joue à domicile pour ce match
 */
export function isClubHomeMatch(
  match: MatchItem,
  clubName: string = 'Sports Réunis Clayettois',
  clubShortName: string = 'SRC Basket'
): boolean {
  if (typeof match.isHomeMatch === 'boolean') {
    return match.isHomeMatch;
  }
  const home = (match.teamHome || '').toLowerCase();
  const away = (match.teamAway || '').toLowerCase();
  const cName = (clubName || '').toLowerCase();
  const cShort = (clubShortName || '').toLowerCase();

  const isHomeClay =
    home.includes('clayette') ||
    home.includes('clayettois') ||
    (cName && home.includes(cName)) ||
    (cShort && home.includes(cShort));
  const isAwayClay =
    away.includes('clayette') ||
    away.includes('clayettois') ||
    (cName && away.includes(cName)) ||
    (cShort && away.includes(cShort));

  if (isHomeClay && !isAwayClay) return true;
  if (isAwayClay && !isHomeClay) return false;
  return true;
}

/**
 * Extrait le score de notre club et de l'adversaire
 */
export function getMatchOurAndOpponentScores(
  match: MatchItem,
  clubName?: string,
  clubShortName?: string
): { ourScore?: number; oppScore?: number; isHome: boolean } {
  const isHome = isClubHomeMatch(match, clubName, clubShortName);
  const ourScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;
  return { ourScore, oppScore, isHome };
}

/**
 * Détermine avec certitude si le match est une VICTOIRE ou une DÉFAITE pour notre club
 * (prend rigoureusement en compte si le match se joue à domicile ou à l'extérieur)
 */
export function isMatchWin(
  match: MatchItem,
  clubName?: string,
  clubShortName?: string
): boolean {
  const { ourScore, oppScore } = getMatchOurAndOpponentScores(match, clubName, clubShortName);
  if (ourScore !== undefined && oppScore !== undefined) {
    return ourScore > oppScore;
  }
  if (match.result === 'win') return true;
  if (match.result === 'loss') return false;
  return false;
}

