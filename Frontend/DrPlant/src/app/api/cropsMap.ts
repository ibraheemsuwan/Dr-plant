import type { SeasonTabId, SeasonalCropRow } from "../data/seasonalCropsData";
import { resolveMediaUrl } from "./mappers";
import { pickNum, pickStr } from "./utils";

export type ApiCropCard = SeasonalCropRow & {
  listKey: string;
  apiId: number;
  season: SeasonTabId;
  detailsFromCrop?: ApiCropDetails | null;
};

export type ApiCropDetails = {
  cropId: number;
  plantingMethodEn: string;
  plantingMethodAr: string;
  wateringPlanEn: string;
  wateringPlanAr: string;
  sunlightEn: string;
  sunlightAr: string;
  soilAndFertilizingEn: string;
  soilAndFertilizingAr: string;
  avoidMistakesEn: string;
  avoidMistakesAr: string;
};

const SEASONS: SeasonTabId[] = ["spring", "summer", "autumn", "winter"];

function normalizeSeason(raw: string): SeasonTabId {
  const s = raw.trim().toLowerCase();
  if (SEASONS.includes(s as SeasonTabId)) return s as SeasonTabId;
  return "spring";
}

function levelFromDifficultyText(raw: string): 1 | 2 | 3 {
  const s = raw.trim().toLowerCase();
  if (s.includes("easy") || s.includes("سهل")) return 1;
  if (s.includes("hard") || s.includes("صعب")) return 3;
  return 2;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : null;
}

export function mapApiCropDto(d: Record<string, unknown>): ApiCropCard | null {
  const id = pickNum(
    d,
    "id",
    "Id",
    "ID",
    "cropId",
    "CropId",
    "cropID",
    "CropID",
    "cropid",
  );
  if (!Number.isFinite(id)) return null;
  const season = normalizeSeason(pickStr(d, "season", "Season") || "spring");
  const imageUrl =
    pickStr(d, "imageUrl", "ImageUrl") ||
    pickStr(d, "imageFile", "ImageFile") ||
    "";
  const resolved = resolveMediaUrl(imageUrl) ?? imageUrl;
  const diffEn = pickStr(d, "DifficultyEn", "difficultyEn");
  const nestedDetails =
    asRecord(d.CropDetails) ??
    asRecord(d.cropDetails) ??
    asRecord(d.Details) ??
    asRecord(d.details) ??
    asRecord(d.CropDetail) ??
    asRecord(d.cropDetail);
  const detailsFromCrop =
    mapApiCropDetailsDto(d, id) ??
    (nestedDetails ? mapApiCropDetailsDto(nestedDetails, id) : null);
  return {
    apiId: id,
    listKey: `api:${id}`,
    season,
    imageFile: resolved.trim() ? resolved : "placeholder",
    // Backend stores English name in `Name`
    nameEn:
      pickStr(d, "Name", "name", "nameEn", "NameEn", "nameEN", "NameEN") ||
      "Crop",
    nameAr:
      pickStr(
        d,
        "NameArabic",
        "nameArabic",
        "nameAr",
        "NameAr",
        "nameAR",
        "NameAR",
      ) ||
      pickStr(d, "Name", "name") ||
      "محصول",
    plantingEn:
      pickStr(
        d,
        "PlantingTimeEn",
        "plantingTimeEn",
        "plantingEn",
        "PlantingEn",
      ) || "—",
    plantingAr:
      pickStr(
        d,
        "PlantingTimeAr",
        "plantingTimeAr",
        "plantingAr",
        "PlantingAr",
      ) || "—",
    growthEn:
      pickStr(d, "GrowthPeriodEn", "growthPeriodEn", "growthEn", "GrowthEn") ||
      "—",
    growthAr:
      pickStr(d, "GrowthPeriodAr", "growthPeriodAr", "growthAr", "GrowthAr") ||
      "—",
    difficultyEn: pickStr(d, "DifficultyEn", "difficultyEn") || "—",
    difficultyAr: pickStr(d, "DifficultyAr", "difficultyAr") || "—",
    // Not sent to backend; derived for UI coloring only.
    difficultyLevel: levelFromDifficultyText(diffEn),
    detailsFromCrop,
  };
}

export function mapApiCropDetailsDto(
  d: Record<string, unknown>,
  fallbackCropId?: number,
): ApiCropDetails | null {
  const cropId = pickNum(
    d,
    "CropId",
    "cropId",
    "CropID",
    "cropID",
    "cropid",
    "Id",
    "id",
    "ID",
  );
  const resolvedCropId = Number.isFinite(cropId) ? cropId : fallbackCropId;
  if (!Number.isFinite(resolvedCropId)) return null;
  const ensuredCropId = resolvedCropId as number;
  const plantingMethodEn = pickStr(d, "PlantingMethodEn", "plantingMethodEn");
  const plantingMethodAr = pickStr(d, "PlantingMethodAr", "plantingMethodAr");
  const wateringPlanEn = pickStr(d, "WateringPlanEn", "wateringPlanEn");
  const wateringPlanAr = pickStr(d, "WateringPlanAr", "wateringPlanAr");
  const sunlightEn = pickStr(d, "SunlightEn", "sunlightEn");
  const sunlightAr = pickStr(d, "SunlightAr", "sunlightAr");
  const soilAndFertilizingEn = pickStr(
    d,
    "SoilAndFertilizingEn",
    "soilAndFertilizingEn",
  );
  const soilAndFertilizingAr = pickStr(
    d,
    "SoilAndFertilizingAr",
    "soilAndFertilizingAr",
  );
  const avoidMistakesEn = pickStr(d, "AvoidMistakesEn", "avoidMistakesEn");
  const avoidMistakesAr = pickStr(d, "AvoidMistakesAr", "avoidMistakesAr");
  const hasAnyDetails = [
    plantingMethodEn,
    plantingMethodAr,
    wateringPlanEn,
    wateringPlanAr,
    sunlightEn,
    sunlightAr,
    soilAndFertilizingEn,
    soilAndFertilizingAr,
    avoidMistakesEn,
    avoidMistakesAr,
  ].some((v) => v.trim() !== "");
  if (!hasAnyDetails) return null;
  return {
    cropId: ensuredCropId,
    plantingMethodEn,
    plantingMethodAr,
    wateringPlanEn,
    wateringPlanAr,
    sunlightEn,
    sunlightAr,
    soilAndFertilizingEn,
    soilAndFertilizingAr,
    avoidMistakesEn,
    avoidMistakesAr,
  };
}
