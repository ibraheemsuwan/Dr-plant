import type { BlogPost, BlogComment } from "../../lib/blogPostsStorage";
import { ensurePostShape } from "../../lib/blogPostsStorage";
import {
  mapApiPostToBlogPost,
  mapApiCommentToBlogComment,
  mapApiLikeToRecord,
  pickPostRecordId,
} from "../mappers";
import { pickNum } from "../utils";
import type { AuthUser } from "../types";
import * as commentsService from "./commentsService";
import * as likesService from "./likesService";
import * as postsService from "./postsService";
import * as usersService from "./usersService";

async function enrichCommentAuthors(
  posts: BlogPost[],
  commentsByPost: Map<number, BlogComment[]>,
): Promise<Map<number, BlogComment[]>> {
  const allComments = [...commentsByPost.values()].flat();
  const needs = allComments.some(
    (c) => !c.authorName.trim() || c.authorName === "User",
  );
  if (!needs) return commentsByPost;

  let byId = new Map<number, AuthUser>();
  try {
    const users = await usersService.listUsers();
    byId = new Map(users.map((u) => [u.id, u]));
  } catch {
    const ids = [
      ...new Set(
        allComments
          .map((c) => Math.trunc(Number(c.authorId)))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    ];
    for (const id of ids) {
      try {
        const u = await usersService.getUser(id);
        byId.set(id, u);
      } catch {
        /* ignore */
      }
    }
  }

  const inferName = (uid: number): string => {
    const u = byId.get(uid);
    if (!u) return "User";
    return (
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.email.split("@")[0] ||
      u.email
    );
  };

  const next = new Map<number, BlogComment[]>();
  for (const p of posts) {
    const pid = p.id;
    const list = commentsByPost.get(pid) ?? [];
    const updated = list.map((c) => {
      if (c.authorName.trim() && c.authorName !== "User") return c;
      const uid = Math.trunc(Number(c.authorId));
      if (!Number.isFinite(uid) || uid <= 0) return c;
      return { ...c, authorName: inferName(uid) };
    });
    next.set(pid, updated);
  }
  return next;
}

async function enrichBlogAuthors(posts: BlogPost[]): Promise<BlogPost[]> {
  const needs = posts.some(
    (p) => !p.author.trim() || p.author === "User",
  );
  if (!needs) return posts;

  let byId = new Map<number, AuthUser>();
  try {
    const users = await usersService.listUsers();
    byId = new Map(users.map((u) => [u.id, u]));
  } catch {
    const ids = [
      ...new Set(
        posts
          .map((p) => Math.trunc(Number(p.userId)))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    ];
    for (const id of ids) {
      try {
        const u = await usersService.getUser(id);
        byId.set(id, u);
      } catch {
        /* ignore */
      }
    }
  }

  return posts.map((p) => {
    if (p.author.trim() && p.author !== "User") return p;
    const uid = Math.trunc(Number(p.userId));
    if (!Number.isFinite(uid) || uid <= 0) return p;
    const u = byId.get(uid);
    if (!u) return p;
    const name =
      [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
      u.email.split("@")[0] ||
      u.email;
    return { ...p, author: name };
  });
}

/**
 * Loads posts, comments, and likes from the API and merges into `BlogPost[]`
 * for the existing blog UI.
 */
export async function fetchBlogPostsMerged(): Promise<BlogPost[]> {
  const [postRows, commentRows, likeRows] = await Promise.all([
    postsService.listPostsRaw(),
    commentsService.listCommentsRaw(),
    likesService.listLikesRaw(),
  ]);

  const commentsByPost = new Map<number, BlogComment[]>();
  for (const cr of commentRows) {
    const c = mapApiCommentToBlogComment(cr);
    const pid = c.postId;
    if (pid == null) continue;
    const { postId: _p, ...rest } = c;
    const bc: BlogComment = {
      id: rest.id,
      authorName: rest.authorName,
      authorId: rest.authorId,
      text: rest.text,
      date: rest.date,
    };
    const list = commentsByPost.get(pid) ?? [];
    list.push(bc);
    commentsByPost.set(pid, list);
  }

  const likesByPost = new Map<number, string[]>();
  const likeIdByPostUser = new Map<string, number>();
  for (const lr of likeRows) {
    const rec = mapApiLikeToRecord(lr);
    if (!rec) continue;
    const arr = likesByPost.get(rec.postId) ?? [];
    arr.push(String(rec.userId));
    likesByPost.set(rec.postId, arr);
    likeIdByPostUser.set(`${rec.postId}:${rec.userId}`, rec.id);
  }

  const merged = postRows
    .map((p) => {
      const rec = p as Record<string, unknown>;
      const pid = pickPostRecordId(rec);
      const comments = commentsByPost.get(pid) ?? [];
      const likeUserIds = likesByPost.get(pid) ?? [];
      return ensurePostShape(mapApiPostToBlogPost(rec, comments, likeUserIds));
    })
    .filter((post) => post.id > 0);

  const enrichedCommentsByPost = await enrichCommentAuthors(merged, commentsByPost);

  const byNewest = [...merged].sort((a, b) => {
    const ta = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime();
    const tb = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime();
    if (tb !== ta) return tb - ta;
    return b.id - a.id;
  });

  const withComments = byNewest.map((p) => ({
    ...p,
    comments: enrichedCommentsByPost.get(p.id) ?? p.comments ?? [],
  }));

  return enrichBlogAuthors(withComments);
}

export type LikeLookup = Map<string, number>;

export function buildLikeLookup(likeRows: Record<string, unknown>[]): LikeLookup {
  const m = new Map<string, number>();
  for (const lr of likeRows) {
    const rec = mapApiLikeToRecord(lr);
    if (!rec) continue;
    let likeId = rec.id;
    if (likeId <= 0) {
      const alt = pickNum(lr, "id", "Id", "likeId", "LikeId");
      if (Number.isFinite(alt) && alt > 0) likeId = Math.trunc(alt);
    }
    if (likeId <= 0) continue;
    m.set(`${String(rec.postId)}:${String(rec.userId)}`, likeId);
  }
  return m;
}

export async function fetchLikeLookup(): Promise<LikeLookup> {
  const likeRows = await likesService.listLikesRaw();
  return buildLikeLookup(likeRows);
}
