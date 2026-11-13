import { apiDelete, apiGet, apiPut } from "../http";
import { mapUserDto } from "../mappers";
import { asArray, isAdminRole } from "../utils";
import type { AuthUser } from "../types";

type ReadUsersOptions = {
  skipAuth?: boolean;
};

export async function listUsers(options?: ReadUsersOptions): Promise<AuthUser[]> {
  const data = await apiGet<unknown>("/Users", { skipAuth: options?.skipAuth });
  return asArray<Record<string, unknown>>(data).map(mapUserDto);
}

/** Refreshes role from GET /Users/{id} (DB source of truth for admin list). */
async function refreshRolesFromApi(users: AuthUser[]): Promise<AuthUser[]> {
  const withIds = users.filter((u) => u.id > 0);
  if (withIds.length === 0) return users;

  const details = await Promise.all(
    withIds.map(async (u) => {
      try {
        return await getUser(u.id);
      } catch {
        return null;
      }
    }),
  );

  const byId = new Map<number, AuthUser>();
  for (const d of details) {
    if (d?.id) byId.set(d.id, d);
  }

  return users.map((u) => {
    const fresh = byId.get(u.id);
    if (!fresh) return u;
    return { ...u, ...fresh, role: fresh.role ?? u.role };
  });
}

/** Registered users on admin dashboard — excludes role admin. */
export async function listUsersForAdminDashboard(): Promise<AuthUser[]> {
  const users = await refreshRolesFromApi(await listUsers());
  return users.filter((u) => !isAdminRole(u.role));
}

export async function getUser(
  id: number,
  options?: ReadUsersOptions,
): Promise<AuthUser> {
  const data = await apiGet<Record<string, unknown>>(`/Users/${id}`, {
    skipAuth: options?.skipAuth,
  });
  return mapUserDto(data);
}

export type ProfileUpdatePayload = Partial<{
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  name: string;
}>;

export async function updateUser(
  id: number,
  patch: ProfileUpdatePayload & Record<string, unknown>,
): Promise<void> {
  await apiPut(`/Users/${id}`, patch);
}

export async function changePassword(payload: {
  oldPassword: string;
  newPassword: string;
}): Promise<void> {
  await apiPut("/Users/change-password", {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
  });
}

export async function changePasswordWithToken(
  payload: { oldPassword: string; newPassword: string },
  token: string,
): Promise<void> {
  await apiPut(
    "/Users/change-password",
    {
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword,
    },
    {
      skipAuth: true,
      headers: { Authorization: `Bearer ${token}` },
    },
  );
}

export async function deleteUser(id: number): Promise<void> {
  await apiDelete(`/Users/${id}`);
}
