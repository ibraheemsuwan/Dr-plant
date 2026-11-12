import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "../http";
import { asArray, pickNum } from "../utils";

export type PostFeedParams = {
  page?: number;
  pageSize?: number;
  /** "All" or empty = every category */
  category?: string;
  /** only this user's posts ("my posts") */
  userId?: number;
  /** everything except this user's posts ("community") */
  excludeUserId?: number;
  search?: string;
};

export type PostFeedRaw = {
  items: Record<string, unknown>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/** GET /Posts/feed: one page of posts, each with its likes and comments. */
export async function fetchPostFeedRaw(params: PostFeedParams = {}): Promise<PostFeedRaw> {
  const qs = new URLSearchParams();
  if (params.page) qs.set("page", String(params.page));
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.category && params.category !== "All") qs.set("category", params.category);
  if (params.userId) qs.set("userId", String(params.userId));
  if (params.excludeUserId) qs.set("excludeUserId", String(params.excludeUserId));
  if (params.search?.trim()) qs.set("search", params.search.trim());

  const data = await apiGet<Record<string, unknown>>(`/Posts/feed?${qs.toString()}`);
  const num = (key: string, fallback: number) => {
    const n = pickNum(data, key);
    return Number.isFinite(n) ? Math.trunc(n) : fallback;
  };
  return {
    items: asArray<Record<string, unknown>>(data.items),
    page: num("page", 1),
    pageSize: num("pageSize", 10),
    total: num("total", 0),
    totalPages: num("totalPages", 0),
  };
}

export async function listPostsRaw(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Posts");
  return asArray<Record<string, unknown>>(data);
}

export async function getPostRaw(id: number): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>(`/Posts/${id}`);
}

export type CreatePostPayload = {
  title: string;
  content: string;
  userId: number;
  category?: string;
  file?: File | null;
};

function appendPostOptionalFile(fd: FormData, file: File) {
  const name = file.name?.trim() || "upload.jpg";
  // Explicit filename helps some ASP.NET model binders; backend may use File or Image for IFormFile.
  fd.append("File", file, name);
  fd.append("Image", file, name);
}

function postWriteBodyFormData(payload: CreatePostPayload): FormData {
  const fd = new FormData();
  fd.append("Title", payload.title.trim());
  fd.append("Content", payload.content);
  fd.append("UserId", String(payload.userId));
  if (payload.category?.trim()) {
    const c = payload.category.trim();
    fd.append("Category", c);
    fd.append("category", c);
  }

  // Image is optional (omit entire parts when missing)
  if (payload.file) appendPostOptionalFile(fd, payload.file);

  return fd;
}

export async function createPost(payload: CreatePostPayload): Promise<unknown> {
  // API expects [FromForm] (multipart/form-data) even when File is omitted.
  return apiPost<unknown>("/Posts", postWriteBodyFormData(payload));
}

export async function deletePost(id: number): Promise<void> {
  await apiDelete(`/Posts/${id}`);
}

/** PUT /Posts/{id} as multipart (same fields as create; a new image is optional). */
export async function updatePost(
  id: number,
  payload: CreatePostPayload,
): Promise<unknown> {
  return apiPut<unknown>(`/Posts/${id}`, postWriteBodyFormData(payload));
}
