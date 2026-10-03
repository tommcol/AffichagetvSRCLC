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

const namesMatch = (left?: string, right?: string): boolean => {
  const a = normalizeMatchName(left);
  const b = normalizeMatchName(right);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
};

const alertMatchesWeekendMatch = (alert: ActiveMatchAlert, match: MatchItem): boolean => {
  if (alert.matchId && alert.matchId === match.id) return true;

  const alertTeam = alert.team || alert.ourTeam || alert.category;
  const clubSide = match.isHomeMatch ? match.teamHome : match.teamAway;
  const opponentSide = match.isHomeMatch ? match.teamAway : match.teamHome;

  const teamMatches =
    namesMatch(alertTeam, clubSide) ||
    namesMatch(alertTeam, match.category) ||
    namesMatch(alertTeam, match.ourClubName);

  if (!teamMatches) return false;

  if (alert.opponent && !namesMatch(alert.opponent, opponentSide)) {
    return false;
  }

  return true;
};

const getMatchLifecycleStatus = (match: MatchItem, referenceDate: Date): MatchItem['status'] => {
  const start = new Date(`${match.date}T${match.time || '00:00'}:00`);
  if (Number.isNaN(start.getTime())) return match.status;

  const end = start.getTime() + 2 * 60 * 60 * 1000;
  const now = referenceDate.getTime();

  if (now < start.getTime()) return 'upcoming';
  if (now < end) return 'live';
  return 'finished';
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
      status: getMatchLifecycleStatus(match, referenceDate),
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