const TOKEN_KEY = "drplant_jwt";
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
  setStoredUserJson(null);
}
