/**
 * قائمة بريد الأدمن (محلي مؤقت حتى ربط قاعدة البيانات).
 * أضف نفس البريد الذي تسجّل به لرؤية لوحة التحكم.
 */
export const ADMIN_EMAILS = ["admin@gmail.com"].map((e) => e.toLowerCase());

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email?.trim()) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}
