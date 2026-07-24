// Deterministic formatting helpers. We slice the ISO string directly (UTC)
// rather than using Date/locale APIs so server and client render identically
// and there is no hydration mismatch.

/** "2026-07-23T14:02:00.000Z" -> "14:02:02" (HH:MM:SS, UTC). */
export function clockFromIso(iso: string): string {
  return iso.slice(11, 19);
}

/** "2026-07-23T14:02:00.000Z" -> "Jul 23, 14:02" (UTC). */
export function shortStampFromIso(iso: string): string {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[Number(iso.slice(5, 7)) - 1] ?? "";
  const day = String(Number(iso.slice(8, 10)));
  return `${month} ${day}, ${iso.slice(11, 16)}`;
}
