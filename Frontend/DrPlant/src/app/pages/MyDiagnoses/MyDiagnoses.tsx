import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router";
import { AlertCircle, CheckCircle, HelpCircle, ImageOff, Scan } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUser } from "../../contexts/UserContext";
import { apiGet } from "../../api/http";
import { getErrorMessage } from "../../api/errors";
import * as diseasesService from "../../api/services/diseasesService";
import { asArray, pickNum, pickStr } from "../../api/utils";

type Row = {
  id: number;
  imageUrl: string;
  diseaseId: number | null;
  /** Healthy | Completed (diseased) | Uncertain */
  status: "healthy" | "diseased" | "uncertain";
  /** local (our model) | ai */
  source: string;
  confidence: number;
  createdAt: Date;
};

function mapRow(o: Record<string, unknown>): Row {
  // Stored as "<status>/<source>", e.g. "Completed/local"
  const [rawStatus = "", source = ""] = pickStr(o, "status", "Status").split("/");
  const s = rawStatus.trim().toLowerCase();
  const diseaseId = pickNum(o, "diseaseId", "DiseaseId");
  return {
    id: Math.trunc(pickNum(o, "diagnosisId", "DiagnosisId")),
    imageUrl: pickStr(o, "imageUrl", "ImageUrl"),
    diseaseId: Number.isFinite(diseaseId) && diseaseId > 0 ? Math.trunc(diseaseId) : null,
    status: s === "healthy" ? "healthy" : s === "uncertain" ? "uncertain" : "diseased",
    source: source.trim().toLowerCase(),
    confidence: Math.round(pickNum(o, "confidencePercent", "ConfidencePercent") || 0),
    createdAt: new Date(pickStr(o, "createdAt", "CreatedAt")),
  };
}

export function MyDiagnoses() {
  const { language } = useLanguage();
  const { isLoggedIn } = useUser();
  const isAr = language === "ar";

  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [diseaseNames, setDiseaseNames] = useState<Map<number, string>>(new Map());

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const [mine, diseases] = await Promise.all([
          apiGet<unknown>("/Diagnoses/mine"),
          diseasesService.listDiseases().catch(() => []),
        ]);
        if (cancelled) return;
        setRows(asArray<Record<string, unknown>>(mine).map(mapRow));
        const names = new Map<number, string>();
        for (const d of diseases) {
          const id = pickNum(d, "diseaseId", "DiseaseId");
          const en = pickStr(d, "name", "Name");
          const ar = pickStr(d, "nameAr", "NameAr");
          if (Number.isFinite(id)) names.set(Math.trunc(id), isAr && ar ? ar : en);
        }
        setDiseaseNames(names);
      } catch (e) {
        if (!cancelled) setError(getErrorMessage(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, isAr]);

  const dateFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(isAr ? "ar" : "en", { dateStyle: "medium", timeStyle: "short" }),
    [isAr],
  );

  if (!isLoggedIn) return <Navigate to="/login" replace />;

  const statusBadge = (r: Row) => {
    if (r.status === "healthy")
      return (
        <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400">
          <CheckCircle className="h-4 w-4" />
          {isAr ? "سليم" : "Healthy"}
        </span>
      );
    if (r.status === "uncertain")
      return (
        <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
          <HelpCircle className="h-4 w-4" />
          {isAr ? "غير مؤكد" : "Not sure"}
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 text-destructive">
        <AlertCircle className="h-4 w-4" />
        {isAr ? "مصابة" : "Diseased"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif" }}
          >
            {isAr ? "سجل تشخيصاتي" : "My diagnoses"}
          </h1>
          <Link
            to="/scan"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Scan className="h-4 w-4" />
            {isAr ? "فحص نبتة جديدة" : "Scan a plant"}
          </Link>
        </div>

        {error ? <p className="text-destructive">{error}</p> : null}
        {!error && rows === null ? (
          <p className="text-muted-foreground">{isAr ? "جارٍ التحميل..." : "Loading..."}</p>
        ) : null}
        {rows && rows.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
            {isAr ? "لا توجد تشخيصات بعد. جرّب فحص أول نبتة." : "No diagnoses yet. Try scanning your first plant."}
          </div>
        ) : null}

        <ul className="grid gap-4 sm:grid-cols-2">
          {(rows ?? []).map((r) => (
            <li key={r.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
              {r.imageUrl ? (
                <img
                  src={r.imageUrl}
                  alt=""
                  loading="lazy"
                  className="h-24 w-24 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ImageOff className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 space-y-1 text-sm">
                <p className="truncate text-base font-semibold">
                  {r.status === "uncertain"
                    ? isAr
                      ? "تعذّر التشخيص بثقة"
                      : "Could not diagnose confidently"
                    : (r.diseaseId != null && diseaseNames.get(r.diseaseId)) ||
                      (isAr ? "غير معروف" : "Unknown")}
                </p>
                <p className="font-medium">{statusBadge(r)}</p>
                <p className="text-muted-foreground">
                  {isAr ? "الثقة: " : "Confidence: "}
                  {r.confidence}%
                  {r.source === "ai" ? (isAr ? " · بمساعدة الذكاء الاصطناعي" : " · AI-assisted") : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {Number.isNaN(r.createdAt.getTime()) ? "" : dateFmt.format(r.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
