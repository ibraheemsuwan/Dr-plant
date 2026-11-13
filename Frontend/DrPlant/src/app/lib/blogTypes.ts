export type MediaType = "image" | "video";

export interface BlogComment {
  id: number;
  authorName: string;
  authorId: string;
  text: string;
  date: Date;
}

export interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: Date;
  userId: string | number;
  likes: string[];
  comments: BlogComment[];
  mediaUrl?: string | null;
  mediaType?: MediaType | null;
}

export const BLOG_CATEGORIES = [
  "General",
  "Farming Tips",
  "Soil Health",
  "Pest Control",
  "Sustainability",
  "Seasonal Guide",
] as const;

export const BLOG_CATEGORY_I18N_KEY: Record<string, string> = {
  General: "blogCatGeneral",
  "Farming Tips": "blogCatFarmingTips",
  "Soil Health": "blogCatSoilHealth",
  "Pest Control": "blogCatPestControl",
  Sustainability: "blogCatSustainability",
  "Seasonal Guide": "blogCatSeasonalGuide",
};

export function blogCategoryTranslationKey(category: string): string | null {
  const k = (category ?? "").trim();
  return BLOG_CATEGORY_I18N_KEY[k] ?? null;
}

export function ensurePostShape(p: BlogPost): BlogPost {
  return {
    ...p,
    likes: Array.isArray(p.likes) ? p.likes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
    mediaUrl: p.mediaUrl ?? null,
    mediaType: p.mediaType ?? null,
  };
}
