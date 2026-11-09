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
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
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
import { mapApiCropDto, type ApiCropCard } from "../api/cropsMap";
import * as cropsService from "../api/services/cropsService";
import { Reveal } from "./animations/Reveal";

type DisplayCrop = SeasonalCropRow & { listKey: string };

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
    }));
    for (const cu of custom.filter((x) => x.season === sid)) {
      const { id, season: _season, ...rest } = cu;
      row.push({ ...rest, listKey: id });
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

  const loadApiCrops = useCallback(async () => {
    try {
      const raw = await cropsService.listCropsRaw();
      setApiCrops(
        raw
          .map((r) => mapApiCropDto(r))
          .filter((c): c is ApiCropCard => c != null),
      );
    } catch {
      setApiCrops([]);
    }
  }, []);

  useEffect(() => {
    void loadApiCrops();
  }, [loadApiCrops]);

  useEffect(() => {
    const onChange = () => setCropVersion((v) => v + 1);
    window.addEventListener(DRPLANT_CROPS_CHANGED, onChange);
    return () => window.removeEventListener(DRPLANT_CROPS_CHANGED, onChange);
  }, []);

  useEffect(() => {
    const onApi = () => void loadApiCrops();
    window.addEventListener(DRPLANT_API_CROPS_CHANGED, onApi);
    return () => window.removeEventListener(DRPLANT_API_CROPS_CHANGED, onApi);
  }, [loadApiCrops]);

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

  return (
    <div className="relative min-h-screen py-12 px-4 bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 start-[10%] h-80 w-80 rounded-full bg-amber-400/10 blur-[120px]" />
        <div className="absolute top-1/4 -end-24 h-72 w-72 rounded-full bg-primary/10 blur-[105px]" />
        <div className="absolute -bottom-24 start-[30%] h-72 w-72 rounded-full bg-lime-400/8 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_78%_55%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      </div>
      <Reveal>
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {language === "ar" ? "دليل المحاصيل" : "Crop Guide"}
          </span>
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
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
              <Link
                key={crop.listKey}
                to="/scan"
                className="group block bg-card border border-border rounded-3xl overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={
                  language === "ar"
                    ? `الانتقال لفحص النبات — ${name}`
                    : `Go to plant scan — ${name}`
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
              </Link>
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
                title: language === "ar" ? "الري المنتظم" : "Regular Watering",
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
    </div>
  );
}
