import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, MapPin, RefreshCw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { Reveal } from "./animations/Reveal";

const PALESTINE_CITIES = [
  "Tulkarm",
  "Nablus",
  "Ramallah",
  "Hebron",
  "Bethlehem",
  "Jenin",
  "Qalqilya",
  "Salfit",
  "Tubas",
  "Jericho",
  "Gaza",
  "Beitunia",
  "Al Ram",
  "Qabatiya",
  "Bani Na'im",
  "Haris",
] as const;

const CITY_LABELS_AR: Record<string, string> = {
  Tulkarm: "طولكرم",
  Nablus: "نابلس",
  Ramallah: "رام الله",
  Hebron: "الخليل",
  Bethlehem: "بيت لحم",
  Jenin: "جنين",
  Qalqilya: "قلقيلية",
  Salfit: "سلفيت",
  Tubas: "طوباس",
  Jericho: "أريحا",
  Gaza: "غزة",
  Beitunia: "بيتونيا",
  "Al Ram": "الرام",
  Qabatiya: "قباطية",
  "Bani Na'im": "بني نعيم",
  Haris: "حارس",
};

type WeatherPayload = {
  place: string;
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
  };
};

function dayName(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale, { weekday: "short" });
}

function weatherInfo(code: number, t: (k: string) => string) {
  if (code === 0) return { label: t("clear"), icon: "☀️" };
  if ([1, 2].includes(code)) return { label: t("mostlyClear"), icon: "🌤️" };
  if (code === 3) return { label: t("cloudy"), icon: "☁️" };
  if ([45, 48].includes(code)) return { label: t("fog"), icon: "🌫️" };
  if ([51, 53, 55].includes(code)) return { label: t("drizzle"), icon: "🌦️" };
  if ([61, 63, 65].includes(code)) return { label: t("rain"), icon: "🌧️" };
  if ([66, 67].includes(code)) return { label: t("freezingRain"), icon: "🌧️" };
  if ([71, 73, 75].includes(code)) return { label: t("snow"), icon: "❄️" };
  if (code === 77) return { label: t("snowGrains"), icon: "❄️" };
  if ([80, 81, 82].includes(code))
    return { label: t("rainShowers"), icon: "🌧️" };
  if ([85, 86].includes(code)) return { label: t("snowShowers"), icon: "❄️" };
  if ([95, 96, 99].includes(code))
    return { label: t("thunderstorm"), icon: "⛈️" };
  return { label: t("weatherLabel"), icon: "🌡️" };
}

function displayCityName(city: string, language: "ar" | "en") {
  if (language === "ar") return CITY_LABELS_AR[city] ?? city;
  return city;
}

function todayFarmingTips(input: {
  code: number;
  tempC: number;
  windKmh: number;
  humidityPct: number;
  language: "ar" | "en";
}): Array<{ title: string; desc: string; icon: string }> {
  const { code, tempC, windKmh, humidityPct, language } = input;
  const isAr = language === "ar";
  const tips: Array<{ title: string; desc: string; icon: string }> = [];

  const isRainy = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82].includes(code);
  const isStorm = [95, 96, 99].includes(code);
  const isFog = [45, 48].includes(code);
  const isSnow = [71, 73, 75, 77, 85, 86].includes(code);

  const month = new Date().getMonth() + 1; // 1..12
  const season: "spring" | "summer" | "autumn" | "winter" =
    month >= 3 && month <= 5
      ? "spring"
      : month >= 6 && month <= 8
        ? "summer"
        : month >= 9 && month <= 11
          ? "autumn"
          : "winter";

  const cropList = (() => {
    // Simple Palestine-friendly suggestions (placeholder logic for later backend).
    if (tempC >= 30) {
      return isAr
        ? ["بامية", "باذنجان", "فلفل", "شمام/بطيخ"]
        : ["Okra", "Eggplant", "Peppers", "Melon/Watermelon"];
    }
    if (tempC <= 12 || isSnow) {
      return isAr
        ? ["فول", "بازيلا", "ملفوف", "زهرة"]
        : ["Fava beans", "Peas", "Cabbage", "Cauliflower"];
    }
    if (isRainy) {
      return isAr
        ? ["سبانخ", "جرجير", "فجل", "خس"]
        : ["Spinach", "Arugula", "Radish", "Lettuce"];
    }
    if (season === "spring") {
      return isAr
        ? ["طماطم", "خيار", "فاصولياء", "كوسا"]
        : ["Tomato", "Cucumber", "Beans", "Zucchini"];
    }
    if (season === "summer") {
      return isAr
        ? ["باذنجان", "فلفل", "بامية", "ذرة"]
        : ["Eggplant", "Peppers", "Okra", "Corn"];
    }
    if (season === "autumn") {
      return isAr
        ? ["خس", "سبانخ", "جزر", "بصل أخضر"]
        : ["Lettuce", "Spinach", "Carrot", "Green onion"];
    }
    return isAr
      ? ["فول", "بازيلا", "ملفوف", "بروكلي"]
      : ["Fava beans", "Peas", "Cabbage", "Broccoli"];
  })();

  tips.push({
    icon: "🌱",
    title: isAr ? "محاصيل مناسبة اليوم" : "Crops to plant today",
    desc: isAr
      ? `اقتراحات حسب الطقس/الحرارة: ${cropList.join("، ")}`
      : `Suggestions based on weather/temp: ${cropList.join(", ")}`,
  });

  if (isStorm) {
    tips.push({
      icon: "⛈️",
      title: isAr ? "تنبيه عاصفة" : "Storm caution",
      desc: isAr
        ? "تجنب الرش أو التسميد اليوم، وثبّت الأحواض واحمِ الشتلات."
        : "Avoid spraying/fertilizing today; secure pots and protect seedlings.",
    });
  } else if (isRainy) {
    tips.push({
      icon: "🌧️",
      title: isAr ? "يوم ممطر" : "Rainy day",
      desc: isAr
        ? "قلّل الري وتأكد من تصريف الماء حول الجذور لتفادي التعفن."
        : "Reduce watering and ensure good drainage to prevent root rot.",
    });
  } else if (isFog) {
    tips.push({
      icon: "🌫️",
      title: isAr ? "رطوبة/ضباب" : "Fog & humidity",
      desc: isAr
        ? "حسّن التهوية وراقب بقع الأوراق—الرطوبة العالية تزيد الأمراض الفطرية."
        : "Improve ventilation and watch leaf spots—high humidity boosts fungal risk.",
    });
  } else if (isSnow) {
    tips.push({
      icon: "❄️",
      title: isAr ? "برد شديد" : "Cold weather",
      desc: isAr
        ? "غطِّ النباتات الحساسة وأبعدها عن الرياح، ويفضّل الري صباحًا فقط."
        : "Cover sensitive plants, shield from wind, and water only in the morning.",
    });
  } else {
    tips.push({
      icon: "☀️",
      title: isAr ? "تنظيم الري" : "Watering routine",
      desc: isAr
        ? "اسقِ صباحًا لتقليل التبخر، وتأكد أن التربة رطبة وليست مشبعة."
        : "Water in the morning to reduce evaporation; keep soil moist, not soggy.",
    });
  }

  if (tempC >= 32) {
    tips.push({
      icon: "🔥",
      title: isAr ? "حرارة مرتفعة" : "High heat",
      desc: isAr
        ? "وفّر ظلًا خفيفًا وقت الظهيرة وزِد الري تدريجيًا حسب جفاف التربة."
        : "Provide light shade at noon and increase watering gradually as soil dries.",
    });
  } else if (tempC <= 10) {
    tips.push({
      icon: "🧊",
      title: isAr ? "حرارة منخفضة" : "Low temperature",
      desc: isAr
        ? "خفّف الري وتجنب التسميد الثقيل—النمو يكون أبطأ في البرد."
        : "Reduce watering and avoid heavy fertilizing—growth slows in cold.",
    });
  }

  if (windKmh >= 25) {
    tips.push({
      icon: "🌬️",
      title: isAr ? "رياح قوية" : "Windy",
      desc: isAr
        ? "ثبّت النباتات والأغصان الضعيفة وتجنب الرش لتقليل تطاير المبيد."
        : "Stake plants and avoid spraying to prevent drift.",
    });
  }

  if (humidityPct >= 75) {
    tips.push({
      icon: "🦠",
      title: isAr ? "وقاية فطرية" : "Fungal prevention",
      desc: isAr
        ? "تأكد من التهوية وتباعد النباتات، وأزل الأوراق المصابة مبكرًا."
        : "Ensure airflow, space plants, and remove affected leaves early.",
    });
  }

  // Ensure we always show at least 3 tips so the 3-column layout doesn't feel empty.
  // These are safe, general suggestions that apply most days.
  const fallbackTips: Array<{ title: string; desc: string; icon: string }> = [
    {
      icon: "🔎",
      title: isAr ? "تفقد الأوراق" : "Check leaves",
      desc: isAr
        ? "راقب اصفرار/بقع الأوراق مبكرًا لتجنب انتشار المرض."
        : "Look for yellowing/spots early to prevent spread.",
    },
    {
      icon: "🧹",
      title: isAr ? "نظافة التربة" : "Soil hygiene",
      desc: isAr
        ? "أزل الأعشاب وبقايا الأوراق حول النبات لتحسين التهوية."
        : "Remove weeds and debris around plants to improve airflow.",
    },
    {
      icon: "🌿",
      title: isAr ? "تقليم خفيف" : "Light pruning",
      desc: isAr
        ? "قصّ الأوراق التالفة يساعد النبات على توجيه طاقته للنمو."
        : "Trim damaged leaves so the plant focuses energy on growth.",
    },
  ];

  for (const f of fallbackTips) {
    if (tips.length >= 3) break;
    if (!tips.some((t) => t.title === f.title)) tips.push(f);
  }

  // Show a few useful tips without overwhelming the UI.
  return tips.slice(0, 5);
}

export function Weather() {
  const { t, language } = useLanguage();
  const [city, setCity] = useState<string>(PALESTINE_CITIES[0]);
  const [showCities, setShowCities] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState<WeatherPayload | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const selectRef = useRef<HTMLDivElement>(null);

  const refreshMinutes = 10;
  const locale = language === "ar" ? "ar" : "en";

  const niceTime = useMemo(() => {
    if (!lastUpdated) return "—";
    return new Date(lastUpdated).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated, locale]);

  const fetchWeather = useCallback(
    async (cityParam?: string) => {
      const targetCity = typeof cityParam === "string" ? cityParam : city;
      try {
        setErr("");
        setLoading(true);

        const geoRes = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            targetCity,
          )}&count=1&language=en&format=json`,
        );
        const geo = (await geoRes.json()) as {
          results?: Array<{
            latitude: number;
            longitude: number;
            name: string;
            country?: string;
          }>;
        };
        if (!geo?.results?.length) throw new Error(t("weatherCityNotFound"));

        const { latitude, longitude, name, country } = geo.results[0];

        const wRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
            `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
            `&timezone=auto`,
        );
        const w = (await wRes.json()) as {
          current: WeatherPayload["current"];
          daily: WeatherPayload["daily"];
        };

        setData({
          place: `${name}${country ? ", " + country : ""}`,
          current: w.current,
          daily: w.daily,
        });
        setLastUpdated(Date.now());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : t("weatherErrorGeneric");
        setErr(msg);
      } finally {
        setLoading(false);
      }
    },
    [city, t],
  );

  useEffect(() => {
    void fetchWeather(city);
    const id = window.setInterval(
      () => void fetchWeather(city),
      refreshMinutes * 60 * 1000,
    );
    return () => window.clearInterval(id);
  }, [city, fetchWeather]);

  useEffect(() => {
    if (!showCities) return;
    const onDoc = (e: MouseEvent) => {
      if (selectRef.current?.contains(e.target as Node)) return;
      setShowCities(false);
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [showCities]);

  const currentInfo =
    !loading && data ? weatherInfo(data.current.weather_code, t) : null;

  const tipsToday = useMemo(() => {
    if (loading || !data) return [];
    return todayFarmingTips({
      code: data.current.weather_code,
      tempC: data.current.temperature_2m,
      windKmh: data.current.wind_speed_10m,
      humidityPct: data.current.relative_humidity_2m,
      language,
    });
  }, [loading, data, language]);

  return (
    <div className="relative min-h-screen py-12 px-4 bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 start-[8%] h-72 w-72 rounded-full bg-sky-400/18 blur-[115px]" />
        <div className="absolute top-1/3 -end-24 h-72 w-72 rounded-full bg-primary/16 blur-[110px]" />
        <div className="absolute -bottom-28 start-[18%] h-80 w-80 rounded-full bg-emerald-400/14 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_55%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      </div>
      <Reveal>
      <div className="relative z-10 max-w-7xl mx-auto w-full px-2 sm:px-0">
        <div className="text-center mb-10">
          <span className="inline-block px-4 py-1.5 bg-primary/15 text-primary rounded-full text-sm font-medium mb-4">
            {t("liveLabel")}
          </span>
          <h1
            className="text-4xl sm:text-5xl font-bold mb-3 text-brand-dark dark:text-foreground"
            style={{
              fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
            }}
          >
            {t("weatherClimateTitle")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            {t("realTimeUpdates")}{" "}
            <span className="font-semibold text-foreground">
              {displayCityName(city, language)}
            </span>
            {" • "}
            {t("lastUpdate")}: <b className="text-foreground">{niceTime}</b>
          </p>

          <div className="mt-6 flex justify-center">
            <div className="relative" ref={selectRef}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCities((s) => !s);
                }}
                className="inline-flex items-center gap-2 min-w-[min(100%,280px)] sm:min-w-[300px] justify-between px-5 py-3 rounded-full border-2 border-border bg-card text-foreground font-medium shadow-sm hover:border-primary/50 hover:bg-accent/50 transition-all"
                aria-haspopup="listbox"
                aria-expanded={showCities}
                aria-label={t("weatherSelectCity")}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  {displayCityName(city, language)}
                </span>
                <ChevronDown
                  className={`w-4 h-4 opacity-60 transition-transform ${showCities ? "rotate-180" : ""}`}
                />
              </button>

              {showCities && (
                <ul
                  className="absolute z-20 mt-2 w-full max-h-64 overflow-y-auto rounded-2xl border border-border bg-card py-2 shadow-lg"
                  role="listbox"
                >
                  {PALESTINE_CITIES.map((c) => (
                    <li key={c}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={c === city}
                        className={`w-full text-start px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors ${
                          c === city
                            ? "bg-primary/15 font-semibold text-primary"
                            : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCity(c);
                          setShowCities(false);
                        }}
                      >
                        {displayCityName(c, language)}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {err && (
          <div
            className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center"
            role="alert"
          >
            ⚠️ {err}
          </div>
        )}

        <div className="rounded-3xl overflow-hidden border border-border shadow-lg mb-8">
          <div className="relative overflow-hidden bg-linear-to-br from-emerald-800 from-[-5%] via-brand-dark via-45% to-[#121a12] to-100% text-white p-6 sm:p-10">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_65%_at_18%_12%,rgba(152,204,107,0.28),transparent_65%)]"
              aria-hidden
            />
            <div className="absolute top-0 end-0 w-48 h-48 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute bottom-0 start-0 w-40 h-40 rounded-full bg-white/5" />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
                  {t("currentWeather")}
                </p>
                {data?.place && (
                  <p className="text-white/85 text-sm">{data.place}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => void fetchWeather(city)}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 border border-white/20"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? t("analyzing") : t("weatherRefresh")}
              </button>
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-end gap-8">
              <div className="flex-1">
                <div className="flex items-end gap-2">
                  <span
                    className="text-7xl sm:text-8xl font-bold leading-none"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {loading || !data
                      ? "—"
                      : `${Math.round(data.current.temperature_2m)}°`}
                  </span>
                  <span className="text-2xl text-white/80 pb-2">C</span>
                </div>
                <div className="mt-3 text-lg text-white/90 flex items-center gap-2 flex-wrap">
                  <span>{currentInfo?.icon ?? "🌡️"}</span>
                  <span>{currentInfo?.label ?? "—"}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:max-w-2xl">
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
                  <p className="text-white/65 text-xs mb-1">{t("humidity")}</p>
                  <p className="text-xl font-semibold">
                    {loading || !data
                      ? "—"
                      : `${data.current.relative_humidity_2m}%`}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4">
                  <p className="text-white/65 text-xs mb-1">{t("windSpeed")}</p>
                  <p className="text-xl font-semibold">
                    {loading || !data
                      ? "—"
                      : `${Math.round(data.current.wind_speed_10m)} km/h`}
                  </p>
                </div>
                <div className="rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10 p-4 col-span-2 sm:col-span-1">
                  <p className="text-white/65 text-xs mb-1">{t("city")}</p>
                  <p className="text-lg font-semibold truncate">
                    {displayCityName(city, language)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
          <h2
            className="text-xl sm:text-2xl font-bold mb-6 text-brand-dark dark:text-foreground"
            style={{
              fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
            }}
          >
            {t("weatherNextFiveDays")}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {loading || !data ? (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                {t("analyzing")}…
              </div>
            ) : (
              Array.from({ length: 5 }).map((_, i) => {
                const info = weatherInfo(data.daily.weather_code[i], t);
                return (
                  <div
                    key={data.daily.time[i]}
                    className={`rounded-2xl p-4 text-center border-2 transition-all ${
                      i === 0
                        ? "border-primary bg-primary/10"
                        : "border-transparent bg-muted/50 hover:bg-muted/80"
                    }`}
                  >
                    <p className="font-semibold text-sm mb-2">
                      {dayName(data.daily.time[i], locale)}
                    </p>
                    <div className="text-3xl mb-2">{info.icon}</div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="text-lg font-bold">
                          {Math.round(data.daily.temperature_2m_max[i])}°
                        </span>
                        <span className="text-xs text-muted-foreground ms-1">
                          {t("weatherMax")}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-muted-foreground">
                          {Math.round(data.daily.temperature_2m_min[i])}°
                        </span>
                        <span className="text-xs text-muted-foreground ms-1">
                          {t("weatherMin")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                      {info.label}
                    </p>
                    <div className="mt-3 h-1 rounded-full bg-muted overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-primary/70"
                        style={{ width: `${Math.min(95, 55 + i * 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-8 bg-card border border-border rounded-3xl p-6 sm:p-10 shadow-sm">
          <h3
            className="text-xl sm:text-2xl font-bold mb-3 text-brand-dark dark:text-foreground"
            style={{
              fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
            }}
          >
            {language === "ar" ? "نصائح اليوم" : "Today's tips"}
          </h3>
          <p className="text-muted-foreground text-sm sm:text-base mb-6">
            {language === "ar"
              ? "اقتراحات زراعية مبنية على طقس اليوم."
              : "Plant care suggestions based on today's weather."}
          </p>

          {loading || !data ? (
            <div className="text-center py-10 text-muted-foreground">
              {t("analyzing")}…
            </div>
          ) : tipsToday.length === 0 ? (
            <p className="text-muted-foreground">
              {language === "ar" ? "لا توجد نصائح الآن." : "No tips right now."}
            </p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tipsToday.map((tip, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card/85 p-5 shadow-sm backdrop-blur-xs dark:bg-card/60"
                >
                  <div className="flex items-start gap-3">
                    <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-lg shrink-0">
                      <span aria-hidden>{tip.icon}</span>
                    </div>
                    <div>
                      <p className="font-semibold mb-1 text-foreground">{tip.title}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {tip.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </Reveal>
    </div>
  );
}
