/** Blog post/comment types shared by the blog page, admin dashboard and API mappers. */
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

/** Fired after a post is created/updated/deleted so other views can refetch. */
export const DRPLANT_POSTS_CHANGED = "drplant-posts-changed";

export function ensurePostShape(p: BlogPost): BlogPost {
  return {
    ...p,
    likes: Array.isArray(p.likes) ? p.likes : [],
    comments: Array.isArray(p.comments) ? p.comments : [],
    mediaUrl: p.mediaUrl ?? null,
    mediaType: p.mediaType ?? null,
  };
}
