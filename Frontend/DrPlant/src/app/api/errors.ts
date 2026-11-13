export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    super(message ?? parseApiErrorMessage(body, status));
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function parseApiErrorMessage(body: unknown, status: number): string {
  if (body == null) return `Request failed (${status})`;
  if (typeof body === "string") return body;
  if (typeof body !== "object") return `Request failed (${status})`;
  const o = body as Record<string, unknown>;
  const errs = o.errors;
  if (errs && typeof errs === "object") {
    const vals = Object.values(errs as Record<string, unknown>).flat();
    const first = vals[0];
    if (typeof first === "string" && first.trim()) return first;
  }
  if (typeof o.title === "string" && o.title) return o.title;
  if (typeof o.message === "string" && o.message) return o.message;
  if (typeof o.detail === "string" && o.detail) return o.detail;
  return `Request failed (${status})`;
}

export function getErrorMessage(e: unknown): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  return "Something went wrong";
}
