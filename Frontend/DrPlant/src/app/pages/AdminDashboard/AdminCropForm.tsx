import type { Dispatch, FormEvent, SetStateAction } from "react";
import { SEASON_IDS, type SeasonTabId } from "../../data/seasonalCropsData";
import { ADMIN_HEADING_FONT } from "./constants";
import type { CropFormState } from "./cropForm";

type AdminCropFormProps = {
  language: "ar" | "en";
  t: (key: string) => string;
  cropForm: CropFormState;
  setCropForm: Dispatch<SetStateAction<CropFormState>>;
  seasonLabel: (s: SeasonTabId) => string;
  submitting: boolean;
  onSubmit: (e: FormEvent) => void;
  onImageFile: (file: File | null) => void;
};

export function AdminCropForm({
  language,
  t,
  cropForm,
  setCropForm,
  seasonLabel,
  submitting,
  onSubmit,
  onImageFile,
}: AdminCropFormProps) {
  return (
    <section className="rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="p-4 sm:p-6 md:p-8">
        <h3
          className="text-base sm:text-lg font-semibold mb-4"
          style={{ fontFamily: ADMIN_HEADING_FONT }}
        >
          {t("adminAddCrop")}
        </h3>
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="grid sm:grid-cols-2 gap-4"
        >
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-primary mb-1 block">
              {t("adminSelectSeason")}
            </label>
            <select
              value={cropForm.season}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  season: e.target.value as SeasonTabId,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
            >
              {SEASON_IDS.map((s) => (
                <option key={s} value={s}>
                  {seasonLabel(s)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("firstName")} (EN)
            </label>
            <input
              value={cropForm.nameEn}
              onChange={(e) =>
                setCropForm((f) => ({ ...f, nameEn: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              placeholder="Tomato"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar" ? "الاسم بالعربية" : "Name (Arabic)"}
            </label>
            <input
              value={cropForm.nameAr}
              onChange={(e) =>
                setCropForm((f) => ({ ...f, nameAr: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("plantingTime")} (EN)
            </label>
            <input
              value={cropForm.plantingEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  plantingEn: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("plantingTime")} (AR)
            </label>
            <input
              value={cropForm.plantingAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  plantingAr: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("adminGrowthPeriod")} (EN)
            </label>
            <input
              value={cropForm.growthEn}
              onChange={(e) =>
                setCropForm((f) => ({ ...f, growthEn: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("adminGrowthPeriod")} (AR)
            </label>
            <input
              value={cropForm.growthAr}
              onChange={(e) =>
                setCropForm((f) => ({ ...f, growthAr: e.target.value }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("difficulty")} (EN)
            </label>
            <input
              value={cropForm.difficultyEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  difficultyEn: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {t("difficulty")} (AR)
            </label>
            <input
              value={cropForm.difficultyAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  difficultyAr: e.target.value,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
              dir="rtl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium mb-1 block">
              {t("difficulty")} (1–3)
            </label>
            <select
              value={cropForm.difficultyLevel}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  difficultyLevel: Number(e.target.value) as 1 | 2 | 3,
                }))
              }
              className="w-full rounded-xl border border-border bg-background px-4 py-3"
            >
              <option value={1}>{t("adminDifficultyEasy")}</option>
              <option value={2}>{t("adminDifficultyMedium")}</option>
              <option value={3}>{t("adminDifficultyHard")}</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
              <p className="text-sm font-semibold text-primary mb-1">
                {language === "ar"
                  ? "معلومات رعاية المحصول (إجباري)"
                  : "Crop care details (required)"}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === "ar"
                  ? "أدخل المعلومات بالعربي والإنجليزي حتى تظهر في نافذة تفاصيل المحصول."
                  : "Fill both Arabic and English care info to show in the crop details popup."}
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "طريقة الزراعة (EN)"
                : "Planting Method (EN)"}
            </label>
            <textarea
              value={cropForm.plantingMethodEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  plantingMethodEn: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="How to plant this crop..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "طريقة الزراعة (AR)"
                : "Planting Method (AR)"}
            </label>
            <textarea
              value={cropForm.plantingMethodAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  plantingMethodAr: e.target.value,
                }))
              }
              rows={3}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="طريقة زراعة هذا المحصول..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar" ? "خطة الري (EN)" : "Watering Plan (EN)"}
            </label>
            <textarea
              value={cropForm.wateringPlanEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  wateringPlanEn: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="Watering schedule and notes..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar" ? "خطة الري (AR)" : "Watering Plan (AR)"}
            </label>
            <textarea
              value={cropForm.wateringPlanAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  wateringPlanAr: e.target.value,
                }))
              }
              rows={3}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="خطة الري والملاحظات..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar" ? "الضوء المناسب (EN)" : "Sunlight (EN)"}
            </label>
            <textarea
              value={cropForm.sunlightNeedsEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  sunlightNeedsEn: e.target.value,
                }))
              }
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-20"
              placeholder="Sunlight needs..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar" ? "الضوء المناسب (AR)" : "Sunlight (AR)"}
            </label>
            <textarea
              value={cropForm.sunlightNeedsAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  sunlightNeedsAr: e.target.value,
                }))
              }
              rows={2}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-20"
              placeholder="احتياج الضوء..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "التربة والتسميد (EN)"
                : "Soil & Fertilizing (EN)"}
            </label>
            <textarea
              value={cropForm.soilAndFertilizingEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  soilAndFertilizingEn: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="Soil and fertilizing recommendations..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "التربة والتسميد (AR)"
                : "Soil & Fertilizing (AR)"}
            </label>
            <textarea
              value={cropForm.soilAndFertilizingAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  soilAndFertilizingAr: e.target.value,
                }))
              }
              rows={3}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-24"
              placeholder="تفاصيل التربة والتسميد..."
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "تجنب هذه الأخطاء (EN)"
                : "Avoid mistakes (EN)"}
            </label>
            <textarea
              value={cropForm.avoidMistakesEn}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  avoidMistakesEn: e.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-28"
              placeholder="One mistake per line"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">
              {language === "ar"
                ? "تجنب هذه الأخطاء (AR)"
                : "Avoid mistakes (AR)"}
            </label>
            <textarea
              value={cropForm.avoidMistakesAr}
              onChange={(e) =>
                setCropForm((f) => ({
                  ...f,
                  avoidMistakesAr: e.target.value,
                }))
              }
              rows={4}
              dir="rtl"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 resize-y min-h-28"
              placeholder="اكتب كل خطأ في سطر"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-primary mb-1 block">
              {t("adminCropImage")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onImageFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-muted-foreground file:me-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
            />
            {cropForm.imagePreview ? (
              <img
                src={cropForm.imagePreview}
                alt=""
                className="mt-3 h-32 w-full max-w-xs rounded-xl object-cover border border-border"
              />
            ) : null}
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? (
                <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : null}
              {t("adminSaveCrop")}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
