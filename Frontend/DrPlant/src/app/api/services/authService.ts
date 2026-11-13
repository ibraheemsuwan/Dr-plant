import { ApiError } from "../errors";
import { apiPost, persistToken } from "../http";
import {
  extractTokenFromAuthResponse,
  extractUserFromAuthResponse,
  loginSessionToAuthUser,
  parseLoginResponse,
} from "../mappers";
import { setStoredLoginSession, setStoredUserJson } from "../tokenStorage";
import type { AuthUser, StoredLoginSession } from "../types";

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

function persistAuthSession(session: StoredLoginSession, user: AuthUser): void {
  persistToken(session.token);
  setStoredLoginSession(session);
  setStoredUserJson(JSON.stringify(user));
}

/** Login: stores JWT + full login session in localStorage on success. */
export async function loginRequest(
  payload: LoginPayload,
): Promise<{ token: string; user: AuthUser }> {
  const { token, user, session } = await verifyLoginCredentials(payload);
  persistAuthSession(session, user);
  return { token, user };
}

/**
 * Verifies login credentials and returns token/user without persisting session.
 * Useful for password change flows that should not sign the user in yet.
 */
export async function verifyLoginCredentials(
  payload: LoginPayload,
): Promise<{ token: string; user: AuthUser; session: StoredLoginSession }> {
  const email = payload.email.trim();
  const password = payload.password;
  const body: Record<string, string> = {
    email,
    password,
    Email: email,
    Password: password,
    userName: email,
    UserName: email,
  };
  const data = await apiPost<unknown>("/Auth/login", body, {
    skipAuth: true,
  });

  const session = parseLoginResponse(data);
  if (!session) throw new Error("Invalid login response");
  const user = loginSessionToAuthUser(session);
  return { token: session.token, user, session };
}

/**
 * Re-auth check for sensitive actions (profile/password updates).
 * Accepts any successful login response shape (token-only or token+user).
 */
export async function verifyCredentialsForSensitiveAction(
  payload: LoginPayload,
): Promise<void> {
  const email = payload.email.trim();
  const password = payload.password;
  const body: Record<string, string> = {
    email,
    password,
    Email: email,
    Password: password,
    userName: email,
    UserName: email,
  };
  await apiPost<unknown>("/Auth/login", body, {
    skipAuth: true,
  });
}

function finishAuth(data: unknown): { token: string; user: AuthUser } {
  const session = parseLoginResponse(data);
  if (session) {
    const user = loginSessionToAuthUser(session);
    persistAuthSession(session, user);
    return { token: session.token, user };
  }

  const token = extractTokenFromAuthResponse(data);
  const user = extractUserFromAuthResponse(data);

  if (!token) throw new Error("No token in auth response");
  if (!user) throw new Error("No user in auth response");

  const fallbackSession: StoredLoginSession = {
    token,
    email: user.email,
    name: [user.firstName, user.lastName].filter(Boolean).join(" ").trim() || user.email,
    role: user.role ?? "user",
  };
  persistAuthSession(fallbackSession, user);
  return { token, user };
}

/**
 * Register body:
 * نرسل أكثر من اسم محتمل لأن الباك عندك قد يعتمد على Name أو UserName أو FirstName/LastName
 * أثناء إنشاء المستخدم أو أثناء إنشاء الـ JWT claims.
 */
function registerBody(payload: RegisterPayload): Record<string, string> {
  const firstName = payload.firstName.trim();
  const lastName = payload.lastName.trim();
  const email = payload.email.trim();
  const fullName = `${firstName} ${lastName}`.trim();

  return {
    firstName,
    lastName,
    name: fullName,
    userName: fullName,
    email,
    password: payload.password,
  };
}

export async function registerRequest(
  payload: RegisterPayload,
): Promise<{ token: string; user: AuthUser }> {
  try {
    const data = await apiPost<unknown>(
      "/Auth/register",
      registerBody(payload),
      {
        skipAuth: true,
      },
    );

    return finishAuth(data);
  } catch (first) {
    // إذا حفظ المستخدم بالداتابيس لكن التوكن فشل، نحاول نعمل login مباشرة
    if (first instanceof ApiError && first.status === 500) {
      try {
        return await loginRequest({
          email: payload.email.trim(),
          password: payload.password,
        });
      } catch {
        // ignore and rethrow original error
      }
    }

    throw first;
  }
}
