import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isAdminEmail } from "../config/adminEmails";
import * as authService from "../api/services/authService";
import * as usersService from "../api/services/usersService";
import {
  clearAuthStorage,
  getStoredToken,
  getStoredUserJson,
  setStoredUserJson,
} from "../api/tokenStorage";
import { hydrateAuthUserIdFromToken, mapUserDto } from "../api/mappers";
import type { AuthUser } from "../api/types";
import { getErrorMessage } from "../api/errors";

export const DRPLANT_AUTH_CHANGED_EVENT = "drplant-auth-changed";

function emitAuthChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_AUTH_CHANGED_EVENT));
  }
}

/** App user (API). Kept name for fewer file changes across the app. */
export type MockUserProfile = AuthUser;

function readPersistedUser(): AuthUser | null {
  try {
    const raw = getStoredUserJson();
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;
    const u = mapUserDto(p);
    const withId = hydrateAuthUserIdFromToken(u, getStoredToken());
    if (!withId.email.trim()) return null;
    return withId;
  } catch {
    return null;
  }
}

function clearLegacyMockKeys() {
  try {
    localStorage.removeItem("drplant_mock_user");
    localStorage.removeItem("drplant_mock_password");
  } catch {
    /* ignore */
  }
}

function persistUser(user: AuthUser | null) {
  if (!user) {
    setStoredUserJson(null);
    return;
  }
  setStoredUserJson(JSON.stringify(user));
}

type AuthResult = { ok: true } | { ok: false; error: string };

type UserContextValue = {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  authLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (
    profile: Omit<AuthUser, "id" | "role" | "isAdmin"> & {
      phone?: string;
      password: string;
    },
  ) => Promise<AuthResult>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateProfile: (patch: Partial<AuthUser>) => Promise<AuthResult>;
  updatePassword: (newPassword: string) => Promise<AuthResult>;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

function computeIsAdmin(u: AuthUser | null): boolean {
  if (!u) return false;
  if (u.isAdmin === true) return true;
  const r = (u.role ?? "").toLowerCase();
  if (r === "admin" || r === "administrator") return true;
  return isAdminEmail(u.email);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const t = getStoredToken();
    const u = readPersistedUser();
    if (t && u) return u;
    return null;
  });
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id <= 0) return;
    try {
      const raw = getStoredUserJson();
      if (!raw) return;
      const stored = mapUserDto(JSON.parse(raw) as Record<string, unknown>);
      if (stored.id !== user.id) persistUser(user);
    } catch {
      /* ignore */
    }
  }, [user]);

  const logout = useCallback(() => {
    clearAuthStorage();
    clearLegacyMockKeys();
    setUser(null);
    emitAuthChanged();
  }, []);

  const refreshUser = useCallback(async () => {
    if (!user?.id || user.id <= 0) return;
    try {
      const fresh = await usersService.getUser(user.id);
      setUser(fresh);
      persistUser(fresh);
      emitAuthChanged();
    } catch {
      /* keep cached user */
    }
  }, [user?.id]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) return { ok: false, error: "Email and password required" };
    setAuthLoading(true);
    try {
      const { user: u } = await authService.loginRequest({ email: e, password: p });
      clearLegacyMockKeys();
      setUser(u);
      emitAuthChanged();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: getErrorMessage(err) };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const register = useCallback(
    async (
      profile: Omit<AuthUser, "id" | "role" | "isAdmin"> & {
        phone?: string;
        password: string;
      },
    ): Promise<AuthResult> => {
      setAuthLoading(true);
      try {
        const { user: u } = await authService.registerRequest({
          firstName: profile.firstName.trim(),
          lastName: profile.lastName.trim(),
          email: profile.email.trim(),
          password: profile.password.trim(),
        });
        clearLegacyMockKeys();
        setUser(u);
        emitAuthChanged();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
      } finally {
        setAuthLoading(false);
      }
    },
    [],
  );

  const updateProfile = useCallback(
    async (patch: Partial<AuthUser>): Promise<AuthResult> => {
      if (!user?.id) return { ok: false, error: "Not signed in" };
      setAuthLoading(true);
      try {
        await usersService.updateUser(user.id, {
          firstName: patch.firstName ?? user.firstName,
          lastName: patch.lastName ?? user.lastName,
          email: patch.email ?? user.email,
          phone: patch.phone ?? user.phone,
        });
        const next: AuthUser = {
          ...user,
          ...patch,
          email: (patch.email ?? user.email).trim(),
          firstName: (patch.firstName ?? user.firstName).trim(),
          lastName: (patch.lastName ?? user.lastName).trim(),
        };
        setUser(next);
        persistUser(next);
        emitAuthChanged();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
      } finally {
        setAuthLoading(false);
      }
    },
    [user],
  );

  const updatePassword = useCallback(
    async (newPassword: string): Promise<AuthResult> => {
      const trimmed = newPassword.trim();
      if (!trimmed) return { ok: false, error: "Password required" };
      if (!user?.id) return { ok: false, error: "Not signed in" };
      setAuthLoading(true);
      try {
        await usersService.updateUser(user.id, { password: trimmed });
        emitAuthChanged();
        return { ok: true };
      } catch (err) {
        return { ok: false, error: getErrorMessage(err) };
      } finally {
        setAuthLoading(false);
      }
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      isLoggedIn: Boolean(user),
      isAdmin: computeIsAdmin(user),
      authLoading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      updatePassword,
    }),
    [
      user,
      authLoading,
      login,
      register,
      logout,
      refreshUser,
      updateProfile,
      updatePassword,
    ],
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within UserProvider");
  }
  return ctx;
}
