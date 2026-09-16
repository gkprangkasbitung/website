/** Returns the next Sunday (today if today is already Sunday) as YYYY-MM-DD. */
export function nextSundayIso(from: Date = new Date()): string {
  const date = new Date(from);
  const day = date.getDay();
  const daysUntilSunday = day === 0 ? 0 : 7 - day;
  date.setDate(date.getDate() + daysUntilSunday);
  return date.toISOString().slice(0, 10);
}

const TANGGAL_PANJANG_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** Formats a YYYY-MM-DD date as e.g. "Minggu, 14 September 2025". */
export function formatTanggalPanjang(tanggal: string): string {
  return TANGGAL_PANJANG_FORMATTER.format(new Date(`${tanggal}T00:00:00Z`));
}

const WAKTU_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Jakarta",
});

/** Formats an ISO timestamp as e.g. "14 Sep 2025, 09.30" in WIB. */
export function formatWaktu(iso: string): string {
  return `${WAKTU_FORMATTER.format(new Date(iso))} WIB`;
}
