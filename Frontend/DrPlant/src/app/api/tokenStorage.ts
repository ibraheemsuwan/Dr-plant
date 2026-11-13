import type { StoredLoginSession } from "./types";

const TOKEN_KEY = "drplant_jwt";
const LOGIN_SESSION_KEY = "drplant_login_session";
/** Legacy user blob — cleared on logout. */
const USER_KEY = "drplant_auth_user";

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

export function getStoredLoginSession(): StoredLoginSession | null {
  try {
    const raw = localStorage.getItem(LOGIN_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLoginSession>;
    if (
      typeof parsed.token !== "string" ||
      !parsed.token ||
      typeof parsed.email !== "string" ||
      !parsed.email.trim() ||
      typeof parsed.role !== "string"
    ) {
      return null;
    }
    return {
      token: parsed.token,
      email: parsed.email.trim(),
      name:
        typeof parsed.name === "string" && parsed.name.trim()
          ? parsed.name.trim()
          : (parsed.email.split("@")[0] ?? parsed.email),
      role: parsed.role.trim().toLowerCase(),
    };
  } catch {
    return null;
  }
}

export function setStoredLoginSession(
  session: StoredLoginSession | null,
): void {
  try {
    if (!session) localStorage.removeItem(LOGIN_SESSION_KEY);
    else localStorage.setItem(LOGIN_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function getStoredUserJson(): string | null {
  try {
    return localStorage.getItem(USER_KEY);
  } catch {
    return null;
  }
}

export function setStoredUserJson(json: string | null): void {
  try {
    if (!json) localStorage.removeItem(USER_KEY);
    else localStorage.setItem(USER_KEY, json);
  } catch {
    /* ignore */
  }
}

export function clearAuthStorage(): void {
  setStoredToken(null);
  setStoredLoginSession(null);
  setStoredUserJson(null);
}
