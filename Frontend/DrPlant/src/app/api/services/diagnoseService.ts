import { ApiError } from "../errors";
import { apiGet, apiPost } from "../http";
import { asArray, pickNum } from "../utils";

/** Multipart predict: field name must be `file`. */
export async function predictPlantDisease(file: File): Promise<unknown> {
  const fd = new FormData();
  fd.append("file", file);
  return apiPost<unknown>("/Diagnoses/predict", fd);
}

export async function fetchDiseaseDetails(
  diseaseId: number,
): Promise<Record<string, unknown>> {
  try {
    return await apiGet<Record<string, unknown>>(`/Diseases/${diseaseId}`);
  } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405)) {
      const data = await apiGet<unknown>("/Diseases");
      const list = asArray<Record<string, unknown>>(data);
      const row = list.find((r) => {
        const id = pickNum(r, "diseaseId", "DiseaseId", "id", "Id");
        return Number.isFinite(id) && Math.trunc(id) === Math.trunc(diseaseId);
      });
      if (row) return row;
    }
    throw e;
  }
}
