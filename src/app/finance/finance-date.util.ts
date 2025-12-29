/* Utilities to produce Cairo timezone boundaries using native Date and Intl.
   These make a best-effort using Intl.DateTimeFormat parts to compute Cairo-local
   year/month/day/hour/minute/second and then construct UTC timestamps that
   correspond to those local instants. */

function getCairoParts(date = new Date()) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const year = Number(map.year);
  const month = Number(map.month);
  const day = Number(map.day);
  const hour = Number(map.hour);
  const minute = Number(map.minute);
  const second = Number(map.second);
  return { year, month, day, hour, minute, second };
}

/** Return a Date representing the current instant computed from Cairo local components. */
export function getCairoNow(): Date {
  const { year, month, day, hour, minute, second } = getCairoParts(new Date());
  // Construct a UTC timestamp that corresponds to the Cairo local time parts
  const ms = Date.UTC(year, month - 1, day, hour, minute, second);
  return new Date(ms);
}

/** Convert a Date to ISO string. */
export function toISO(date: Date): string {
  return date.toISOString();
}

/** Return ISO range for today in Cairo: [fromISO, toISO). */
export function getCairoTodayRangeISO(): { fromISO: string; toISO: string } {
  const { year, month, day } = getCairoParts(new Date());
  const fromMs = Date.UTC(year, month - 1, day, 0, 0, 0);
  const toMs = fromMs + 24 * 60 * 60 * 1000;
  return { fromISO: new Date(fromMs).toISOString(), toISO: new Date(toMs).toISOString() };
}

/** Return ISO range for the current Cairo month: [fromISO, toISO). */
export function getCairoMonthRangeISO(): { fromISO: string; toISO: string } {
  const { year, month } = getCairoParts(new Date());
  const fromMs = Date.UTC(year, month - 1, 1, 0, 0, 0);
  const nextMonth = month === 12 ? { y: year + 1, m: 1 } : { y: year, m: month + 1 };
  const toMs = Date.UTC(nextMonth.y, nextMonth.m - 1, 1, 0, 0, 0);
  return { fromISO: new Date(fromMs).toISOString(), toISO: new Date(toMs).toISOString() };
}
