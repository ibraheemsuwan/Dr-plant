/**
 * API base URL, set per environment with `VITE_API_URL` (Netlify env var / `.env.local`).
 * Local development falls back to the local backend; a production build without it fails loudly
 * instead of silently calling a stale tunnel.
 */
const LOCAL_DEV_API_BASE = "http://localhost:5274/api";

export function getApiBaseUrl(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (raw) return raw.replace(/\/$/, "");
  if (import.meta.env.DEV) return LOCAL_DEV_API_BASE;
  throw new Error(
    "VITE_API_URL is not set. Configure it in the hosting environment (e.g. https://api.example.com/api).",
  );
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
