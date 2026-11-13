import { ApiError } from "../errors";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "../http";
import { asArray, pickNum } from "../utils";

export async function listPostsRaw(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Posts", { skipAuth: true });
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
  fd.append("Category", (payload.category ?? "General").trim() || "General");
  fd.append("category", (payload.category ?? "General").trim() || "General");

  // Image is optional (omit entire parts when missing)
  if (payload.file) appendPostOptionalFile(fd, payload.file);

  return fd;
}

function postWriteBodyJson(payload: CreatePostPayload): Record<string, unknown> {
  return {
    title: payload.title.trim(),
    content: payload.content,
    userId: payload.userId,
    category: (payload.category ?? "General").trim() || "General",
  };
}

export async function createPost(payload: CreatePostPayload): Promise<unknown> {
  // API expects [FromForm] (multipart/form-data) even when File is omitted.
  return apiPost<unknown>("/Posts", postWriteBodyFormData(payload));
}

export async function deletePost(id: number): Promise<void> {
  await apiDelete(`/Posts/${id}`);
}

/** يحاول استخراج معرف المنشور من رد الـ API بعد الإنشاء. */
export function extractPostIdFromCreateResponse(result: unknown): number | null {
  if (result == null) return null;
  if (typeof result === "number" && Number.isFinite(result) && result > 0) {
    return Math.trunc(result);
  }
  if (typeof result === "string" && /^\d+$/.test(result.trim())) {
    const n = Number(result.trim());
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }
  if (typeof result === "object" && !Array.isArray(result)) {
    const o = result as Record<string, unknown>;
    let n = pickNum(o, "id", "Id", "postId", "PostId");
    if (!Number.isFinite(n) || n <= 0) {
      const inner = o.data ?? o.Data;
      if (inner && typeof inner === "object" && !Array.isArray(inner)) {
        n = pickNum(inner as Record<string, unknown>, "id", "Id", "postId", "PostId");
      }
    }
    return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
  }
  return null;
}

function isWrongMethodOrRoute(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 405 || e.status === 404);
}

export async function updatePost(
  id: number,
  payload: CreatePostPayload,
): Promise<unknown> {
  const formBody = postWriteBodyFormData(payload);
  const jsonBody = postWriteBodyJson(payload);

  let lastError: unknown;

  const resourcePaths = [`/Posts/${id}`, `/Post/${id}`];

  for (const path of resourcePaths) {
    for (const run of [
      () => apiPatch<unknown>(path, formBody),
      () => apiPut<unknown>(path, formBody),
      () => apiPatch<unknown>(path, jsonBody),
      () => apiPut<unknown>(path, jsonBody),
    ]) {
      try {
        return await run();
      } catch (e) {
        lastError = e;

        if (e instanceof ApiError && (e.status === 405 || e.status === 415))
          continue;
        throw e;
      }
    }
  }

  const postAttempts: Array<() => Promise<unknown>> = [
    () => apiPost<unknown>("/Posts/Update", formBody),
    () => apiPost<unknown>("/Posts/Update", jsonBody),
    () => apiPost<unknown>("/Posts/update", formBody),
    () => apiPost<unknown>("/Posts/update", jsonBody),
    () => apiPost<unknown>("/Post/Update", formBody),
    () => apiPost<unknown>("/Post/Update", jsonBody),
    () => apiPost<unknown>("/Post/update", formBody),
    () => apiPost<unknown>("/Post/update", jsonBody),
    () => apiPost<unknown>(`/Posts/${id}`, formBody),
    () => apiPost<unknown>(`/Posts/${id}`, jsonBody),
    () => apiPost<unknown>(`/Post/${id}`, formBody),
    () => apiPost<unknown>(`/Post/${id}`, jsonBody),
    () => apiPost<unknown>(`/Posts/Edit/${id}`, formBody),
    () => apiPost<unknown>(`/Posts/Edit/${id}`, jsonBody),
    () => apiPost<unknown>(`/Posts/edit/${id}`, formBody),
    () => apiPost<unknown>(`/Posts/edit/${id}`, jsonBody),
  ];

  for (const run of postAttempts) {
    try {
      return await run();
    } catch (e) {
      lastError = e;
      if (isWrongMethodOrRoute(e)) continue;
      throw e;
    }
  }

  throw lastError;
}
