import type { MockUserProfile } from "../contexts/UserContext";

const REGISTRY_KEY = "drplant_users_registry";

export type RegistryUser = {
  email: string;
  firstName: string;
  lastName: string;
  registeredAt: string;
};

function readRegistry(): RegistryUser[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x): x is RegistryUser =>
        typeof x === "object" &&
        x !== null &&
        typeof (x as RegistryUser).email === "string",
    );
  } catch {
    return [];
  }
}

function writeRegistry(users: RegistryUser[]) {
  localStorage.setItem(REGISTRY_KEY, JSON.stringify(users));
}

export function listRegisteredUsers(): RegistryUser[] {
  return readRegistry();
}

export function syncUserToRegistry(profile: MockUserProfile) {
  const email = profile.email.trim().toLowerCase();
  const list = readRegistry();
  const i = list.findIndex((u) => u.email.toLowerCase() === email);
  const entry: RegistryUser = {
    email: profile.email.trim(),
    firstName: profile.firstName,
    lastName: profile.lastName,
    registeredAt:
      i >= 0 ? list[i].registeredAt : new Date().toISOString(),
  };
  if (i >= 0) list[i] = entry;
  else list.push(entry);
  writeRegistry(list);
}

export function removeUserFromRegistry(email: string): void {
  const e = email.trim().toLowerCase();
  writeRegistry(
    readRegistry().filter((u) => u.email.toLowerCase() !== e),
  );
}
