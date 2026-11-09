import {
  addContactMessage,
  deleteContactMessage,
  getContactMessageById,
  listContactMessages,
  updateContactMessage,
  type ContactConversationItem,
  type ContactMessage,
  type ContactMessageStatus,
} from "../../lib/contactMessagesStorage";

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeConversationId(): string {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  await delay(250);
  return listContactMessages();
}

export async function getContactMessage(id: string): Promise<ContactMessage | null> {
  await delay(120);
  return getContactMessageById(id);
}

export async function getConversationByMessageId(
  id: string,
): Promise<ContactConversationItem[]> {
  await delay(80);
  const m = getContactMessageById(id);
  return m?.replies ?? [];
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt?: string;
}): Promise<ContactMessage> {
  await delay(80);
  return addContactMessage(input);
}

export async function markMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<ContactMessage | null> {
  await delay(80);
  return updateContactMessage(id, { status });
}

export async function sendReplyToContactMessage(input: {
  id: string;
  replyText: string;
}): Promise<ContactMessage | null> {
  await delay(120);
  const trimmed = input.replyText.trim();
  if (!trimmed) return updateContactMessage(input.id, { status: "read" });

  const existing = getContactMessageById(input.id);
  const nextReplies: ContactConversationItem[] = [
    ...(existing?.replies ?? []),
    {
      id: makeConversationId(),
      senderType: "admin",
      senderName: "Dr Plant Support",
      content: trimmed,
      createdAt: new Date().toISOString(),
    },
  ];

  return updateContactMessage(input.id, {
    status: "replied",
    replies: nextReplies,
    repliedAt: new Date().toISOString(),
  });
}

// Placeholder: inbound email replies need backend/webhook integration.
export async function syncIncomingReplies(): Promise<void> {
  await delay(120);
}

export async function appendIncomingUserReply(
  messageId: string,
  input: { senderName: string; content: string; createdAt?: string },
): Promise<ContactMessage | null> {
  await delay(120);
  const existing = getContactMessageById(messageId);
  if (!existing) return null;
  const nextReplies: ContactConversationItem[] = [
    ...(existing.replies ?? []),
    {
      id: makeConversationId(),
      senderType: "user",
      senderName: input.senderName.trim() || existing.name,
      content: input.content.trim(),
      createdAt: input.createdAt ?? new Date().toISOString(),
    },
  ];
  return updateContactMessage(messageId, {
    replies: nextReplies,
    status: "read",
  });
}

export async function removeContactMessage(id: string): Promise<boolean> {
  await delay(120);
  return deleteContactMessage(id);
}

