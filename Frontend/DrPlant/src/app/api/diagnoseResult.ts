import { pickNum, pickStr } from "./utils";

export type ScanResultUi = {
  plantName: string;
  health: string;
  disease: string | null;
  confidence: number;
  description: string;
  symptoms: string;
  treatment: string;
  status: string;
  /** Kept for compatibility; not shown when structured fields are set */
  recommendations: string[];
  /** Bilingual disease fields from API (when present, UI picks by language) */
  nameEn?: string;
  nameAr?: string | null;
  descriptionEn?: string;
  descriptionAr?: string | null;
  symptomsEn?: string;
  symptomsAr?: string | null;
  treatmentEn?: string;
  treatmentAr?: string | null;
  /** Raw status from API for localized labels (Healthy, Diseased, Completed) */
  statusKey?: string;
};

function normalizeConfidence(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  const pct = raw > 1 ? raw : raw * 100;
  return Math.min(100, Math.max(0, Math.round(pct)));
}

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export function isHealthyPrediction(o: Record<string, unknown>): boolean {
  const id = pickNum(o, "diseaseId", "DiseaseId");
  if (Number.isFinite(id) && id > 0) return false;
  const status = pickStr(o, "status", "Status").toLowerCase();
  if (status === "healthy") return true;
  const dn = pickStr(o, "diseaseName", "DiseaseName").toLowerCase();
  if (dn === "healthy") return true;
  const pc = pickStr(o, "predictedClass", "PredictedClass").toLowerCase();
  if (pc.includes("healthy")) return true;
  return false;
}

export type ParsedPredict = {
  diseaseId: number | null;
  diseaseName: string;
  predictedClass: string;
  confidencePct: number;
  status: string;
};

export function parsePredictResponse(raw: unknown): ParsedPredict {
  const o = asRecord(raw);
  const idNum = pickNum(o, "diseaseId", "DiseaseId");
  const diseaseId =
    Number.isFinite(idNum) && idNum > 0 ? Math.trunc(idNum) : null;
  const confRaw = pickNum(
    o,
    "confidence",
    "Confidence",
    "confidencePercent",
    "ConfidencePercent",
  );
  const confidencePct = normalizeConfidence(
    Number.isFinite(confRaw) ? confRaw : 0,
  );
  return {
    diseaseId,
    diseaseName: pickStr(o, "diseaseName", "DiseaseName"),
    predictedClass: pickStr(o, "predictedClass", "PredictedClass"),
    confidencePct,
    status: pickStr(o, "status", "Status"),
  };
}

export function buildHealthyScanResult(
  confidencePct: number,
  lang: "ar" | "en",
): ScanResultUi {
  const isAr = lang === "ar";
  const descriptionEn = "The plant is healthy with no visible disease.";
  const descriptionAr = "النبات سليم ولا تظهر عليه أعراض مرضية واضحة.";
  const symptomsEn = "No symptoms";
  const symptomsAr = "لا توجد أعراض";
  const treatmentEn = "No treatment needed";
  const treatmentAr = "لا حاجة لعلاج";
  return {
    plantName: isAr ? "سليم" : "Healthy",
    health: isAr ? "النبات سليم" : "Healthy plant",
    disease: null,
    confidence: confidencePct,
    description: isAr ? descriptionAr : descriptionEn,
    symptoms: isAr ? symptomsAr : symptomsEn,
    treatment: isAr ? treatmentAr : treatmentEn,
    status: "Healthy",
    recommendations: [],
    nameEn: "Healthy",
    nameAr: "سليم",
    descriptionEn,
    descriptionAr,
    symptomsEn,
    symptomsAr,
    treatmentEn,
    treatmentAr,
    statusKey: "Healthy",
  };
}

export function mapDiseaseRowToScanResult(
  disease: Record<string, unknown>,
  predict: ParsedPredict,
  lang: "ar" | "en",
): ScanResultUi {
  const isAr = lang === "ar";
  const nameEn =
    pickStr(disease, "Name", "name", "diseaseName", "DiseaseName") ||
    predict.diseaseName ||
    predict.predictedClass ||
    (isAr ? "مرض" : "Disease");
  const nameArRaw = pickStr(disease, "nameAr", "NameAr");
  const nameAr = nameArRaw.trim() ? nameArRaw : null;

  const descriptionEn = pickStr(disease, "Description", "description");
  const descriptionArRaw = pickStr(disease, "DescriptionAr", "descriptionAr");
  const descriptionAr = descriptionArRaw.trim() ? descriptionArRaw : null;

  const symptomsEn = pickStr(disease, "Symptoms", "symptoms");
  const symptomsArRaw = pickStr(disease, "symptomsAr", "SymptomsAr");
  const symptomsAr = symptomsArRaw.trim() ? symptomsArRaw : null;

  const treatmentEn = pickStr(disease, "Treatment", "treatment");
  const treatmentArRaw = pickStr(disease, "treatmentAr", "TreatmentAr");
  const treatmentAr = treatmentArRaw.trim() ? treatmentArRaw : null;

  const statusKey = predict.status.trim() || "Diseased";

  const description =
    (isAr ? descriptionAr || descriptionEn : descriptionEn) || "—";
  const symptoms = (isAr ? symptomsAr || symptomsEn : symptomsEn) || "—";
  const treatment = (isAr ? treatmentAr || treatmentEn : treatmentEn) || "—";
  const displayName = isAr ? nameAr || nameEn : nameEn;

  return {
    plantName: displayName,
    health: isAr ? "يحتاج متابعة وعلاج" : "Needs care and treatment",
    disease: displayName,
    confidence: predict.confidencePct,
    description,
    symptoms,
    treatment,
    status: statusKey,
    recommendations: [],
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    symptomsEn,
    symptomsAr,
    treatmentEn,
    treatmentAr,
    statusKey,
  };
}

/** When predict has no usable diseaseId but names a condition */
export function buildScanResultFromPredictOnly(
  predict: ParsedPredict,
  lang: "ar" | "en",
): ScanResultUi {
  const isAr = lang === "ar";
  const nameEn =
    predict.diseaseName ||
    predict.predictedClass ||
    (isAr ? "نتيجة التحليل" : "Analysis result");
  const statusKey = predict.status.trim() || "Unconfirmed";
  const descriptionEn =
    "No detailed disease record was found in the database. Showing prediction label only.";
  const descriptionAr =
    "لم يتم العثور على سجل مفصل لهذا المرض في قاعدة البيانات. عُرض اسم التنبؤ فقط.";
  return {
    plantName: nameEn,
    health: isAr ? "راجع التشخيص" : "Review diagnosis",
    disease: nameEn,
    confidence: predict.confidencePct,
    description: isAr ? descriptionAr : descriptionEn,
    symptoms: isAr ? "—" : "—",
    treatment: isAr ? "—" : "—",
    status: statusKey,
    recommendations: [],
    nameEn,
    descriptionEn,
    descriptionAr,
    statusKey,
  };
}
