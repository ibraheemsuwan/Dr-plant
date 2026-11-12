import { apiGet } from "../http";
import { asArray } from "../utils";

/** Optional: use for future disease catalog screens. */
export async function listDiseases(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Diseases");
  return asArray<Record<string, unknown>>(data);
}
