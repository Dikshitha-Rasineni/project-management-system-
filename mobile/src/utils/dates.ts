const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Calendar dates travel as "YYYY-MM-DD"; format without time-zone shifts. */
export function formatDate(value: string | null | undefined, fallback = '—', withYear = true): string {
  if (!value) return fallback;
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return fallback;
  return withYear ? `${d} ${MONTHS[m - 1]} ${y}` : `${d} ${MONTHS[m - 1]}`;
}

export function toIsoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

export function fromIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y!, (m ?? 1) - 1, d ?? 1);
}

export function daysUntil(value: string): number {
  const target = fromIsoDate(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function dueLabel(value: string | null, completed: boolean): { text: string; tone: 'muted' | 'warn' | 'late' } {
  if (!value) return { text: 'No due date', tone: 'muted' };
  if (completed) return { text: formatDate(value, '—', false), tone: 'muted' };
  const days = daysUntil(value);
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, tone: 'late' };
  if (days === 0) return { text: 'Due today', tone: 'warn' };
  if (days === 1) return { text: 'Due tomorrow', tone: 'warn' };
  if (days <= 7) return { text: `Due in ${days}d`, tone: 'muted' };
  return { text: formatDate(value, '—', false), tone: 'muted' };
}
