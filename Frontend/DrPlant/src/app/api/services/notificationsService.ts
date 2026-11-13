import { apiGet, apiPut } from "../http";
import { parseApiDate } from "../../lib/dateTime";
import type { AuthUser } from "../types";
import { asArray, pickNum, pickStr } from "../utils";
import * as usersService from "./usersService";

export type AppNotification = {
  notificationId: number;
  receiverUserId: number;
  actorUserId: number;
  actorName?: string;
  postId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function userDisplayName(u: AuthUser): string {
  return (
    [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
    u.email.split("@")[0] ||
    u.email
  );
}

function pickTruthy(dto: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = dto[k];
    if (v === true || v === 1 || v === "1" || v === "true" || v === "True") {
      return true;
    }
  }
  return false;
}

function mapNotificationDto(
  dto: Record<string, unknown>,
): AppNotification {
  const notificationId = pickNum(
    dto,
    "notificationId",
    "NotificationId",
    "id",
    "Id",
  );
  const receiverUserId = pickNum(dto, "receiverUserId", "ReceiverUserId");
  const actorUserId = pickNum(dto, "actorUserId", "ActorUserId");
  const postIdRaw = pickNum(dto, "postId", "PostId");
  let actorName = pickStr(
    dto,
    "actorName",
    "ActorName",
    "actorUserName",
    "ActorUserName",
    "userName",
    "UserName",
  ).trim();
  if (!actorName) {
    for (const k of [
      "actor",
      "Actor",
      "actorUser",
      "ActorUser",
      "user",
      "User",
    ]) {
      const nested = dto[k];
      if (!nested || typeof nested !== "object") continue;
      const o = nested as Record<string, unknown>;
      const fn = pickStr(o, "firstName", "FirstName").trim();
      const ln = pickStr(o, "lastName", "LastName").trim();
      const full = [fn, ln].filter(Boolean).join(" ");
      if (full) {
        actorName = full;
        break;
      }
      const em = pickStr(o, "email", "Email", "userName", "UserName").trim();
      if (em) {
        actorName = em.split("@")[0] || em;
        break;
      }
    }
  }

  return {
    notificationId: Number.isFinite(notificationId)
      ? Math.trunc(notificationId)
      : 0,
    receiverUserId: Number.isFinite(receiverUserId)
      ? Math.trunc(receiverUserId)
      : 0,
    actorUserId: Number.isFinite(actorUserId) ? Math.trunc(actorUserId) : 0,
    actorName: actorName || undefined,
    postId:
      Number.isFinite(postIdRaw) && postIdRaw > 0
        ? Math.trunc(postIdRaw)
        : null,
    type: pickStr(dto, "type", "Type").trim(),
    message: pickStr(dto, "message", "Message").trim(),
    isRead: pickTruthy(dto, "isRead", "IsRead"),
    createdAt: pickStr(dto, "createdAt", "CreatedAt").trim(),
  };
}

async function enrichNotificationsWithActors(
  items: AppNotification[],
): Promise<AppNotification[]> {
  const actorIds = [
    ...new Set(items.map((n) => n.actorUserId).filter((id) => id > 0)),
  ];
  if (actorIds.length === 0) return items;

  const namesById = new Map<number, string>();
  try {
    for (const u of await usersService.listUsers()) {
      if (u.id > 0) namesById.set(u.id, userDisplayName(u));
    }
  } catch {
    /* per-user fallback below */
  }

  await Promise.all(
    actorIds.map(async (id) => {
      if (namesById.has(id)) return;
      try {
        namesById.set(id, userDisplayName(await usersService.getUser(id)));
      } catch {
        /* ignore */
      }
    }),
  );

  return items.map((n) => ({
    ...n,
    actorName:
      n.actorName ||
      (n.actorUserId > 0 ? namesById.get(n.actorUserId) : undefined),
  }));
}

export function getNotificationDisplayMessage(
  n: AppNotification,
  language: "ar" | "en",
): string {
  const name = n.actorName?.trim() || (language === "ar" ? "مستخدم" : "User");
  const type = n.type.trim().toLowerCase();

  if (type === "like") {
    return language === "ar"
      ? `${name} أعجب بمنشورك`
      : `${name} liked your post`;
  }
  if (type === "comment" || type === "reply") {
    return language === "ar"
      ? `${name} علق على منشورك`
      : `${name} commented on your post`;
  }

  const msg = n.message.trim();
  if (msg && !/^someone\b/i.test(msg)) return msg;
  if (msg) return msg.replace(/\bsomeone\b/gi, name);
  return language === "ar"
    ? `${name} أرسل إشعاراً`
    : `${name} sent a notification`;
}

function pickUnreadCount(data: unknown): number {
  if (!data || typeof data !== "object") return 0;
  const o = data as Record<string, unknown>;
  const raw = o.unreadCount ?? o.UnreadCount ?? o.count ?? o.Count;
  if (typeof raw === "number" && Number.isFinite(raw))
    return Math.max(0, Math.trunc(raw));
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    if (Number.isFinite(n)) return Math.max(0, Math.trunc(n));
  }
  return 0;
}

export async function fetchUnreadCount(): Promise<number> {
  const data = await apiGet<unknown>("/notifications/unread-count");
  return pickUnreadCount(data);
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const data = await apiGet<unknown>("/notifications");
  const list = asArray<Record<string, unknown>>(data)
    .map(mapNotificationDto)
    .filter((n) => n.notificationId > 0)
    .sort((a, b) => {
      const tb = parseApiDate(b.createdAt)?.getTime() ?? 0;
      const ta = parseApiDate(a.createdAt)?.getTime() ?? 0;
      return tb - ta;
    });
  return enrichNotificationsWithActors(list);
}

export async function markNotificationRead(
  notificationId: number,
): Promise<void> {
  await apiPut(`/notifications/${notificationId}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPut("/notifications/read-all");
}
