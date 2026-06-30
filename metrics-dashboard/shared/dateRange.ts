/** Monday 00:00:00 through Friday 23:59:59.999 of the previous calendar week (local time). */
export function getLastWeekWorkingDays(reference: Date = new Date()): { from: Date; to: Date } {
  const today = new Date(reference);
  today.setHours(0, 0, 0, 0);

  const dayOfWeek = today.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysFromMonday);

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  lastMonday.setHours(0, 0, 0, 0);

  const lastFriday = new Date(lastMonday);
  lastFriday.setDate(lastMonday.getDate() + 4);
  lastFriday.setHours(23, 59, 59, 999);

  return { from: lastMonday, to: lastFriday };
}

export function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function defaultDateRangeStrings(): { from: string; to: string } {
  const { from, to } = getLastWeekWorkingDays();
  return {
    from: formatDateInput(from),
    to: formatDateInput(to),
  };
}

export function parseDateParam(value: unknown, fallback: Date, endOfDay = false): Date {
  if (typeof value !== "string" || !value) {
    return fallback;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  if (endOfDay && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    parsed.setHours(23, 59, 59, 999);
  }

  return parsed;
}
