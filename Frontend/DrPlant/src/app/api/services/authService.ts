import { ApiError } from "../errors";
import { apiPost, persistToken } from "../http";
import {
  extractTokenFromAuthResponse,
  extractUserFromAuthResponse,
} from "../mappers";
import { setStoredUserJson } from "../tokenStorage";
import type { AuthUser } from "../types";

export type LoginPayload = { email: string; password: string };

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

/** Login: stores JWT + user JSON in localStorage on success. */
export async function loginRequest(
  payload: LoginPayload,
): Promise<{ token: string; user: AuthUser }> {
  const data = await apiPost<unknown>("/Auth/login", payload, {
    skipAuth: true,
  });

  const token = extractTokenFromAuthResponse(data);
  const user = extractUserFromAuthResponse(data);

  if (!token) throw new Error("No token in login response");
  if (!user) throw new Error("No user in login response");

  persistToken(token);
  setStoredUserJson(JSON.stringify(user));

  return { token, user };
}

function finishAuth(data: unknown): { token: string; user: AuthUser } {
  const token = extractTokenFromAuthResponse(data);
  const user = extractUserFromAuthResponse(data);

  if (!token) throw new Error("No token in auth response");
  if (!user) throw new Error("No user in auth response");

  persistToken(token);
  setStoredUserJson(JSON.stringify(user));

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
