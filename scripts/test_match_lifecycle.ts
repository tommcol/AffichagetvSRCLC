import { getMatchTimingStatus, isMatchFinished, isMatchLive } from '../src/utils/matchStatus';
import { mergeMatchItems } from '../src/utils/ffbbMergeUtils';

const makeMatch = (overrides: any = {}) => ({
  id: 'ffbb-123',
  date: '2026-10-10',
  time: '15:00',
  category: 'U11 F1',
  competition: 'Championnat',
  teamHome: 'SRC Basket La Clayette',
  teamAway: 'Club Adverse',
  isHomeMatch: true,
  ourClubName: 'SRC Basket La Clayette',
  gymnasium: 'COSEC',
  city: 'La Clayette',
  status: 'upcoming',
  ...overrides,
});

const before = new Date('2026-10-10T14:59:00');
const atStart = new Date('2026-10-10T15:00:00');
const exactlyTwoHours = new Date('2026-10-10T17:00:00');
const afterTwoHours = new Date('2026-10-10T17:01:00');

if (getMatchTimingStatus(makeMatch(), before) !== 'upcoming') throw new Error('upcoming lifecycle failed');
if (getMatchTimingStatus(makeMatch(), atStart) !== 'live') throw new Error('live lifecycle failed');
if (getMatchTimingStatus(makeMatch(), exactlyTwoHours) !== 'finished') throw new Error('2h boundary lifecycle failed');
if (getMatchTimingStatus(makeMatch(), afterTwoHours) !== 'finished') throw new Error('2h finish lifecycle failed');

const resultMatch = makeMatch({
  status: 'live',
  result: 'win',
  resultSource: 'telegram',
  resultReceivedAt: 1234,
  finishedAt: 1234,
  homeScore: 70,
  awayScore: 60,
});
if (!isMatchFinished(resultMatch, atStart) || isMatchLive(resultMatch, atStart)) {
  throw new Error('confirmed result lifecycle failed');
}

const ffbbIncoming = makeMatch({
  result: 'win',
  homeScore: 72,
  awayScore: 65,
  status: 'finished',
});
const merged = mergeMatchItems([resultMatch], [ffbbIncoming], {});
const updated = merged.find((m) => m.id === 'ffbb-123');
if (!updated) throw new Error('merge result not found');
if (updated.resultSource !== 'ffbb') throw new Error('FFBB source priority failed');
if (updated.homeScore !== 72 || updated.awayScore !== 65) throw new Error('FFBB score update failed');
if (updated.resultReceivedAt !== 1234 || updated.finishedAt !== 1234) {
  throw new Error('first result timestamps were restarted');
}
if (updated.status !== 'finished') throw new Error('FFBB result did not finish match');

const telegramOnly = makeMatch({
  status: 'finished',
  result: 'win',
  resultSource: 'telegram',
  resultReceivedAt: 2222,
  finishedAt: 2222,
  homeScore: 70,
  awayScore: 60,
});
const ffbbWithoutResult = makeMatch({ status: 'upcoming' });
const preserved = mergeMatchItems([telegramOnly], [ffbbWithoutResult], {}).find((m) => m.id === 'ffbb-123');
if (!preserved || preserved.resultSource !== 'telegram' || preserved.result !== 'win') {
  throw new Error('Telegram result was overwritten by FFBB without a result');
}

console.log('match lifecycle + result merge: 11/11 OK');
