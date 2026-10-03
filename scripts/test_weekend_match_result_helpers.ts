import { ActiveMatchAlert, MatchItem } from '../src/types';
import {
  applyAlertToCurrentWeekendMatches,
  applyAlertsToCurrentWeekendMatches,
} from '../src/utils/weekendMatchResultHelpers';

const baseMatch: MatchItem = {
  id: 'match-1',
  date: '2026-10-03',
  time: '18:00',
  category: 'Seniors M1',
  competition: 'Départementale',
  teamHome: 'SRC Basket',
  teamAway: 'Adversaire',
  isHomeMatch: true,
  ourClubName: 'SRC Basket',
  gymnasium: 'Gymnase',
  city: 'La Clayette',
  status: 'upcoming',
  selectedForWeekend: true,
};

const alert: ActiveMatchAlert = {
  id: 'alert-1',
  team: 'Seniors M1',
  isWin: true,
  ourScore: 78,
  opponentScore: 65,
  opponent: 'Adversaire',
  triggeredBy: 'telegram',
  timestamp: Date.now(),
  expiresAt: Date.now() + 3600000,
};

const referenceDate = new Date('2026-10-03T12:00:00');

const updated = applyAlertToCurrentWeekendMatches([baseMatch], alert, referenceDate)[0];
if (updated.result !== 'win' || updated.status !== 'finished' || updated.homeScore !== 78 || updated.awayScore !== 65) {
  throw new Error('Le résultat Telegram n’est pas appliqué au match du week-end');
}

const outsideWeekend = { ...baseMatch, date: '2026-10-10' };
const unchanged = applyAlertToCurrentWeekendMatches([outsideWeekend], alert, referenceDate)[0];
if (unchanged.result !== undefined || unchanged.status !== 'upcoming') {
  throw new Error('Un match hors du week-end actuel a été modifié');
}

const withSecondAlert = applyAlertsToCurrentWeekendMatches(
  [baseMatch],
  [{ ...alert, isWin: false, ourScore: 61, opponentScore: 70 }],
  referenceDate
)[0];
if (withSecondAlert.result !== 'loss' || withSecondAlert.homeScore !== 61 || withSecondAlert.awayScore !== 70) {
  throw new Error('La défaite et le score ne sont pas appliqués');
}

console.log('weekend match result helpers: 3/3 OK');
