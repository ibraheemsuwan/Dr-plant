export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
};

/** Flat login response persisted in localStorage after sign-in. */
export type StoredLoginSession = {
  token: string;
  email: string;
  name: string;
  role: string;
};
