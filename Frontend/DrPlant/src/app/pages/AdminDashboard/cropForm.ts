import type { SeasonTabId } from "../../data/seasonalCropsData";

export type CropFormState = {
  season: SeasonTabId;
  nameEn: string;
  nameAr: string;
  plantingEn: string;
  plantingAr: string;
  growthEn: string;
  growthAr: string;
  difficultyEn: string;
  difficultyAr: string;
  plantingMethodEn: string;
  plantingMethodAr: string;
  wateringPlanEn: string;
  wateringPlanAr: string;
  sunlightNeedsEn: string;
  sunlightNeedsAr: string;
  soilAndFertilizingEn: string;
  soilAndFertilizingAr: string;
  avoidMistakesEn: string;
  avoidMistakesAr: string;
  difficultyLevel: 1 | 2 | 3;
  imagePreview: string;
};

export const INITIAL_CROP_FORM: CropFormState = {
  season: "spring",
  nameEn: "",
  nameAr: "",
  plantingEn: "",
  plantingAr: "",
  growthEn: "",
  growthAr: "",
  difficultyEn: "",
  difficultyAr: "",
  plantingMethodEn: "",
  plantingMethodAr: "",
  wateringPlanEn: "",
  wateringPlanAr: "",
  sunlightNeedsEn: "",
  sunlightNeedsAr: "",
  soilAndFertilizingEn: "",
  soilAndFertilizingAr: "",
  avoidMistakesEn: "",
  avoidMistakesAr: "",
  difficultyLevel: 2,
  imagePreview: "",
};
