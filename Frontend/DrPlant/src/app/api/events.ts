/** Fired after admin mutates crops via API so the public crops page can refetch. */
export const DRPLANT_API_CROPS_CHANGED = "drplant-api-crops-changed";

export function emitApiCropsChanged(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_API_CROPS_CHANGED));
  }
}
