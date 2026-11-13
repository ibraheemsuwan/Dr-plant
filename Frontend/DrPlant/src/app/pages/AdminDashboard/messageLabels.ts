import type { ContactMessageStatus } from "../../api/services/contactMessagesService";

export function messageStatusLabel(
  status: ContactMessageStatus,
  language: "ar" | "en",
): string {
  if (language === "ar") {
    const map: Record<ContactMessageStatus, string> = {
      Unread: "غير مقروءة",
      Read: "مقروءة",
      Replied: "تم الرد",
    };
    return map[status];
  }
  const map: Record<ContactMessageStatus, string> = {
    Unread: "Unread",
    Read: "Read",
    Replied: "Replied",
  };
  return map[status];
}

export function messageSubjectLabel(
  raw: string,
  language: "ar" | "en",
): string {
  const key = (raw ?? "").trim().toLowerCase();
  const map: Record<string, { ar: string; en: string }> = {
    support: { ar: "دعم تقني", en: "Technical Support" },
    general: { ar: "استفسار عام", en: "General Inquiry" },
    partnership: { ar: "شراكة", en: "Partnership" },
    feedback: { ar: "ملاحظات", en: "Feedback" },
  };
  const v = map[key];
  if (!v) return raw || "—";
  return language === "ar" ? v.ar : v.en;
}
