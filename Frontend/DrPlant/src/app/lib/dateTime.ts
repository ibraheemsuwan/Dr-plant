/** Palestine (West Bank / Gaza) — Asia/Hebron */
export const PALESTINE_TIME_ZONE = "Asia/Hebron";

type AppLanguage = "ar" | "en";

function localeFor(language: AppLanguage): string {
  return language === "ar" ? "ar-PS" : "en-GB";
}

/** 12-hour clock with ص/م (ar) or AM/PM (en). */
const TIME_12: Intl.DateTimeFormatOptions = {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
};

/**
 * API/MySQL often returns UTC instants without a `Z` suffix.
 * Treat naive ISO strings as UTC, then format in Palestine time.
 */
export function parseApiDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(raw)) {
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const withoutMs = normalized.replace(/(\.\d{3})\d+/, "$1");
  const d = new Date(`${withoutMs}Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatPalestineDate(
  value: string | Date | null | undefined,
  language: AppLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseApiDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: PALESTINE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  }).format(d);
}

export function formatPalestineTime(
  value: string | Date | null | undefined,
  language: AppLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseApiDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: PALESTINE_TIME_ZONE,
    ...TIME_12,
    ...options,
  }).format(d);
}

export function formatPalestineDateTime(
  value: string | Date | null | undefined,
  language: AppLanguage,
  options?: Intl.DateTimeFormatOptions,
): string {
  const d = parseApiDate(value);
  if (!d) return "";
  return new Intl.DateTimeFormat(localeFor(language), {
    timeZone: PALESTINE_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
    ...TIME_12,
    ...options,
  }).format(d);
}
