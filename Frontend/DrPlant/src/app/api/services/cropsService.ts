import { apiDelete, apiGet, apiPost, apiPut } from "../http";
import { asArray } from "../utils";

export async function listCropsRaw(): Promise<Record<string, unknown>[]> {
  const data = await apiGet<unknown>("/Crops");
  return asArray<Record<string, unknown>>(data);
}

export async function listCropDetailsRaw(): Promise<Record<string, unknown>[]> {
  const paths = [
    "/CropDetails",
    "/cropdetails",
    "/Cropdetails",
    "/CropDetailses",
    "/cropdetailses",
    "/CropDetail",
    "/cropdetail",
  ];
  for (const path of paths) {
    try {
      const data = await apiGet<unknown>(path);
      const rows = asArray<Record<string, unknown>>(data);
      if (rows.length > 0) return rows;
    } catch {
      // Try the next candidate path; backend naming differs across setups.
    }
  }
  return [];
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

export type CropDetailsPayload = {
  CropId: number;
  PlantingMethodEn: string;
  PlantingMethodAr: string;
  WateringPlanEn: string;
  WateringPlanAr: string;
  SunlightEn: string;
  SunlightAr: string;
  SoilAndFertilizingEn: string;
  SoilAndFertilizingAr: string;
  AvoidMistakesEn: string;
  AvoidMistakesAr: string;
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

export async function createCropDetails(
  payload: CropDetailsPayload,
): Promise<unknown> {
  return apiPost<unknown>("/CropDetails", payload);
}

export async function updateCrop(
  id: number,
  payload: CropPayload,
): Promise<unknown> {
  return apiPut<unknown>(`/Crops/${id}`, cropToFormData(payload));
}

export async function deleteCrop(id: number): Promise<void> {
  await apiDelete(`/Crops/${id}`);
}

function pickFiniteNumber(
  row: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
    if (typeof raw === "string" && raw.trim()) {
      const n = Number(raw);
      if (Number.isFinite(n)) return Math.trunc(n);
    }
  }
  return null;
}

export async function deleteCropDetailsByCropId(cropId: number): Promise<void> {
  const rows = await listCropDetailsRaw();
  const matches = rows.filter((row) => {
    const id = pickFiniteNumber(
      row,
      "CropId",
      "cropId",
      "CropID",
      "cropID",
      "cropid",
    );
    return id === cropId;
  });

  if (matches.length === 0) return;

  const detailIds = matches
    .map((row) =>
      pickFiniteNumber(
        row,
        "CropDetailsId",
        "cropDetailsId",
        "CropDetailId",
        "cropDetailId",
        "Id",
        "id",
      ),
    )
    .filter((id): id is number => id != null && id > 0);

  const paths = [
    "/CropDetails",
    "/cropdetails",
    "/CropDetailses",
    "/cropdetailses",
    "/CropDetail",
    "/cropdetail",
  ];

  for (const detailId of detailIds) {
    for (const base of paths) {
      try {
        await apiDelete(`${base}/${detailId}`);
        break;
      } catch {
        // Try next endpoint variant.
      }
    }
  }
}
