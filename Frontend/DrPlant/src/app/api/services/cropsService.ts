import { apiDelete, apiGet, apiPost, apiPut } from "../http";
import { asArray } from "../utils";

export async function listCropsRaw(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Crops");
  return asArray<Record<string, unknown>>(data);
}

export type CropPayload = {
  Season: string;
  Name: string;
  NameArabic: string;
  PlantingTimeEn: string;
  PlantingTimeAr: string;
  GrowthPeriodEn: string;
  GrowthPeriodAr: string;
  DifficultyEn: string;
  DifficultyAr: string;
  UserId: number;
  File?: File | null;
};

function cropToFormData(payload: CropPayload): FormData {
  const fd = new FormData();
  fd.append("Season", payload.Season);
  fd.append("Name", payload.Name);
  fd.append("NameArabic", payload.NameArabic);
  fd.append("PlantingTimeEn", payload.PlantingTimeEn);
  fd.append("PlantingTimeAr", payload.PlantingTimeAr);
  fd.append("GrowthPeriodEn", payload.GrowthPeriodEn);
  fd.append("GrowthPeriodAr", payload.GrowthPeriodAr);
  fd.append("DifficultyEn", payload.DifficultyEn);
  fd.append("DifficultyAr", payload.DifficultyAr);
  fd.append("UserId", String(payload.UserId));
  if (payload.File) fd.append("File", payload.File);
  return fd;
}

export async function createCrop(payload: CropPayload): Promise<unknown> {
  return apiPost<unknown>("/Crops", cropToFormData(payload));
}

export async function updateCrop(id: number, payload: CropPayload): Promise<unknown> {
  return apiPut<unknown>(`/Crops/${id}`, cropToFormData(payload));
}

export async function deleteCrop(id: number): Promise<void> {
  await apiDelete(`/Crops/${id}`);
}
