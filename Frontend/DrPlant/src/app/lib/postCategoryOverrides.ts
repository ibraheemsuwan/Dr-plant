const STORAGE_KEY = "drplant_post_category_overrides_v1";

type OverrideMap = Record<string, string>;

function safeParse(raw: string | null): OverrideMap {
  if (!raw) return {};
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return {};
    return o as OverrideMap;
  } catch {
    return {};
  }
}

function readAll(): OverrideMap {
  return safeParse(localStorage.getItem(STORAGE_KEY));
}

function writeAll(next: OverrideMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function buildPostCategoryKey(input: {
  userId: string | number;
  title: string;
  content: string;
}): string {
  const uid = String(input.userId ?? "").trim();
  const title = (input.title ?? "").trim().toLowerCase();
  const content = (input.content ?? "").trim().toLowerCase();
  return `${uid}::${title}::${content}`;
}

export function setPostCategoryOverride(key: string, category: string) {
  const c = category.trim();
  if (!c) return;
  const all = readAll();
  all[key] = c;
  writeAll(all);
}

export function getPostCategoryOverride(key: string): string | null {
  const all = readAll();
  const v = all[key];
  return typeof v === "string" && v.trim() ? v : null;
}

