import { BirthdayItem } from '../types';
import { filterAndSortBirthdaysForWeek, getWeekBounds, getWeekKey } from './excelBirthdayParser';

export const getBirthdaysForReferenceDate = (
  members: BirthdayItem[],
  referenceDate: Date
): BirthdayItem[] =>
  members.length > 0 ? filterAndSortBirthdaysForWeek(members, referenceDate, 0) : [];

export const getNextMondayDelayMs = (referenceDate: Date): number => {
  const { monday } = getWeekBounds(referenceDate, 1);
  return Math.max(0, monday.getTime() - referenceDate.getTime());
};

export const getBirthdayWeekState = (
  members: BirthdayItem[],
  referenceDate: Date
) => ({
  weekKey: getWeekKey(referenceDate),
  birthdays: getBirthdaysForReferenceDate(members, referenceDate),
});

export const hasBirthdayWeekChanged = (
  currentWeekKey: string,
  referenceDate: Date
): boolean => getWeekKey(referenceDate) !== currentWeekKey;
