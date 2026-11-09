import { apiGet } from "../http";
import { asArray } from "../utils";

/** Optional: diagnosis history. */
export async function listDiagnoses(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Diagnoses");
  return asArray<Record<string, unknown>>(data);
}
