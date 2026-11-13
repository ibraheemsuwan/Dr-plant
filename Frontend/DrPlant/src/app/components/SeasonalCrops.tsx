import {
  Leaf,
  Sprout,
  Sun,
  Snowflake,
  Clock,
  CalendarDays,
  BarChart2,
  Search,
  LayoutGrid,
  Droplets,
  Shovel,
  ShieldAlert,
  X,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import {
  CROPS_BY_SEASON,
  SEASON_IDS,
  type SeasonTabId,
  type SeasonalCropRow,
  resolveCropImageSrc,
  difficultyTextClass,
} from "../data/seasonalCropsData";
import {
  DRPLANT_CROPS_CHANGED,
  hiddenBuiltinKey,
  loadCustomCrops,
  loadHiddenBuiltins,
} from "../lib/cropsOverrideStorage";
import { DRPLANT_API_CROPS_CHANGED } from "../api/events";
import {
  mapApiCropDetailsDto,
  mapApiCropDto,
  type ApiCropCard,
  type ApiCropDetails,
} from "../api/cropsMap";
import * as cropsService from "../api/services/cropsService";
import { Reveal } from "./animations/Reveal";
import { PageLabel } from "./PageLabel";

type DisplayCrop = SeasonalCropRow & {
  listKey: string;
  season: SeasonTabId;
  apiId?: number;
};
type ResolvedCareGuide = {
  planting: string;
  watering: string;
  sunlight: string;
  soil: string;
  mistakes: string[];
};
function normalizeGuideName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/أ|إ|آ/g, "ا")
    .replace(/ة/g, "ه");
}

function CropPhoto({
  imageFile,
  alt,
  className,
}: {
  imageFile: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-primary/10 text-primary ${className ?? ""}`}
        aria-hidden
      >
        <Sprout className="w-12 h-12" />
      </div>
    );
  }
  return (
    <img
      src={resolveCropImageSrc(imageFile)}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function buildMergedCrops(): Record<SeasonTabId, DisplayCrop[]> {
  const hidden = loadHiddenBuiltins();
  const custom = loadCustomCrops();
  const result = {} as Record<SeasonTabId, DisplayCrop[]>;
  for (const sid of SEASON_IDS) {
    const base = (CROPS_BY_SEASON[sid] ?? []).filter(
      (c) => !hidden.has(hiddenBuiltinKey(sid, c.nameEn)),
    );
    const row: DisplayCrop[] = base.map((c) => ({
      ...c,
      listKey: `b:${sid}:${c.nameEn}`,
      season: sid,
    }));
    for (const cu of custom.filter((x) => x.season === sid)) {
      const { id, season: _season, ...rest } = cu;
      row.push({ ...rest, listKey: id, season: sid });
    }
    result[sid] = row;
  }
  return result;
}

export function SeasonalCrops() {
  const { t, language } = useLanguage();
  const [selectedSeason, setSelectedSeason] = useState<"all" | SeasonTabId>(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [cropVersion, setCropVersion] = useState(0);
  const [apiCrops, setApiCrops] = useState<ApiCropCard[]>([]);
  const [apiCropDetails, setApiCropDetails] = useState<ApiCropDetails[]>([]);
  const [selectedCrop, setSelectedCrop] = useState<DisplayCrop | null>(null);
  const mergeCropDetails = useCallback((rows: ApiCropDetails[]) => {
    setApiCropDetails((prev) => {
      const map = new Map<number, ApiCropDetails>();
      for (const row of prev) map.set(row.cropId, row);
      for (const row of rows) map.set(row.cropId, row);
      return Array.from(map.values());
    });
  }, []);

  const loadApiCrops = useCallback(async () => {
    try {
      const raw = await cropsService.listCropsRaw();
      const cards = raw
        .map((r) => mapApiCropDto(r))
        .filter((c): c is ApiCropCard => c != null);
      setApiCrops(cards);
      const embeddedDetails = cards
        .map((c) => c.detailsFromCrop)
        .filter((d): d is ApiCropDetails => d != null);
      if (embeddedDetails.length > 0) {
        mergeCropDetails(embeddedDetails);
      }
    } catch {
      setApiCrops([]);
    }
  }, [mergeCropDetails]);

  const loadApiCropDetails = useCallback(async () => {
    try {
      const raw = await cropsService.listCropDetailsRaw();
      const mapped = raw
        .map((r) => mapApiCropDetailsDto(r))
        .filter((d): d is ApiCropDetails => d != null);
      mergeCropDetails(mapped);
    } catch {
      setApiCropDetails([]);
    }
  }, [mergeCropDetails]);

  useEffect(() => {
    void loadApiCrops();
    void loadApiCropDetails();
  }, [loadApiCrops, loadApiCropDetails]);

  useEffect(() => {
    const onChange = () => setCropVersion((v) => v + 1);
    window.addEventListener(DRPLANT_CROPS_CHANGED, onChange);
    return () => window.removeEventListener(DRPLANT_CROPS_CHANGED, onChange);
  }, []);

  useEffect(() => {
    const onApi = () => {
      void loadApiCrops();
      void loadApiCropDetails();
    };
    window.addEventListener(DRPLANT_API_CROPS_CHANGED, onApi);
    return () => window.removeEventListener(DRPLANT_API_CROPS_CHANGED, onApi);
  }, [loadApiCrops, loadApiCropDetails]);

  const mergedBySeason = useMemo(() => {
    const base = buildMergedCrops();
    const out = { ...base } as Record<SeasonTabId, DisplayCrop[]>;
    for (const sid of SEASON_IDS) {
      const fromApi = apiCrops.filter((c) => c.season === sid);
      out[sid] = [...(out[sid] ?? []), ...fromApi];
    }
    return out;
  }, [cropVersion, apiCrops]);

  const allCropsList = useMemo(
    () => SEASON_IDS.flatMap((id) => mergedBySeason[id] ?? []),
    [mergedBySeason],
  );

  const seasons: {
    id: SeasonTabId;
    name: string;
    icon: ReactNode;
    color: string;
    bg: string;
    text: string;
    emoji: string;
  }[] = [
    {
      id: "spring",
      name: t("spring"),
      icon: <Leaf className="w-5 h-5" />,
      color: "from-emerald-500 to-green-600",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      text: "text-emerald-700 dark:text-emerald-400",
      emoji: "🌸",
    },
    {
      id: "summer",
      name: t("summer"),
      icon: <Sun className="w-5 h-5" />,
      color: "from-amber-500 to-orange-500",
      bg: "bg-amber-50 dark:bg-amber-950/30",
      text: "text-amber-700 dark:text-amber-400",
      emoji: "☀️",
    },
    {
      id: "autumn",
      name: t("autumn"),
      icon: <Sprout className="w-5 h-5" />,
      color: "from-orange-500 to-red-500",
      bg: "bg-orange-50 dark:bg-orange-950/30",
      text: "text-orange-700 dark:text-orange-400",
      emoji: "🍂",
    },
    {
      id: "winter",
      name: t("winter"),
      icon: <Snowflake className="w-5 h-5" />,
      color: "from-blue-500 to-cyan-500",
      bg: "bg-blue-50 dark:bg-blue-950/30",
      text: "text-blue-700 dark:text-blue-400",
      emoji: "❄️",
    },
  ];

  const selectedCrops =
    selectedSeason === "all"
      ? allCropsList
      : (mergedBySeason[selectedSeason] ?? []);

  const filteredCrops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return selectedCrops;
    return selectedCrops.filter(
      (c) =>
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.includes(searchQuery.trim()),
    );
  }, [selectedCrops, searchQuery]);

  useEffect(() => {
    if (!selectedCrop) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCrop(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedCrop]);

  const selectedSeasonMeta =
    selectedCrop != null
      ? (seasons.find((s) => s.id === selectedCrop.season) ?? null)
      : null;

  const apiCropDetailsByCropId = useMemo(() => {
    const map = new Map<number, ApiCropDetails>();
    for (const row of apiCropDetails) {
      if (!map.has(row.cropId)) {
        map.set(row.cropId, row);
      }
    }
    return map;
  }, [apiCropDetails]);

  const apiCropDetailsByName = useMemo(() => {
    const map = new Map<string, ApiCropDetails>();
    for (const crop of apiCrops) {
      const details = apiCropDetailsByCropId.get(crop.apiId);
      if (!details) continue;
      for (const key of [
        normalizeGuideName(crop.nameEn),
        normalizeGuideName(crop.nameAr),
      ]) {
        if (key && !map.has(key)) {
          map.set(key, details);
        }
      }
    }
    return map;
  }, [apiCrops, apiCropDetailsByCropId]);

  const toGuide = useCallback(
    (details: ApiCropDetails, isAr: boolean): ResolvedCareGuide => ({
      planting: isAr ? details.plantingMethodAr : details.plantingMethodEn,
      watering: isAr ? details.wateringPlanAr : details.wateringPlanEn,
      sunlight: isAr ? details.sunlightAr : details.sunlightEn,
      soil: isAr ? details.soilAndFertilizingAr : details.soilAndFertilizingEn,
      mistakes: (isAr ? details.avoidMistakesAr : details.avoidMistakesEn)
        .split(/\r?\n|•|-/)
        .map((s) => s.trim())
        .filter(Boolean),
    }),
    [],
  );

  const careGuide = useMemo(() => {
    if (!selectedCrop) return null;
    const isAr = language === "ar";
    const fromCropId =
      selectedCrop.apiId != null
        ? (apiCropDetailsByCropId.get(selectedCrop.apiId) ?? null)
        : null;
    if (fromCropId) {
      return toGuide(fromCropId, isAr);
    }
    const fromName =
      apiCropDetailsByName.get(normalizeGuideName(selectedCrop.nameEn)) ??
      apiCropDetailsByName.get(normalizeGuideName(selectedCrop.nameAr)) ??
      null;
    if (fromName) {
      return toGuide(fromName, isAr);
    }
    return null;
  }, [
    selectedCrop,
    language,
    apiCropDetailsByCropId,
    apiCropDetailsByName,
    toGuide,
  ]);

  const openCropModal = (crop: DisplayCrop) => setSelectedCrop(crop);

  return (
    <div className="relative min-h-screen py-12 px-4 bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 inset-s-[10%] h-80 w-80 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute top-1/4 -inset-e-24 h-72 w-72 rounded-full bg-primary/10 blur-[105px]" />
        <div className="absolute -bottom-24 inset-s-[30%] h-72 w-72 rounded-full bg-lime-400/8 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_78%_55%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      </div>
      <Reveal variant="rise">
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <PageLabel icon={Sprout}>
              {language === "ar" ? "دليل المحاصيل" : "Crop Guide"}
            </PageLabel>
            <h1
              className="text-5xl font-bold mb-4"
              style={{
                fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
              }}
            >
              {t("seasonalCropsTitle")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === "ar"
                ? "اعرف أفضل المحاصيل للزراعة في كل موسم"
                : "Know the best crops to grow in each season"}
            </p>
          </div>

          {/* Season + all crops selector */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setSelectedSeason("all")}
              className={`relative rounded-2xl border-2 px-3 py-3 sm:px-4 sm:py-3.5 transition-all ${
                selectedSeason === "all"
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="mb-1.5 sm:mb-2 flex justify-center text-primary">
                <LayoutGrid className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={2} />
              </div>
              <p
                className={`text-sm font-semibold leading-tight ${selectedSeason === "all" ? "text-primary" : ""}`}
              >
                {language === "ar" ? "كل المحاصيل" : "All crops"}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {allCropsList.length} {language === "ar" ? "محصول" : "crops"}
              </p>
            </button>
            {seasons.map((season) => (
              <button
                key={season.id}
                type="button"
                onClick={() => setSelectedSeason(season.id)}
                className={`relative rounded-2xl border-2 px-3 py-3 sm:px-4 sm:py-3.5 transition-all ${
                  selectedSeason === season.id
                    ? `border-primary ${season.bg} shadow-sm`
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="text-2xl mb-1.5 sm:mb-2">{season.emoji}</div>
                <p
                  className={`text-sm font-semibold leading-tight ${selectedSeason === season.id ? season.text : ""}`}
                >
                  {season.name}
                </p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                  {(mergedBySeason[season.id] ?? []).length}{" "}
                  {language === "ar" ? "محصول" : "crops"}
                </p>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Search
              className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === "ar"
                  ? "ابحث عن محصول بالاسم..."
                  : "Search crops by name..."
              }
              className="w-full rounded-2xl border border-border bg-card py-2.5 ps-10 pe-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              aria-label={language === "ar" ? "بحث عن محصول" : "Search crops"}
            />
          </div>

          {/* Crops Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCrops.length === 0 ? (
              <p className="col-span-full py-12 text-center text-muted-foreground text-sm">
                {language === "ar"
                  ? "لا توجد محاصيل تطابق البحث."
                  : "No crops match your search."}
              </p>
            ) : null}
            {filteredCrops.map((crop) => {
              const name = language === "ar" ? crop.nameAr : crop.nameEn;
              const months =
                language === "ar" ? crop.plantingAr : crop.plantingEn;
              const growth = language === "ar" ? crop.growthAr : crop.growthEn;
              const difficulty =
                language === "ar" ? crop.difficultyAr : crop.difficultyEn;
              const growthLabel =
                language === "ar" ? "مدة النمو" : "Growth Period";
              const difficultyLabel =
                language === "ar" ? "الصعوبة" : "Difficulty";
              return (
                <button
                  key={crop.listKey}
                  type="button"
                  onClick={() => openCropModal(crop)}
                  className="group block w-full text-start bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={
                    language === "ar"
                      ? `عرض تفاصيل المحصول — ${name}`
                      : `View crop details — ${name}`
                  }
                >
                  <div className="relative aspect-3/2 w-full overflow-hidden bg-muted">
                    <CropPhoto
                      imageFile={crop.imageFile}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6">
                    <h3
                      className="text-xl font-bold mb-4 text-center text-brand-dark dark:text-foreground"
                      style={{
                        fontFamily:
                          "'Playfair Display', 'Noto Kufi Arabic', serif",
                      }}
                    >
                      {name}
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <CalendarDays className="w-4 h-4 shrink-0" />
                          <span>{t("plantingTime")}</span>
                        </div>
                        <span className="font-semibold text-foreground text-end shrink-0">
                          {months}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{growthLabel}</span>
                        </div>
                        <span className="font-semibold text-foreground text-end shrink-0">
                          {growth}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-3">
                        <div className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <BarChart2 className="w-4 h-4 shrink-0" />
                          <span>{difficultyLabel}</span>
                        </div>
                        <span
                          className={`font-semibold text-end shrink-0 ${difficultyTextClass(crop.difficultyLevel)}`}
                        >
                          {difficulty}
                        </span>
                      </div>
                      <div className="flex gap-1 pt-1">
                        {[1, 2, 3].map((level) => (
                          <div
                            key={level}
                            className={`flex-1 h-1.5 rounded-full ${
                              level <= crop.difficultyLevel
                                ? "bg-primary"
                                : "bg-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tips Section */}
          <div className="mt-12 bg-card border border-border rounded-3xl p-8">
            <h2
              className="text-2xl font-bold mb-8"
              style={{
                fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
              }}
            >
              {language === "ar"
                ? "نصائح زراعية للموسم الحالي"
                : "Farming Tips for Current Season"}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  icon: "☀️",
                  title: language === "ar" ? "التعرض للشمس" : "Sun Exposure",
                  desc:
                    language === "ar"
                      ? "تأكد من حصول المحاصيل على 6-8 ساعات من الشمس يومياً"
                      : "Ensure crops receive 6-8 hours of sunlight daily",
                },
                {
                  icon: "🌱",
                  title: language === "ar" ? "جودة التربة" : "Soil Quality",
                  desc:
                    language === "ar"
                      ? "استخدم تربة غنية بالمواد العضوية وجيدة الصرف"
                      : "Use soil rich in organic matter with good drainage",
                },
                {
                  icon: "💧",
                  title:
                    language === "ar" ? "الري المنتظم" : "Regular Watering",
                  desc:
                    language === "ar"
                      ? "اري نباتاتك في الصباح الباكر لتجنب تبخر الماء"
                      : "Water your plants early morning to prevent evaporation",
                },
                {
                  icon: "🪲",
                  title: language === "ar" ? "مكافحة الآفات" : "Pest Control",
                  desc:
                    language === "ar"
                      ? "راقب نباتاتك بانتظام واستخدم طرقاً طبيعية للمكافحة"
                      : "Monitor your plants regularly and use natural pest control methods",
                },
              ].map((tip, index) => (
                <div
                  key={index}
                  className="flex gap-4 items-start p-4 bg-muted/35 border border-border/70 dark:border-white/10 rounded-2xl shadow-sm"
                >
                  <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-sm border border-border/70 dark:border-white/10">
                    {tip.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{tip.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {tip.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Reveal>

      {selectedCrop
        ? createPortal(
            <div
              className="fixed inset-0 z-100 overflow-y-auto p-3 sm:p-4"
              role="dialog"
              aria-modal="true"
              aria-label={language === "ar" ? "تفاصيل المحصول" : "Crop Details"}
            >
              <button
                type="button"
                onClick={() => setSelectedCrop(null)}
                className="animate-dr-modal-backdrop absolute inset-0 bg-black/45 backdrop-blur-[2px]"
                aria-label={language === "ar" ? "إغلاق" : "Close"}
              />
              <div className="relative z-10 flex min-h-full items-center justify-center">
                <div
                  className="animate-dr-modal-panel w-full max-w-3xl max-h-[calc(100vh-1rem)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-card shadow-2xl sm:max-h-[calc(100vh-2rem)]"
                  dir={language === "ar" ? "rtl" : "ltr"}
                >
                  <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {selectedSeasonMeta?.emoji} {selectedSeasonMeta?.name}
                      </p>
                      <h3
                        className="truncate text-xl font-bold"
                        style={{
                          fontFamily:
                            "'Playfair Display', 'Noto Kufi Arabic', serif",
                        }}
                      >
                        {language === "ar"
                          ? selectedCrop.nameAr
                          : selectedCrop.nameEn}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCrop(null)}
                      className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
                      aria-label={language === "ar" ? "إغلاق" : "Close"}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div
                        className={`overflow-hidden rounded-2xl border border-border bg-muted ${
                          language === "ar" ? "md:order-2" : ""
                        }`}
                      >
                        <CropPhoto
                          imageFile={selectedCrop.imageFile}
                          alt={
                            language === "ar"
                              ? selectedCrop.nameAr
                              : selectedCrop.nameEn
                          }
                          className="h-56 w-full object-cover"
                        />
                      </div>
                      <div
                        className={`space-y-3 rounded-2xl border border-border bg-muted/20 p-4 ${
                          language === "ar" ? "md:order-1" : ""
                        }`}
                      >
                        <div
                          className={`flex items-center justify-between text-sm ${
                            language === "ar" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="h-4 w-4" />
                            {t("plantingTime")}
                          </span>
                          <span className="font-semibold">
                            {language === "ar"
                              ? selectedCrop.plantingAr
                              : selectedCrop.plantingEn}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between text-sm ${
                            language === "ar" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {language === "ar" ? "مدة النمو" : "Growth Period"}
                          </span>
                          <span className="font-semibold">
                            {language === "ar"
                              ? selectedCrop.growthAr
                              : selectedCrop.growthEn}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-between text-sm ${
                            language === "ar" ? "flex-row-reverse" : ""
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 text-muted-foreground">
                            <BarChart2 className="h-4 w-4" />
                            {language === "ar" ? "الصعوبة" : "Difficulty"}
                          </span>
                          <span
                            className={`font-semibold ${difficultyTextClass(selectedCrop.difficultyLevel)}`}
                          >
                            {language === "ar"
                              ? selectedCrop.difficultyAr
                              : selectedCrop.difficultyEn}
                          </span>
                        </div>
                        <div className="flex gap-1 pt-1">
                          {[1, 2, 3].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full ${
                                level <= selectedCrop.difficultyLevel
                                  ? "bg-primary"
                                  : "bg-muted"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      {careGuide ? (
                        [
                          {
                            icon: <Leaf className="h-4 w-4 text-primary" />,
                            title:
                              language === "ar"
                                ? "طريقة الزراعة"
                                : "Planting Method",
                            text: careGuide.planting,
                          },
                          {
                            icon: <Droplets className="h-4 w-4 text-sky-500" />,
                            title:
                              language === "ar" ? "خطة الري" : "Watering Plan",
                            text: careGuide.watering,
                          },
                          {
                            icon: <Sun className="h-4 w-4 text-amber-500" />,
                            title:
                              language === "ar" ? "الضوء المناسب" : "Sunlight",
                            text: careGuide.sunlight,
                          },
                          {
                            icon: (
                              <Shovel className="h-4 w-4 text-orange-500" />
                            ),
                            title:
                              language === "ar"
                                ? "التربة والتسميد"
                                : "Soil & Fertilizing",
                            text: careGuide.soil,
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-2xl border border-border bg-card p-4"
                          >
                            <p className="inline-flex items-center gap-2 text-sm font-semibold">
                              {item.icon}
                              {item.title}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                              {item.text}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div className="sm:col-span-2 rounded-2xl border border-border bg-muted/25 p-4 text-sm text-muted-foreground">
                          {language === "ar"
                            ? "لا توجد معلومات رعاية لهذا المحصول في قاعدة البيانات بعد."
                            : "No care details are available for this crop in the database yet."}
                        </div>
                      )}
                    </div>

                    {careGuide ? (
                      <div className="mt-4 rounded-2xl border border-border bg-muted/25 p-4">
                        <p className="inline-flex items-center gap-2 text-sm font-semibold">
                          <ShieldAlert className="h-4 w-4 text-rose-500" />
                          {language === "ar"
                            ? "تجنب هذه الأخطاء"
                            : "Avoid These Mistakes"}
                        </p>
                        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {careGuide.mistakes.map((mistake) => (
                            <li key={mistake}>• {mistake}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
