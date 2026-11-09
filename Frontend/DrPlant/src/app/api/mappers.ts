import type { AuthUser } from "./types";
import type { BlogPost, BlogComment } from "../lib/blogPostsStorage";
import { getApiBaseUrl } from "./config";
import { pickNum, pickStr, pickBool } from "./utils";

const JWT_ID_CLAIM_KEYS = [
  "sub",
  "nameid",
  "userId",
  "UserId",
  "uid",
  "Uid",
  "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier",
] as const;

/** Decode JWT payload (no verification — UI id fallback only). */
export function decodeJwtPayload(
  token: string,
): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = atob(b64 + pad);
    const o = JSON.parse(json) as unknown;
    return o && typeof o === "object" ? (o as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function pickPositiveIntId(obj: Record<string, unknown>): number {
  for (const k of JWT_ID_CLAIM_KEYS) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v) && v > 0) {
      return Math.trunc(v);
    }
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n) && n > 0) return Math.trunc(n);
    }
  }
  return 0;
}

/** When API omits numeric id but JWT carries `sub` / nameidentifier, fill `user.id`. */
export function hydrateAuthUserIdFromToken(
  user: AuthUser,
  token: string | null,
): AuthUser {
  if (user.id > 0 || !token) return user;
  const payload = decodeJwtPayload(token);
  if (!payload) return user;
  const id = pickPositiveIntId(payload);
  return id > 0 ? { ...user, id } : user;
}

export function mapUserDto(dto: Record<string, unknown>): AuthUser {
  let firstName = pickStr(dto, "firstName", "FirstName");
  let lastName = pickStr(dto, "lastName", "LastName");
  const combined = pickStr(
    dto,
    "fullName",
    "FullName",
    "name",
    "Name",
    "displayName",
    "DisplayName",
    "userName",
    "UserName",
  );
  if (!firstName.trim() && !lastName.trim() && combined.trim()) {
    const parts = combined.trim().split(/\s+/);
    firstName = parts[0] ?? "";
    lastName = parts.slice(1).join(" ");
  }
  const id = pickNum(dto, "id", "Id", "userId", "UserId");
  return {
    id: Number.isFinite(id) ? Math.trunc(id) : 0,
    email: pickStr(dto, "email", "Email").trim(),
    firstName,
    lastName,
    phone: pickStr(dto, "phone", "Phone") || undefined,
    role: pickStr(dto, "role", "Role") || undefined,
    isAdmin: pickBool(dto, "isAdmin", "IsAdmin"),
  };
}

export function extractTokenFromAuthResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const direct =
    o.token ?? o.accessToken ?? o.jwt ?? o.Token ?? o.AccessToken ?? o.Jwt;
  if (typeof direct === "string" && direct) return direct;
  const nested = o.data ?? o.Data;
  if (nested && typeof nested === "object") {
    const n = nested as Record<string, unknown>;
    const t = n.token ?? n.accessToken ?? n.Token ?? n.AccessToken;
    if (typeof t === "string" && t) return t;
  }
  return null;
}

export function extractUserFromAuthResponse(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...o };
  const nestedRaw =
    o.user ?? o.User ?? o.data ?? o.Data ?? o.profile ?? o.Profile;
  delete merged.user;
  delete merged.User;
  delete merged.data;
  delete merged.Data;
  delete merged.profile;
  delete merged.Profile;
  for (const k of [
    "token",
    "Token",
    "accessToken",
    "AccessToken",
    "jwt",
    "Jwt",
  ]) {
    delete merged[k];
  }
  if (nestedRaw && typeof nestedRaw === "object") {
    Object.assign(merged, nestedRaw as Record<string, unknown>);
  }
  const user = mapUserDto(merged);
  if (!user.email.trim()) return null;
  const token = extractTokenFromAuthResponse(data);
  return hydrateAuthUserIdFromToken(user, token);
}

/** Host root without trailing `/api` (for resolving `/files/...` paths). */
export function getApiOrigin(): string {
  return getApiBaseUrl().replace(/\/api\/?$/i, "");
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (/^https?:\/\//i.test(url)) return url;
  const origin = getApiOrigin();
  if (url.startsWith("/")) {
    return `${origin}${url}`;
  }
  return `${origin}/${url}`;
}

/** Primary key on Post rows from EF is often `PostId`, not `Id`. */
export function pickPostRecordId(p: Record<string, unknown>): number {
  const n = pickNum(p, "id", "Id", "postId", "PostId");
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

function pickPostAuthorName(p: Record<string, unknown>): string {
  const direct = pickStr(
    p,
    "authorName",
    "AuthorName",
    "author",
    "Author",
    "userName",
    "UserName",
    "createdByName",
    "CreatedByName",
    "postedBy",
    "PostedBy",
  ).trim();
  if (direct) return direct;

  for (const k of [
    "user",
    "User",
    "applicationUser",
    "ApplicationUser",
    "authorUser",
    "AuthorUser",
  ] as const) {
    const u = p[k];
    if (!u || typeof u !== "object") continue;
    const o = u as Record<string, unknown>;
    const fn = pickStr(o, "firstName", "FirstName").trim();
    const ln = pickStr(o, "lastName", "LastName").trim();
    const full = [fn, ln].filter(Boolean).join(" ");
    if (full) return full;
    const em = pickStr(o, "email", "Email", "userName", "UserName").trim();
    if (em) return em.split("@")[0] || em;
  }

  const fn = pickStr(
    p,
    "firstName",
    "FirstName",
    "userFirstName",
    "UserFirstName",
  ).trim();
  const ln = pickStr(
    p,
    "lastName",
    "LastName",
    "userLastName",
    "UserLastName",
  ).trim();
  const full = [fn, ln].filter(Boolean).join(" ");
  if (full) return full;

  return "User";
}

export function mapApiCommentToBlogComment(
  c: Record<string, unknown>,
): BlogComment & {
  postId?: number;
} {
  const id = pickNum(c, "id", "Id", "commentId", "CommentId");
  const postId = pickNum(c, "postId", "PostId");
  const text = pickStr(
    c,
    "text",
    "Text",
    "content",
    "Content",
    "commentText",
    "CommentText",
  );
  const authorName = pickStr(
    c,
    "authorName",
    "AuthorName",
    "userName",
    "UserName",
  );
  const authorId = pickStr(c, "authorId", "AuthorId", "userId", "UserId");
  const uidNum = pickNum(c, "userId", "UserId");
  const created = pickStr(c, "createdAt", "CreatedAt", "date", "Date");
  return {
    id: Number.isFinite(id) ? id : 0,
    authorName: authorName || "User",
    authorId: authorId || (Number.isFinite(uidNum) ? String(uidNum) : ""),
    text,
    date: created ? new Date(created) : new Date(),
    postId: Number.isFinite(postId) ? postId : undefined,
  };
}

function pickPostImageUrl(p: Record<string, unknown>): string {
  const direct = pickStr(
    p,
    "imageUrl",
    "ImageUrl",
    "mediaUrl",
    "MediaUrl",
    "photoUrl",
    "PhotoUrl",
    "fileUrl",
    "FileUrl",
    "imagePath",
    "ImagePath",
    "pictureUrl",
    "PictureUrl",
    "thumbnailUrl",
    "ThumbnailUrl",
  );
  if (direct) return direct;
  const nested = p.image ?? p.Image ?? p.file ?? p.File;
  if (nested && typeof nested === "object") {
    const o = nested as Record<string, unknown>;
    return pickStr(o, "url", "Url", "src", "Src", "path", "Path", "imageUrl", "ImageUrl");
  }
  return "";
}

export function mapApiPostToBlogPost(
  p: Record<string, unknown>,
  comments: BlogComment[],
  likeUserIds: string[],
): BlogPost {
  const id = pickPostRecordId(p);
  const body = pickStr(
    p,
    "content",
    "Content",
    "body",
    "Body",
    "excerpt",
    "Excerpt",
    "description",
    "Description",
  );
  const title = pickStr(
    p,
    "title",
    "Title",
    "postTitle",
    "PostTitle",
    "heading",
    "Heading",
    "subject",
    "Subject",
    "name",
    "Name",
  ).trim();
  const excerpt = (body || pickStr(p, "excerpt", "Excerpt")).trim();
  const created = pickStr(p, "createdAt", "CreatedAt", "date", "Date");
  const userIdStr = pickStr(p, "userId", "UserId", "authorId", "AuthorId");
  const uidNum = pickNum(p, "userId", "UserId");
  const imageUrl = pickPostImageUrl(p);
  const videoUrl = pickStr(p, "videoUrl", "VideoUrl");

  return {
    id,
    title,
    excerpt,
    category: pickStr(p, "category", "Category") || "General",
    author: pickPostAuthorName(p),
    date: created ? new Date(created) : new Date(),
    userId: userIdStr || (Number.isFinite(uidNum) ? String(uidNum) : ""),
    likes: likeUserIds,
    comments,
    mediaUrl: resolveMediaUrl(videoUrl || imageUrl),
    mediaType: videoUrl ? "video" : imageUrl ? "image" : null,
  };
}

export type LikeRecord = { id: number; postId: number; userId: number };

export function mapApiLikeToRecord(
  l: Record<string, unknown>,
): LikeRecord | null {
  const id = pickNum(l, "id", "Id", "likeId", "LikeId");
  const postId = pickNum(l, "postId", "PostId");
  const userId = pickNum(l, "userId", "UserId");
  if (!Number.isFinite(postId) || !Number.isFinite(userId)) return null;
  return {
    id: Number.isFinite(id) && id > 0 ? Math.trunc(id) : 0,
    postId: Math.trunc(postId),
    userId: Math.trunc(userId),
  };
}
