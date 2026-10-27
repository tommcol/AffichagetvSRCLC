/** Calendar calculations use the club's French wall clock, even on a UTC TV. */
export function clubCalendarDate(instant = new Date()): Date {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const n = (key: string) => Number(parts.find(p => p.type === key)?.value);
  return new Date(n('year'), n('month') - 1, n('day'), n('hour'), n('minute'), n('second'));
}

export function clubDateTimeTimestamp(date: string, time: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{1,2}:\d{2}$/.test(time)) return null;
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || minute > 59) return null;
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  const wall = clubCalendarDate(new Date(guess));
  const displayedUtc = Date.UTC(wall.getFullYear(), wall.getMonth(), wall.getDate(), wall.getHours(), wall.getMinutes());
  return guess - (displayedUtc - guess);
}
