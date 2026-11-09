/** Normalize ASP.NET list responses (array, OData $values, wrapper objects). */
export function asArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (Array.isArray(o.$values)) return o.$values as T[];
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.items)) return o.items as T[];
    if (Array.isArray(o.value)) return o.value as T[];
    if (Array.isArray(o.results)) return o.results as T[];
  }
  return [];
}

export function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string") return v;
  }
  return "";
}

export function pickNum(o: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return NaN;
}

export function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "boolean") return v;
  }
  return false;
}
