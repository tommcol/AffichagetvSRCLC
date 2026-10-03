import {
  getBirthdayWeekState,
  getNextMondayDelayMs,
  hasBirthdayWeekChanged,
} from '../src/utils/birthdayWeekHelpers';

const monday = new Date('2026-09-28T00:00:00');
const tuesday = new Date('2026-09-29T12:00:00');

const state = getBirthdayWeekState([], monday);
if (!state.weekKey) throw new Error('week key failed');
if (state.birthdays.length !== 0) throw new Error('empty birthday calculation failed');
if (hasBirthdayWeekChanged(state.weekKey, tuesday)) throw new Error('same week detection failed');
if (getNextMondayDelayMs(monday) !== 7 * 24 * 60 * 60 * 1000) {
  throw new Error('next Monday delay failed');
}

console.log('birthday week helpers: 4/4 OK');
