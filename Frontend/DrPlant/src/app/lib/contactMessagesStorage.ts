export type ContactMessageStatus = "unread" | "read" | "replied";

export type ContactConversationItem = {
  id: string;
  senderType: "admin" | "user";
  senderName: string;
  content: string;
  createdAt: string; // ISO
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string; // ISO
  status: ContactMessageStatus;
  replies?: ContactConversationItem[];
  repliedAt?: string; // ISO
};

const STORAGE_KEY = "drplant_contact_messages_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function seedIfEmpty(existing: ContactMessage[] | null): ContactMessage[] {
  if (existing && existing.length > 0) return existing;
  const seeded: ContactMessage[] = [
    {
      id: makeId(),
      name: "Sara",
      email: "sara@example.com",
      subject: "Technical Support",
      message: "My scan result shows an error. Can you help?",
      createdAt: nowIso(),
      status: "unread",
    },
    {
      id: makeId(),
      name: "Ahmed",
      email: "ahmed@example.com",
      subject: "Feedback",
      message: "Great app! Please add more crop tips for winter season.",
      createdAt: nowIso(),
      status: "read",
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

export function listContactMessages(): ContactMessage[] {
  const parsed = safeParse<ContactMessage[]>(localStorage.getItem(STORAGE_KEY));
  return seedIfEmpty(Array.isArray(parsed) ? parsed : []);
}

export function getContactMessageById(id: string): ContactMessage | null {
  return listContactMessages().find((m) => m.id === id) ?? null;
}

export function addContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}): ContactMessage {
  const all = listContactMessages();
  const msg: ContactMessage = {
    id: makeId(),
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt: input.createdAt ?? nowIso(),
    status: "unread",
  };
  const next = [msg, ...all];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return msg;
}

export function updateContactMessage(
  id: string,
  patch: Partial<ContactMessage>,
): ContactMessage | null {
  const all = listContactMessages();
  const idx = all.findIndex((m) => m.id === id);
  if (idx < 0) return null;
  const prev = all[idx];
  const updated: ContactMessage = {
    ...prev,
    ...patch,
    replies: patch.replies ?? prev.replies,
  };
  const next = [...all];
  next[idx] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return updated;
}

export function deleteContactMessage(id: string): boolean {
  const all = listContactMessages();
  const next = all.filter((m) => m.id !== id);
  if (next.length === all.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return true;
}
