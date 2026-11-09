/** Default public API base. Override with `VITE_API_URL` in `.env.local`. */
export const DEFAULT_API_BASE =
  "https://symptom-remold-closable.ngrok-free.dev/api";

export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const s = (
    raw != null && String(raw).trim() !== "" ? String(raw) : DEFAULT_API_BASE
  ).replace(/\/$/, "");
  return s;
}

/** Ngrok free tunnels return an HTML interstitial unless this header is sent (fetch/XHR only). */
export function isNgrokApiBase(): boolean {
  return /ngrok-free\.(dev|app)|\.ngrok\.io|\.ngrok\.app/i.test(
    getApiBaseUrl(),
  );
}

/** Path like `/Posts` → full URL (base already includes `/api`). */
export function buildApiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}
