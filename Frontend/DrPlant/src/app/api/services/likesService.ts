import { apiDelete, apiGet, apiPost } from "../http";
import { asArray } from "../utils";

/** All likes, or just those of one post (use the post filter: the unfiltered list grows without limit). */
export async function listLikesRaw(postId?: number): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>(postId ? `/Likes?postId=${postId}` : "/Likes");
  return asArray<Record<string, unknown>>(data);
}

export type CreateLikePayload = { postId: number; userId: number };

export async function createLike(payload: CreateLikePayload): Promise<unknown> {
  return apiPost<unknown>("/Likes", {
    postId: payload.postId,
    PostId: payload.postId,
    userId: payload.userId,
    UserId: payload.userId,
  });
}

export async function deleteLike(id: number): Promise<void> {
  await apiDelete(`/Likes/${id}`);
}
