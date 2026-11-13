import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Leaf, Trash2 } from "lucide-react";
import type { ApiCropCard } from "../../api/cropsMap";
import type { SeasonTabId } from "../../data/seasonalCropsData";
import { AdminPanelSearch } from "./AdminPanelSearch";
import { AdminCropForm } from "./AdminCropForm";
import { ADMIN_HEADING_FONT } from "./constants";
import type { CropFormState } from "./cropForm";

type AdminCropsTabProps = {
  language: "ar" | "en";
  t: (key: string) => string;
  cropsSearch: string;
  setCropsSearch: (v: string) => void;
  loadingCrops: boolean;
  apiCrops: ApiCropCard[];
  filteredAdminCrops: ApiCropCard[];
  submitting: boolean;
  onDeleteCrop: (row: ApiCropCard) => void;
  seasonLabel: (s: SeasonTabId) => string;
  cropForm: CropFormState;
  setCropForm: Dispatch<SetStateAction<CropFormState>>;
  onSubmitCrop: (e: FormEvent) => void;
  onCropImageFile: (file: File | null) => void;
};

export function AdminCropsTab({
  language,
  t,
  cropsSearch,
  setCropsSearch,
  loadingCrops,
  apiCrops,
  filteredAdminCrops,
  submitting,
  onDeleteCrop,
  seasonLabel,
  cropForm,
  setCropForm,
  onSubmitCrop,
  onCropImageFile,
}: AdminCropsTabProps) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
        <div
          className="h-1 w-full shrink-0 bg-linear-to-r from-emerald-600 via-primary to-teal-500 sm:h-1.5 md:h-2"
          aria-hidden
        />
        <div className="p-4 sm:p-6 md:p-8">
          <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
            <h2
              className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 min-w-0"
              style={{ fontFamily: ADMIN_HEADING_FONT }}
            >
              <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
              {t("adminCropsTitle")}
            </h2>
            <AdminPanelSearch
              language={language}
              value={cropsSearch}
              onChange={setCropsSearch}
              placeholderEn="Search season or name…"
              placeholderAr="ابحث بالموسم أو الاسم…"
              ariaLabelEn="Search crops"
              ariaLabelAr="بحث في المحاصيل"
            />
          </div>
          {loadingCrops ? (
            <div className="flex justify-center py-12">
              <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : apiCrops.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-6">
              {language === "ar"
                ? "لا توجد محاصيل على الخادم بعد."
                : "No crops on the server yet."}
            </p>
          ) : filteredAdminCrops.length === 0 ? (
            <p className="text-muted-foreground text-sm mb-6">
              {language === "ar"
                ? "لا توجد نتائج مطابقة للبحث."
                : "No results match your search."}
            </p>
          ) : (
            <div className="-mx-1 overflow-x-auto rounded-xl sm:mx-0 sm:rounded-2xl border border-border max-h-72 overflow-y-auto">
              <table className="w-full min-w-[22rem] border-collapse text-sm">
                <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                  <tr className="border-b border-border">
                    <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold whitespace-nowrap">
                      {t("adminSelectSeason")}
                    </th>
                    <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold min-w-[8rem]">
                      {language === "ar" ? "الاسم" : "Name"}
                    </th>
                    <th
                      className="px-3 py-3 sm:px-4 text-end align-middle font-semibold w-14"
                      aria-hidden
                    />
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminCrops.map((row) => (
                    <tr
                      key={row.apiId}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-3 py-2 sm:px-4 text-start align-middle text-muted-foreground whitespace-nowrap">
                        {seasonLabel(row.season)}
                      </td>
                      <td className="px-3 py-2 sm:px-4 text-start align-middle break-words">
                        {language === "ar" ? row.nameAr : row.nameEn}
                      </td>
                      <td className="px-3 py-2 sm:px-4 text-end align-middle whitespace-nowrap">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void onDeleteCrop(row)}
                          className="text-destructive hover:bg-destructive/10 rounded-full p-2"
                          aria-label={t("adminDelete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <AdminCropForm
        language={language}
        t={t}
        cropForm={cropForm}
        setCropForm={setCropForm}
        seasonLabel={seasonLabel}
        submitting={submitting}
        onSubmit={onSubmitCrop}
        onImageFile={onCropImageFile}
      />
    </div>
  );
}
