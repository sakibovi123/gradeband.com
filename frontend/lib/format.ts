import { API_URL } from "./api";

/** Format a band score with one decimal (e.g. 7 -> "7.0"). */
export function fmtBand(band: number | null | undefined): string {
  if (band == null) return "—";
  return band.toFixed(1);
}

/** Days from now until a date (floored at 0). Null if no date. */
export function daysUntil(dateIso: string | null | undefined): number | null {
  if (!dateIso) return null;
  const ms = new Date(dateIso).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function fmtDate(dateIso: string | null | undefined): string {
  if (!dateIso) return "—";
  return new Date(dateIso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Prefix a backend-relative audio URL with the API origin. */
export function audioSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

/** Count words in a string (for the writing editor). */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
