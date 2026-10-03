import { ActiveMatchAlert, MatchItem } from '../types';

const normalizeMatchName = (value?: string): string =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const getCurrentWeekendBounds = (referenceDate = new Date()): { start: Date; end: Date } => {
  const date = new Date(referenceDate);
  const day = date.getDay();
  const fridayOffset = day === 0 ? -2 : 5 - day;
  const start = new Date(date);
  start.setDate(date.getDate() + fridayOffset);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 2);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

const isCurrentWeekendMatch = (match: MatchItem, referenceDate: Date): boolean => {
  if (match.selectedForWeekend === false) return false;
  const { start, end } = getCurrentWeekendBounds(referenceDate);
  const matchDate = new Date(match.date + 'T12:00:00');
  return !Number.isNaN(matchDate.getTime()) && matchDate >= start && matchDate <= end;
};

const alertMatchesWeekendMatch = (alert: ActiveMatchAlert, match: MatchItem): boolean => {
  if (alert.matchId && alert.matchId === match.id) return true;

  const alertTeam = normalizeMatchName(alert.team || alert.category);
  const matchCategory = normalizeMatchName(match.category);
  const opponent = normalizeMatchName(alert.opponent);
  const matchOpponent = normalizeMatchName(match.isHomeMatch ? match.teamAway : match.teamHome);

  if (!alertTeam || !matchCategory || alertTeam !== matchCategory) return false;
  if (opponent && matchOpponent && !opponent.includes(matchOpponent) && !matchOpponent.includes(opponent)) {
    return false;
  }
  return true;
};

export const applyAlertToCurrentWeekendMatches = (
  matches: MatchItem[],
  alert: ActiveMatchAlert,
  referenceDate = new Date()
): MatchItem[] =>
  matches.map((match) => {
    if (!isCurrentWeekendMatch(match, referenceDate) || !alertMatchesWeekendMatch(alert, match)) {
      return match;
    }

    const ourScore = alert.ourScore;
    const opponentScore = alert.opponentScore;
    const homeScore = match.isHomeMatch ? ourScore : opponentScore;
    const awayScore = match.isHomeMatch ? opponentScore : ourScore;

    return {
      ...match,
      status: 'finished',
      result: alert.isWin ? 'win' : 'loss',
      ...(homeScore !== undefined ? { homeScore } : {}),
      ...(awayScore !== undefined ? { awayScore } : {}),
      finishedAt: alert.timestamp,
    };
  });

export const applyAlertsToCurrentWeekendMatches = (
  matches: MatchItem[],
  alerts: ActiveMatchAlert[],
  referenceDate = new Date()
): MatchItem[] =>
  alerts.reduce(
    (currentMatches, alert) => applyAlertToCurrentWeekendMatches(currentMatches, alert, referenceDate),
    matches
  );