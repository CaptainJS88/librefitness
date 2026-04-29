// Daily-log queries use local calendar days, not timestamps.
// This formatter builds YYYY-MM-DD directly from local date parts so timezone
// offsets do not shift the intended tracker day.
export function formatDateForDatabase(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
