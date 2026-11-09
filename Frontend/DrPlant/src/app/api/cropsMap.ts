import type { SeasonTabId, SeasonalCropRow } from "../data/seasonalCropsData";
import { resolveMediaUrl } from "./mappers";
import { pickNum, pickStr } from "./utils";

export type ApiCropCard = SeasonalCropRow & {
  listKey: string;
  apiId: number;
  season: SeasonTabId;
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

export function mapApiCropDto(d: Record<string, unknown>): ApiCropCard | null {
  const id = pickNum(d, "id", "Id", "cropId", "CropId");
  if (!Number.isFinite(id)) return null;
  const season = normalizeSeason(pickStr(d, "season", "Season") || "spring");
  const imageUrl =
    pickStr(d, "imageUrl", "ImageUrl") || pickStr(d, "imageFile", "ImageFile") || "";
  const resolved = resolveMediaUrl(imageUrl) ?? imageUrl;
  const diffEn = pickStr(d, "DifficultyEn", "difficultyEn");
  return {
    apiId: id,
    listKey: `api:${id}`,
    season,
    imageFile: resolved.trim() ? resolved : "placeholder",
    // Backend stores English name in `Name`
    nameEn: pickStr(d, "Name", "name", "nameEn", "NameEn") || "Crop",
    nameAr:
      pickStr(d, "NameArabic", "nameArabic", "nameAr", "NameAr") ||
      pickStr(d, "Name", "name") ||
      "محصول",
    plantingEn: pickStr(d, "PlantingTimeEn", "plantingTimeEn", "plantingEn", "PlantingEn") || "—",
    plantingAr: pickStr(d, "PlantingTimeAr", "plantingTimeAr", "plantingAr", "PlantingAr") || "—",
    growthEn: pickStr(d, "GrowthPeriodEn", "growthPeriodEn", "growthEn", "GrowthEn") || "—",
    growthAr: pickStr(d, "GrowthPeriodAr", "growthPeriodAr", "growthAr", "GrowthAr") || "—",
    difficultyEn: pickStr(d, "DifficultyEn", "difficultyEn") || "—",
    difficultyAr: pickStr(d, "DifficultyAr", "difficultyAr") || "—",
    // Not sent to backend; derived for UI coloring only.
    difficultyLevel: levelFromDifficultyText(diffEn),
  };
}
