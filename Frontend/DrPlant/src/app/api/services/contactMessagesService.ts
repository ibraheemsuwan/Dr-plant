import { apiDelete, apiGet, apiPost, apiPut } from "../http";
import { asArray, pickNum, pickStr } from "../utils";

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

function toStatus(raw: string): ContactMessageStatus {
  const s = raw.trim().toLowerCase();
  return s === "read" || s === "replied" ? s : "unread";
}

/** Backend `ContactMessage` row -> UI shape. The backend stores one admin reply per message. */
function mapMessage(o: Record<string, unknown>): ContactMessage {
  const id = String(Math.trunc(pickNum(o, "id", "Id")));
  const reply = pickStr(o, "adminReply", "AdminReply").trim();
  const repliedAt = pickStr(o, "repliedAt", "RepliedAt") || undefined;
  return {
    id,
    name: pickStr(o, "name", "Name"),
    email: pickStr(o, "email", "Email"),
    subject: pickStr(o, "subject", "Subject"),
    message: pickStr(o, "message", "Message"),
    createdAt: pickStr(o, "createdAt", "CreatedAt") || new Date().toISOString(),
    status: toStatus(pickStr(o, "status", "Status")),
    repliedAt,
    replies: reply
      ? [
          {
            id: `${id}-reply`,
            senderType: "admin",
            senderName: "Dr Plant Support",
            content: reply,
            createdAt: repliedAt ?? new Date().toISOString(),
          },
        ]
      : [],
  };
}

const API_STATUS: Record<ContactMessageStatus, string> = {
  unread: "Unread",
  read: "Read",
  replied: "Replied",
};

/** Admin only. */
export async function getContactMessages(): Promise<ContactMessage[]> {
  const data = await apiGet<unknown>("/ContactMessages");
  return asArray<Record<string, unknown>>(data).map(mapMessage);
}

/** Admin only. Opening a message marks it as read on the server. */
export async function getContactMessage(id: string): Promise<ContactMessage | null> {
  const data = await apiGet<Record<string, unknown>>(`/ContactMessages/${id}`);
  return data ? mapMessage(data) : null;
}

/** Public contact form. */
export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  await apiPost("/ContactMessages", {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  });
}

/** Admin only. */
export async function markMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<void> {
  await apiPut(`/ContactMessages/${id}/status`, { status: API_STATUS[status] });
}

/** Admin only. Saves the reply on the server (the email itself is sent by the dashboard). */
export async function sendReplyToContactMessage(input: {
  id: string;
  replyText: string;
}): Promise<void> {
  const trimmed = input.replyText.trim();
  if (!trimmed) {
    await markMessageStatus(input.id, "read");
    return;
  }
  await apiPut(`/ContactMessages/${input.id}/reply`, { adminReply: trimmed });
}

/** Admin only (soft delete on the server). */
export async function removeContactMessage(id: string): Promise<boolean> {
  await apiDelete(`/ContactMessages/${id}`);
  return true;
}
