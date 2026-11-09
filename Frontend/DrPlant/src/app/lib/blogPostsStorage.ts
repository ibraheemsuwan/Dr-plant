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

export const POSTS_STORAGE_KEY = "drplant_all_posts";

export const DRPLANT_POSTS_CHANGED = "drplant-posts-changed";

function emitPostsChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DRPLANT_POSTS_CHANGED));
  }
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

export const INITIAL_POSTS: BlogPost[] = [
  {
    id: 1,
    title: "Top 10 Tips for Organic Farming Success",
    excerpt:
      "Learn the essential practices for maintaining a thriving organic farm...",
    category: "Farming Tips",
    author: "Sarah Johnson",
    date: new Date(2025, 10, 20),
    userId: 1,
    likes: [],
    comments: [],
  },
  {
    id: 2,
    title: "Understanding Soil pH and Its Impact on Crops",
    excerpt: "Discover how soil acidity affects plant growth and yield...",
    category: "Soil Health",
    author: "Michael Chen",
    date: new Date(2025, 10, 18),
    userId: 2,
    likes: [],
    comments: [],
  },
  {
    id: 3,
    title: "Pest Management: Natural Solutions",
    excerpt: "Explore eco-friendly methods to protect your crops from pests...",
    category: "Pest Control",
    author: "Emma Davis",
    date: new Date(2025, 10, 15),
    userId: 3,
    likes: [],
    comments: [],
  },
  {
    id: 4,
    title: "Water Conservation in Agriculture",
    excerpt: "Best practices for efficient irrigation and water management...",
    category: "Sustainability",
    author: "Ahmed Al-Rashid",
    date: new Date(2025, 10, 12),
    userId: 4,
    likes: [],
    comments: [],
  },
  {
    id: 5,
    title: "Seasonal Planting Guide for Palestine",
    excerpt: "Complete guide to what crops to plant in each season...",
    category: "Seasonal Guide",
    author: "Sarah Johnson",
    date: new Date(2025, 10, 10),
    userId: 1,
    likes: [],
    comments: [],
  },
];

export function serializePosts(items: BlogPost[]) {
  return items.map((post) => ({
    ...post,
    date: post.date instanceof Date ? post.date.toISOString() : post.date,
    comments: (post.comments || []).map((c) => ({
      ...c,
      date: c.date instanceof Date ? c.date.toISOString() : c.date,
    })),
  }));
}

export function hydratePosts(items: unknown[]): BlogPost[] {
  return (items as BlogPost[]).map((post) => ({
    ...ensurePostShape(post),
    date: post.date ? new Date(post.date as string | Date) : new Date(),
    comments: (post.comments || []).map((c) => ({
      ...c,
      date: c.date ? new Date(c.date as string | Date) : new Date(),
    })),
  }));
}

export function loadPostsFromStorage(): BlogPost[] {
  const stored = localStorage.getItem(POSTS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(
      POSTS_STORAGE_KEY,
      JSON.stringify(serializePosts(INITIAL_POSTS)),
    );
    return INITIAL_POSTS.map((p) => ({
      ...ensurePostShape(p),
      date: new Date(p.date),
      comments: p.comments.map((c) => ({
        ...c,
        date: new Date(c.date),
      })),
    }));
  }
  try {
    return hydratePosts(JSON.parse(stored) as unknown[]);
  } catch {
    return INITIAL_POSTS.map((p) => ({
      ...ensurePostShape(p),
      date: new Date(p.date),
      comments: p.comments.map((c) => ({
        ...c,
        date: new Date(c.date),
      })),
    }));
  }
}

export function savePostsToStorage(items: BlogPost[], emit = true) {
  localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(serializePosts(items)));
  if (emit) emitPostsChanged();
}
