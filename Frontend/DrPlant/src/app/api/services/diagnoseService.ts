import { ApiError } from "../errors";
import { apiGet, apiPost } from "../http";
import { asArray, pickNum } from "../utils";
import { compressImageForUpload } from "../../lib/compressImage";

/**
 * Multipart predict: field name must be `file`. The photo is compressed in the browser first.
 * `cropId` (optional) is the plant the user says it is; the server limits the model to that crop.
 */
export async function predictPlantDisease(
  file: File,
  cropId?: number | null,
): Promise<unknown> {
  const upload = await compressImageForUpload(file);
  const fd = new FormData();
  fd.append("file", upload, upload.name);
  if (cropId != null && cropId > 0) fd.append("cropId", String(cropId));
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
