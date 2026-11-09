export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
  isAdmin?: boolean;
};
