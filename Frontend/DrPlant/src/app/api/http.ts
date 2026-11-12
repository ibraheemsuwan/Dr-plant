import { buildApiUrl, isNgrokApiBase } from "./config";
import { ApiError } from "./errors";
import {
  getStoredToken,
  setStoredToken,
  clearAuthStorage,
} from "./tokenStorage";

export const UNAUTHORIZED_EVENT = "drplant-api-401";

type RequestOptions = RequestInit & { skipAuth?: boolean };

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { skipAuth, headers: initHeaders, ...rest } = options;
  const headers = new Headers(initHeaders);

  if (!skipAuth) {
    const token = getStoredToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const body = rest.body;
  if (body && !(body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isNgrokApiBase() && !headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "true");
  }

  const res = await fetch(buildApiUrl(path), { ...rest, headers });
  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text) as unknown;
    } catch {
      data = text;
    }
  }

  if (res.status === 401 && !skipAuth) {
    clearAuthStorage();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }

  return data as T;
}

export function apiGet<T>(path: string, init?: RequestOptions) {
  return apiFetch<T>(path, { ...init, method: "GET" });
}

export function apiPost<T>(path: string, body?: unknown, init?: RequestOptions) {
  return apiFetch<T>(path, {
    ...init,
    method: "POST",
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
}

export function apiPut<T>(path: string, body?: unknown, init?: RequestOptions) {
  return apiFetch<T>(path, {
    ...init,
    method: "PUT",
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown, init?: RequestOptions) {
  return apiFetch<T>(path, {
    ...init,
    method: "PATCH",
    body:
      body instanceof FormData
        ? body
        : body !== undefined
          ? JSON.stringify(body)
          : undefined,
  });
}

export function apiDelete<T>(path: string, init?: RequestOptions) {
  return apiFetch<T>(path, { ...init, method: "DELETE" });
}

export function persistToken(token: string | null) {
  setStoredToken(token);
}
