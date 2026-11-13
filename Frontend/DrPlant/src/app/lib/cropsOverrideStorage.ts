import type { SeasonalCropRow, SeasonTabId } from "../data/seasonalCropsData";

export const DRPLANT_CROPS_CHANGED = "drplant-crops-changed";

const HIDDEN_KEY = "drplant_crops_hidden_builtin";
const CUSTOM_KEY = "drplant_crops_custom";

export type CustomCropEntry = {
  id: string;
  season: SeasonTabId;
} & SeasonalCropRow;

function emitCropsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_CROPS_CHANGED));
  }
}

export function hiddenBuiltinKey(season: SeasonTabId, nameEn: string): string {
  return `${season}:${nameEn}`;
}

export function loadHiddenBuiltins(): Set<string> {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as unknown;
    return new Set(Array.isArray(arr) ? (arr as string[]) : []);
  } catch {
    return new Set();
  }
}

export function saveHiddenBuiltins(hidden: Set<string>) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden]));
  emitCropsChanged();
}

export function hideBuiltinCrop(season: SeasonTabId, nameEn: string) {
  const h = loadHiddenBuiltins();
  h.add(hiddenBuiltinKey(season, nameEn));
  saveHiddenBuiltins(h);
}

export function loadCustomCrops(): CustomCropEntry[] {
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? (arr as CustomCropEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveCustomCrops(entries: CustomCropEntry[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(entries));
  emitCropsChanged();
}

export function addCustomCrop(entry: CustomCropEntry) {
  const list = loadCustomCrops();
  list.push(entry);
  saveCustomCrops(list);
}

export function removeCustomCrop(id: string) {
  saveCustomCrops(loadCustomCrops().filter((c) => c.id !== id));
}
