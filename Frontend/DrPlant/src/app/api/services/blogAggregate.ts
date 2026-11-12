import type { BlogPost, BlogComment } from "../../lib/blogTypes";
import { ensurePostShape } from "../../lib/blogTypes";
import {
  mapApiPostToBlogPost,
  mapApiCommentToBlogComment,
  mapApiLikeToRecord,
} from "../mappers";
import { asArray, pickNum } from "../utils";
import * as postsService from "./postsService";

export type LikeLookup = Map<string, number>;

export type BlogFeedParams = postsService.PostFeedParams;

export type BlogFeedResult = {
  posts: BlogPost[];
  page: number;
  total: number;
  totalPages: number;
  /** `postId:userId` -> likeId, for the posts on this page (needed to un-like) */
  likeLookup: LikeLookup;
};

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

function mapFeedItem(item: Record<string, unknown>): BlogPost {
  const comments: BlogComment[] = asArray<Record<string, unknown>>(item.comments).map((cr) => {
    const c = mapApiCommentToBlogComment(cr);
    return {
      id: c.id,
      authorName: c.authorName,
      authorId: c.authorId,
      text: c.text,
      date: c.date,
    };
  });

  const likeUserIds = asArray<Record<string, unknown>>(item.likes)
    .map((lr) => mapApiLikeToRecord(lr))
    .filter((l): l is NonNullable<typeof l> => l != null)
    .map((l) => String(l.userId));

  return ensurePostShape(mapApiPostToBlogPost(item, comments, likeUserIds));
}

/**
 * One page of the blog from the server: posts (newest first) with their comments, likes and author names.
 * Replaces loading the posts, comments, likes and users tables in full and joining them in the browser.
 */
export async function fetchBlogFeed(params: BlogFeedParams): Promise<BlogFeedResult> {
  const feed = await postsService.fetchPostFeedRaw(params);

  const likeRows = feed.items.flatMap((item) => asArray<Record<string, unknown>>(item.likes));

  return {
    posts: feed.items.map(mapFeedItem).filter((p) => p.id > 0),
    page: feed.page,
    total: feed.total,
    totalPages: feed.totalPages,
    likeLookup: buildLikeLookup(likeRows),
  };
}

/**
 * Many posts at once, for the admin dashboard: walks the pages (50 at a time, newest first).
 * Stops after `maxPosts` so one huge community cannot freeze the page.
 */
export async function fetchBlogPostsMerged(maxPosts = 500): Promise<BlogPost[]> {
  const pageSize = 50;
  const all: BlogPost[] = [];
  for (let page = 1; all.length < maxPosts; page++) {
    const feed = await fetchBlogFeed({ page, pageSize });
    all.push(...feed.posts);
    if (page >= feed.totalPages) break;
  }
  return all.slice(0, maxPosts);
}
