export type SeasonalCropRow = {
  imageFile: string;
  nameEn: string;
  nameAr: string;
  plantingEn: string;
  plantingAr: string;
  growthEn: string;
  growthAr: string;
  difficultyEn: string;
  difficultyAr: string;
  difficultyLevel: 1 | 2 | 3;
};

export function cropAssetUrl(imageFile: string) {
  return `/assets/crops/${imageFile
    .split("/")
    .map((p) => encodeURIComponent(p))
    .join("/")}`;
}

export function resolveCropImageSrc(imageFile: string): string {
  if (/^(data:|blob:|https?:\/\/)/i.test(imageFile)) return imageFile;
  return cropAssetUrl(imageFile);
}

export const CROPS_BY_SEASON: Record<string, SeasonalCropRow[]> = {
  winter: [],
  spring: [],
  summer: [],
  autumn: [],
};

export const SEASON_IDS = ["spring", "summer", "autumn", "winter"] as const;
export type SeasonTabId = (typeof SEASON_IDS)[number];

export const ALL_CROPS_LIST: SeasonalCropRow[] = SEASON_IDS.flatMap(
  (id) => CROPS_BY_SEASON[id] ?? [],
);

export function difficultyTextClass(level: 1 | 2 | 3) {
  if (level === 1) return "text-green-600 dark:text-green-500";
  if (level === 2) return "text-amber-600 dark:text-amber-500";
  return "text-red-600 dark:text-red-500";
}
