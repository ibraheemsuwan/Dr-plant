import { apiDelete, apiGet, apiPost } from "../http";
import { asArray } from "../utils";

export async function listCommentsRaw(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Comments", { skipAuth: true });
  return asArray<Record<string, unknown>>(data);
}

export type CreateCommentPayload = {
  postId: number;
  userId: number;
  content: string;
  authorName?: string;
};

export async function createComment(payload: CreateCommentPayload): Promise<unknown> {
  return apiPost<unknown>("/Comments", {
    postId: payload.postId,
    PostId: payload.postId,
    userId: payload.userId,
    UserId: payload.userId,
    authorName: payload.authorName,
    AuthorName: payload.authorName,
    userName: payload.authorName,
    UserName: payload.authorName,
    content: payload.content,
    Content: payload.content,
    text: payload.content,
    Text: payload.content,
  });
}

export async function deleteComment(id: number): Promise<void> {
  await apiDelete(`/Comments/${id}`);
}
