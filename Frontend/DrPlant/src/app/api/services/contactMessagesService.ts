import { apiDelete, apiGet, apiPost, apiPut } from "../http";
import { asArray } from "../utils";

export type ContactMessageStatus = "Unread" | "Read" | "Replied";

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  adminReply: string;
  createdAt: string;
  readAt: string | null;
  repliedAt: string | null;
  isDeleted: boolean;
};

type ContactMessageDto = Partial<ContactMessage> & Record<string, unknown>;

function asStatus(value: unknown): ContactMessageStatus {
  const raw = typeof value === "string" ? value.trim().toLowerCase() : "";
  if (raw === "unread") return "Unread";
  if (raw === "replied") return "Replied";
  return "Read";
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function mapContactMessageDto(dto: ContactMessageDto): ContactMessage {
  return {
    id: String(dto.id ?? dto.Id ?? ""),
    name: asText(dto.name ?? dto.Name),
    email: asText(dto.email ?? dto.Email),
    subject: asText(dto.subject ?? dto.Subject),
    message: asText(dto.message ?? dto.Message),
    status: asStatus(dto.status ?? dto.Status),
    adminReply: asText(dto.adminReply ?? dto.AdminReply ?? dto.reply ?? dto.Reply),
    createdAt: asDate(dto.createdAt ?? dto.CreatedAt) ?? "",
    readAt: asDate(dto.readAt ?? dto.ReadAt),
    repliedAt: asDate(dto.repliedAt ?? dto.RepliedAt),
    isDeleted: Boolean(dto.isDeleted ?? dto.IsDeleted),
  };
}

export async function getContactMessages(): Promise<ContactMessage[]> {
  const data = await apiGet<unknown>("/ContactMessages");
  return asArray<ContactMessageDto>(data).map(mapContactMessageDto);
}

export async function getContactMessage(
  id: string,
): Promise<ContactMessage | null> {
  const data = await apiGet<ContactMessageDto>(`/ContactMessages/${id}`);
  if (!data || typeof data !== "object") return null;
  return mapContactMessageDto(data);
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  const data = await apiPost<ContactMessageDto>("/ContactMessages", {
    name: input.name.trim(),
    email: input.email.trim(),
    subject: input.subject.trim(),
    message: input.message.trim(),
  });
  return mapContactMessageDto(data);
}

export async function markMessageStatus(
  id: string,
  status: ContactMessageStatus,
): Promise<void> {
  await apiPut<unknown>(`/ContactMessages/${id}/status`, {
    status,
  });
}

export async function sendReplyToContactMessage(input: {
  id: string;
  replyText: string;
}): Promise<void> {
  await apiPut<unknown>(`/ContactMessages/${input.id}/reply`, {
    adminReply: input.replyText.trim(),
  });
}

export async function removeContactMessage(id: string): Promise<boolean> {
  await apiDelete(`/ContactMessages/${id}`);
  return true;
}
