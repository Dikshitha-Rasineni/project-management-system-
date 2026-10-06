/**
 * Project/task dates are calendar dates (PostgreSQL DATE), not instants.
 * They travel over the API as "YYYY-MM-DD" strings so that no client time
 * zone can shift a due date by a day.
 */
export function toDateOnly(value: Date | null | undefined): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

/** Parses "YYYY-MM-DD" into a UTC-midnight Date (what Prisma stores in a DATE column). */
export function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

/** Today's date (UTC) as a UTC-midnight Date. */
export function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
