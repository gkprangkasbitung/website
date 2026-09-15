/** Returns the next Sunday (today if today is already Sunday) as YYYY-MM-DD. */
export function nextSundayIso(from: Date = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  return date.toISOString().slice(0, 10);
}
