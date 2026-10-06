/**
 * The API sends calendar dates as "YYYY-MM-DD". They are formatted in UTC so
 * the browser's time zone can never shift a due date by a day.
 */
const dateFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const shortFmt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function formatDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = new Date(value.length === 10 ? `${value}T00:00:00Z` : value);
  return Number.isNaN(d.getTime()) ? fallback : dateFmt.format(d);
}

export function formatShortDate(value: string | null | undefined, fallback = '—'): string {
  if (!value) return fallback;
  const d = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? fallback : shortFmt.format(d);
}

/** Today's local calendar date as YYYY-MM-DD. */
export function todayIso(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** Whole days from today until the date (negative = in the past). */
export function daysUntil(value: string): number {
  const target = Date.parse(`${value}T00:00:00Z`);
  const today = Date.parse(`${todayIso()}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}

export function dueLabel(value: string | null, completed: boolean): { text: string; tone: 'muted' | 'warn' | 'late' } {
  if (!value) return { text: 'No due date', tone: 'muted' };
  if (completed) return { text: formatShortDate(value), tone: 'muted' };
  const days = daysUntil(value);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'warn' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warn' };
  if (days <= 7) return { text: `Due in ${days}d`, tone: 'muted' };
  return { text: formatShortDate(value), tone: 'muted' };
}
