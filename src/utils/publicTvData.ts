import type { AppDataPayload } from '../types';
import { clubCalendarDate } from './clubTime';
import { extractFirstName, filterAndSortBirthdaysForWeek } from './excelBirthdayParser';

export function publicTvData(data: AppDataPayload, today = clubCalendarDate()): AppDataPayload {
  const { clubSettings } = data;
  const settings = clubSettings && { ...clubSettings };
  if (settings) delete settings.socialWebhookUrl;
  const birthdays = filterAndSortBirthdaysForWeek(
    data.allMembers ?? data.birthdays ?? [],
    today,
  ).map((item, index) => {
    const firstName = item.firstName || extractFirstName(item.fullName || '');
    // The existing carousel accepts a day and month without a birth year.
    const [first, second, third] = item.birthDate.trim().split('T')[0].split(/[-/.]/).map(Number);
    const day = first > 1000 ? third : first;
    const month = second;
    const birthDate = day >= 1 && day <= 31 && month >= 1 && month <= 12 ? `${day}/${month}` : '';
    return {
      id: `tv-birthday-${index}`,
      fullName: firstName,
      firstName,
      birthDate,
      birthDayFormatted: item.birthDayFormatted,
      teamCategory: item.teamCategory,
      isThisWeek: true,
    };
  });
  return {
    clubSettings: settings,
    categories: data.categories,
    matches: data.matches,
    results: data.results,
    sponsors: data.sponsors,
    logos: data.logos,
    photos: data.photos,
    birthdays,
    events: data.events,
    teamVisuals: data.teamVisuals,
    visualTemplates: data.visualTemplates,
    version: data.version,
  };
}
