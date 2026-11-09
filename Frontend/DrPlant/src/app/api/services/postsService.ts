import { ApiError } from "../errors";
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
} from "../http";
import { asArray } from "../utils";

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

function isWrongMethodOrRoute(e: unknown): boolean {
  return e instanceof ApiError && (e.status === 405 || e.status === 404);
}

export async function updatePost(
  id: number,
  payload: CreatePostPayload,
): Promise<unknown> {
  const formBody = postWriteBodyFormData(payload);

  let lastError: unknown;

  const resourcePaths = [`/Posts/${id}`, `/Post/${id}`];

  for (const path of resourcePaths) {
    for (const run of [
      () => apiPatch<unknown>(path, formBody),
      () => apiPut<unknown>(path, formBody),
    ]) {
      try {
        return await run();
      } catch (e) {
        lastError = e;

        if (e instanceof ApiError && e.status === 405) continue;
        throw e;
      }
    }
  }

  const postAttempts: Array<() => Promise<unknown>> = [
    () => apiPost<unknown>("/Posts/Update", formBody),
    () => apiPost<unknown>("/Posts/update", formBody),
    () => apiPost<unknown>("/Post/Update", formBody),
    () => apiPost<unknown>("/Post/update", formBody),
    () => apiPost<unknown>(`/Posts/${id}`, formBody),
    () => apiPost<unknown>(`/Post/${id}`, formBody),
    () => apiPost<unknown>(`/Posts/Edit/${id}`, formBody),
    () => apiPost<unknown>(`/Posts/edit/${id}`, formBody),
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
