/** Fired after admin mutates crops via API so the public crops page can refetch. */
export const DRPLANT_API_CROPS_CHANGED = "drplant-api-crops-changed";

/** Fired when blog posts are created, updated, or deleted (admin or blog page). */
export const DRPLANT_POSTS_CHANGED = "drplant-posts-changed";

export function emitApiCropsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_API_CROPS_CHANGED));
  }
}

export function emitPostsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_POSTS_CHANGED));
  }
}
