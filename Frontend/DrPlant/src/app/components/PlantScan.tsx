import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { getErrorMessage } from "../api/errors";
import {
  buildHealthyScanResult,
  buildScanResultFromPredictOnly,
  isHealthyPrediction,
  mapDiseaseRowToScanResult,
  parsePredictResponse,
  type ScanResultUi,
} from "../api/diagnoseResult";
import {
  fetchDiseaseDetails,
  predictPlantDisease,
} from "../api/services/diagnoseService";
import {
  Upload,
  Camera,
  CheckCircle,
  AlertCircle,
  Leaf,
  Scan,
  Sparkles,
  History,
} from "lucide-react";
import { Link } from "react-router";
import { LanguageContext } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { Reveal } from "./animations/Reveal";

function pickBilingual(
  language: "ar" | "en",
  en: string,
  ar: string | null | undefined,
): string {
  if (language === "ar") {
    const a = ar?.trim();
    return a ? a : en;
  }
  return en;
}

function displayStatusLabel(
  language: "ar" | "en",
  statusKey: string | undefined,
  fallback: string,
): string {
  const raw = (statusKey ?? fallback).trim();
  const key = raw.toLowerCase();
  if (language === "ar") {
    const arMap: Record<string, string> = {
      healthy: "سليم",
      diseased: "مصاب",
      completed: "مكتمل",
    };
    return arMap[key] ?? raw;
  }
  const enMap: Record<string, string> = {
    healthy: "Healthy",
    diseased: "Diseased",
    completed: "Completed",
  };
  return enMap[key] ?? raw;
}

export function PlantScan() {
  const languageContext = useContext(LanguageContext);
  if (!languageContext) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  const { t, language } = languageContext;
  const { isLoggedIn } = useUser();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResultUi | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  /** Extra context from the API: which crop, how sure, and where the answer came from */
  const [scanMeta, setScanMeta] = useState<{
    cropName: string;
    cropNameAr: string;
    confidenceLevel: string;
  } | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const setSelectedFromFile = (file: File) => {
    setSelectedFile(file);
    setScanError(null);
    setCameraError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSelectedImage(ev.target?.result as string);
      setScanResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (isScanning) return;
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFromFile(file);
    }
    e.target.value = "";
  };

  const stopCamera = () => {
    const s = streamRef.current;
    if (s) {
      for (const tr of s.getTracks()) tr.stop();
    }
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCamera = async () => {
    if (isScanning) return;
    setCameraError(null);

    // Prefer real webcam on desktop; mobile can still use capture input.
    const media = navigator.mediaDevices;
    if (!media?.getUserMedia) {
      document.getElementById("camera-capture")?.click();
      return;
    }

    try {
      const stream = await media.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      setIsCameraOpen(true);
      // Wait next tick so videoRef exists
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      }, 0);
    } catch (e) {
      setCameraError(
        language === "ar"
          ? "تعذر فتح الكاميرا. تأكد من الصلاحيات."
          : "Unable to open camera. Check permissions.",
      );
      document.getElementById("camera-capture")?.click();
    }
  };

  const captureFromCamera = async () => {
    const video = videoRef.current;
    if (!video) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92),
    );
    if (!blob) return;
    const file = new File([blob], "camera.jpg", { type: "image/jpeg" });
    setSelectedFromFile(file);
    stopCamera();
    setIsCameraOpen(false);
  };

  const handleScan = async () => {
    if (!selectedFile) return;
    const lang = language === "ar" ? "ar" : "en";
    setIsScanning(true);
    setScanError(null);
    try {
      const raw = await predictPlantDisease(selectedFile);
      const o =
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const parsed = parsePredictResponse(raw);
      setScanMeta({
        cropName: String(o.cropName ?? ""),
        cropNameAr: String(o.cropNameAr ?? ""),
        confidenceLevel: String(o.confidenceLevel ?? "").toLowerCase(),
      });

      // Neither the model nor the AI was confident: ask for a better photo instead of guessing
      if (parsed.status.toLowerCase() === "uncertain") {
        const msg =
          lang === "ar"
            ? String(o.messageAr ?? o.message ?? "")
            : String(o.message ?? o.messageAr ?? "");
        setScanError(
          msg ||
            (lang === "ar"
              ? "لم نتمكن من التشخيص بثقة. صوّر ورقة واحدة مصابة عن قرب وحاول مرة أخرى."
              : "We couldn't diagnose this photo confidently. Take a close-up of one affected leaf and try again."),
        );
        setScanResult(null);
        return;
      }

      if (parsed.status.toLowerCase() === "healthy" || isHealthyPrediction(o)) {
        setScanResult(buildHealthyScanResult(parsed.confidencePct, lang));
        return;
      }

      // Disease details come inline (from our database, or from the AI for crops we don't cover)
      const inlineDisease =
        o.disease && typeof o.disease === "object"
          ? (o.disease as Record<string, unknown>)
          : null;
      if (inlineDisease) {
        setScanResult(mapDiseaseRowToScanResult(inlineDisease, parsed, lang));
        return;
      }

      if (parsed.diseaseId != null && parsed.diseaseId > 0) {
        const diseaseRow = await fetchDiseaseDetails(parsed.diseaseId);
        setScanResult(mapDiseaseRowToScanResult(diseaseRow, parsed, lang));
        return;
      }

      setScanResult(buildScanResultFromPredictOnly(parsed, lang));
    } catch (err) {
      setScanError(getErrorMessage(err));
      setScanResult(null);
    } finally {
      setIsScanning(false);
    }
  };

  const r = scanResult;
  const historyLink = isLoggedIn ? (
    <Link
      to="/my-diagnoses"
      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
    >
      <History className="h-4 w-4" />
      {language === "ar" ? "سجل تشخيصاتي" : "My diagnoses"}
    </Link>
  ) : null;
  const displayName =
    r && r.nameEn !== undefined
      ? pickBilingual(language, r.nameEn ?? "", r.nameAr) || r.plantName
      : (r?.plantName ?? "");
  const displayDescription =
    r && r.descriptionEn !== undefined
      ? pickBilingual(language, r.descriptionEn ?? "", r.descriptionAr) ||
        r.description
      : (r?.description ?? "");
  const displaySymptoms =
    r && r.symptomsEn !== undefined
      ? pickBilingual(language, r.symptomsEn ?? "", r.symptomsAr) || r.symptoms
      : (r?.symptoms ?? "");
  const displayTreatment =
    r && r.treatmentEn !== undefined
      ? pickBilingual(language, r.treatmentEn ?? "", r.treatmentAr) ||
        r.treatment
      : (r?.treatment ?? "");
  const statusRaw = r ? (r.statusKey ?? r.status).trim() : "";
  const normalize = (s: string) => s.trim().toLowerCase();
  const nameRaw = r
    ? (r.nameEn ?? r.plantName ?? r.disease ?? "").toString()
    : "";
  const isHealthyResult =
    r != null
      ? r.disease == null ||
        normalize(statusRaw) === "healthy" ||
        normalize(nameRaw) === "healthy" ||
        normalize(nameRaw) === "سليم"
      : false;
  const displayStatus =
    r != null
      ? displayStatusLabel(
          language,
          isHealthyResult ? "Healthy" : r.statusKey,
          isHealthyResult ? "Healthy" : r.status,
        )
      : "";

  const tips = [
    {
      icon: "📷",
      title: language === "ar" ? "جودة الصورة" : "Image Quality",
      desc:
        language === "ar"
          ? "التقط الصورة في ضوء جيد"
          : "Take the photo in good light",
    },
    {
      icon: "🎯",
      title: language === "ar" ? "تركيز الصورة" : "Focus",
      desc:
        language === "ar"
          ? "ركز على أوراق النبات"
          : "Focus on the plant leaves",
    },
    {
      icon: "📐",
      title: language === "ar" ? "زاوية الصورة" : "Angle",
      desc:
        language === "ar"
          ? "خذ الصورة من مسافة قريبة"
          : "Take the photo from close up",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background py-12 px-4">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-28 -start-[10%] h-80 w-80 rounded-full bg-primary/25 blur-[110px]" />
        <div className="absolute top-1/3 -end-[12%] h-72 w-72 rounded-full bg-emerald-400/20 blur-[95px]" />
        <div className="absolute -bottom-20 start-[15%] h-72 w-72 rounded-full bg-lime-400/12 blur-[85px] dark:bg-primary/12" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-8%,color-mix(in_oklch,var(--color-primary)_16%,transparent),transparent_62%)]" />
        <div
          className="absolute inset-0 opacity-[0.22] mix-blend-multiply dark:opacity-[0.10] dark:mix-blend-soft-light"
          style={{
            backgroundImage: `linear-gradient(to right, var(--color-border) 1px, transparent 1px),
              linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)`,
            backgroundSize: "44px 44px",
          }}
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_55%_at_50%_20%,#000_45%,transparent_78%)] bg-primary/5 dark:bg-primary/10" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      </div>

      <Reveal>
        <div className="relative z-10 mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-16 text-center">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              {language === "ar" ? "مدعوم بالذكاء الاصطناعي" : "AI Powered"}
            </span>
            <h1
              className="mb-4 text-5xl font-bold text-brand-dark dark:text-foreground"
              style={{
                fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
              }}
            >
              {t("scan")}
            </h1>
            <p className="mx-auto max-w-xl text-lg text-muted-foreground">
              {t("scanDescription")}
            </p>
            {historyLink ? <div className="mt-6">{historyLink}</div> : null}
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Upload Section */}
            <div className="space-y-6">
              <div
                className={`relative overflow-hidden rounded-3xl border-2 border-dashed text-center shadow-sm transition-colors ${
                  selectedImage
                    ? "border-primary bg-card"
                    : "border-primary/25 bg-linear-to-br from-primary/[0.07] via-card to-emerald-500/[0.06] hover:border-primary/50 dark:from-primary/10 dark:via-card dark:to-emerald-950/20"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="sr-only"
                  id="camera-capture"
                  tabIndex={-1}
                  disabled={isScanning}
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="sr-only"
                  id="image-upload"
                  tabIndex={-1}
                  disabled={isScanning}
                />
                {selectedImage ? (
                  <div className="relative p-10">
                    <img
                      src={selectedImage}
                      alt="Selected plant"
                      className="mb-4 h-64 w-full rounded-2xl object-cover shadow-md ring-1 ring-primary/10"
                    />
                    {selectedFile ? (
                      <p className="mb-3 truncate text-center text-xs text-muted-foreground px-2">
                        {selectedFile.name}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() =>
                        document.getElementById("image-upload")?.click()
                      }
                      disabled={isScanning}
                      className="absolute top-2 end-2 px-3 py-1.5 bg-card/90 backdrop-blur-sm border border-border rounded-full text-xs font-medium hover:bg-card transition-colors disabled:pointer-events-none disabled:opacity-50"
                    >
                      {language === "ar" ? "تغيير الصورة" : "Change Image"}
                    </button>
                  </div>
                ) : (
                  <div
                    className={`group flex flex-col items-center justify-center p-10 ${
                      isScanning ? "cursor-not-allowed opacity-60" : ""
                    }`}
                  >
                    <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/15 shadow-inner transition-colors group-hover:bg-primary/25 group-hover:shadow-md">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <p className="mb-2 text-lg font-semibold">
                      {t("uploadImage")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {language === "ar"
                        ? "اسحب وأفلت أو انقر للاختيار"
                        : "Drag & drop or click to select"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      PNG, JPG, WEBP up to 10MB
                    </p>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => void openCamera()}
                        disabled={isScanning}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-60"
                      >
                        <Camera className="w-4 h-4" />
                        {language === "ar" ? "الكاميرا" : "Camera"}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          document.getElementById("image-upload")?.click()
                        }
                        disabled={isScanning}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground/80 hover:border-primary/40 hover:text-foreground transition-colors disabled:pointer-events-none disabled:opacity-60"
                      >
                        <Upload className="w-4 h-4" />
                        {language === "ar" ? "اختيار صورة" : "Choose photo"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {cameraError ? (
                <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {cameraError}
                </p>
              ) : null}

              {scanError ? (
                <p className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {scanError}
                </p>
              ) : null}

              {selectedImage && !scanResult && (
                <button
                  type="button"
                  onClick={() => void handleScan()}
                  disabled={isScanning || !selectedFile}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3 font-semibold shadow-lg shadow-primary/25"
                >
                  {isScanning ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      {language === "ar" ? "جارٍ الفحص..." : "Scanning..."}
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5" />
                      {t("scanNow")}
                    </>
                  )}
                </button>
              )}

              {/* Tips */}
              <div className="rounded-2xl border border-primary/10 bg-linear-to-br from-primary/[0.06] via-muted/30 to-transparent p-6 shadow-sm dark:from-primary/10 dark:via-card/40">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {language === "ar"
                    ? "نصائح للحصول على أفضل النتائج"
                    : "Tips for Best Results"}
                </h3>
                <div className="space-y-3">
                  {tips.map((tip, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-card/60 px-3 py-2.5 dark:bg-background/30"
                    >
                      <span className="text-xl">{tip.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{tip.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {tip.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="space-y-4">
              {scanResult ? (
                <div className="space-y-6 rounded-3xl border border-border bg-card/95 p-8 shadow-lg shadow-primary/5 backdrop-blur-sm dark:bg-card/90">
                  <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    {language === "ar"
                      ? "اكتمل التحليل بنجاح"
                      : "Analysis completed successfully"}
                  </p>
                  {/* Status */}
                  <div
                    className={
                      !isHealthyResult
                        ? "flex items-center gap-4 rounded-2xl border border-destructive/25 bg-destructive/5 p-4 dark:bg-destructive/10"
                        : "flex items-center gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30"
                    }
                  >
                    {!isHealthyResult ? (
                      <AlertCircle className="h-10 w-10 shrink-0 text-destructive" />
                    ) : (
                      <CheckCircle className="h-10 w-10 shrink-0 text-green-600" />
                    )}
                    <div>
                      <h3
                        className="text-xl font-bold"
                        style={{
                          fontFamily:
                            "'Playfair Display', 'Noto Kufi Arabic', serif",
                        }}
                      >
                        {displayName}
                      </h3>
                      <p
                        className={`text-sm font-medium ${
                          !isHealthyResult
                            ? "text-destructive"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {language === "ar" ? "الحالة: " : "Status: "}
                        {displayStatus}
                      </p>
                      {scanMeta && (scanMeta.cropName || scanMeta.cropNameAr) ? (
                        <p className="text-sm text-muted-foreground">
                          {language === "ar" ? "النبتة: " : "Plant: "}
                          {language === "ar"
                            ? scanMeta.cropNameAr || scanMeta.cropName
                            : scanMeta.cropName || scanMeta.cropNameAr}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? "نسبة الثقة" : "Confidence"}
                      </span>
                      <span className="font-bold text-primary text-lg">
                        {scanResult.confidence}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-1000"
                        style={{ width: `${scanResult.confidence}%` }}
                      />
                    </div>
                    {scanMeta?.confidenceLevel === "medium" ? (
                      <p className="rounded-xl border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-300">
                        {language === "ar"
                          ? "الثقة متوسطة: قارن الأعراض المذكورة بما تراه على النبتة، وإن لم تتطابق صوّر ورقة أخرى عن قرب."
                          : "Medium confidence: compare the symptoms below with your plant; if they don't match, photograph another leaf up close."}
                      </p>
                    ) : null}
                  </div>

                  {/* Disease details */}
                  <div className="space-y-4">
                    <h4 className="mb-1 flex items-center gap-2 font-semibold">
                      <Leaf className="h-4 w-4 text-primary" />
                      {language === "ar"
                        ? "تفاصيل التشخيص"
                        : "Diagnosis details"}
                    </h4>
                    <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {language === "ar" ? "الوصف" : "Description"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">
                          {displayDescription}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {language === "ar" ? "الأعراض" : "Symptoms"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">
                          {displaySymptoms}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {language === "ar" ? "العلاج" : "Treatment"}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed">
                          {displayTreatment}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-center text-xs leading-relaxed text-muted-foreground">
                    {language === "ar"
                      ? "التشخيص استرشادي ولا يغني عن استشارة مهندس زراعي، خصوصًا قبل استخدام المبيدات."
                      : "This diagnosis is guidance only and does not replace an agronomist, especially before using pesticides."}
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedImage(null);
                      setSelectedFile(null);
                      setScanResult(null);
                      setScanMeta(null);
                      setScanError(null);
                    }}
                    className="w-full py-3 border-2 border-border rounded-full hover:border-primary hover:text-primary transition-all text-sm font-medium"
                  >
                    {language === "ar" ? "فحص نبتة أخرى" : "Scan Another Plant"}
                  </button>
                </div>
              ) : (
                <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary/20 bg-linear-to-b from-primary/[0.05] via-card to-emerald-500/[0.04] p-12 text-center shadow-inner dark:from-primary/10 dark:via-card dark:to-emerald-950/15">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-4 ring-primary/5">
                    <Camera className="h-8 w-8 text-primary/80" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">
                    {language === "ar" ? "نتائج الفحص" : "Scan Results"}
                  </h3>
                  <p className="text-muted-foreground text-sm max-w-xs">
                    {language === "ar"
                      ? "ارفع صورة نبات للحصول على تشخيص دقيق وتوصيات مخصصة"
                      : "Upload a plant image to get accurate diagnosis and personalized recommendations"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Reveal>

      {isCameraOpen ? (
        <div className="fixed inset-0 z-[999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl border border-border bg-card shadow-xl overflow-hidden">
            <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-border">
              <p className="font-semibold">
                {language === "ar" ? "الكاميرا" : "Camera"}
              </p>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsCameraOpen(false);
                }}
                className="px-3 py-1.5 rounded-full border border-border text-sm hover:bg-accent transition-colors"
              >
                {language === "ar" ? "إغلاق" : "Close"}
              </button>
            </div>
            <div className="p-4 sm:p-5">
              <div className="rounded-2xl overflow-hidden border border-border bg-black">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-[320px] sm:h-[420px] object-cover"
                />
              </div>
              <div className="mt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsCameraOpen(false);
                  }}
                  className="px-5 py-2.5 rounded-full border border-border bg-card text-sm font-semibold text-foreground/80 hover:border-primary/40 hover:text-foreground transition-colors"
                >
                  {language === "ar" ? "إلغاء" : "Cancel"}
                </button>
                <button
                  type="button"
                  onClick={() => void captureFromCamera()}
                  className="px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
                >
                  {language === "ar" ? "التقاط" : "Capture"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
