import { apiDelete, apiGet, apiPut } from "../http";
import { mapUserDto } from "../mappers";
import { asArray } from "../utils";
import type { AuthUser } from "../types";

export async function listUsers(): Promise<AuthUser[]> {
  const data = await apiGet<unknown>("/Users");
  return asArray<Record<string, unknown>>(data).map(mapUserDto);
}

export async function getUser(id: number): Promise<AuthUser> {
  const data = await apiGet<Record<string, unknown>>(`/Users/${id}`);
  return mapUserDto(data);
}

export async function updateUser(
  id: number,
  patch: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    currentPassword: string;
  }>,
): Promise<void> {
  await apiPut(`/Users/${id}`, patch);
}

export async function deleteUser(id: number): Promise<void> {
  await apiDelete(`/Users/${id}`);
}
