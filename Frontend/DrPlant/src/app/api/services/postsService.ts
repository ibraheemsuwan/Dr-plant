import {
  apiDelete,
  apiGet,
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

/** PUT /Posts/{id} as multipart (same fields as create; a new image is optional). */
export async function updatePost(
  id: number,
  payload: CreatePostPayload,
): Promise<unknown> {
  return apiPut<unknown>(`/Posts/${id}`, postWriteBodyFormData(payload));
}
