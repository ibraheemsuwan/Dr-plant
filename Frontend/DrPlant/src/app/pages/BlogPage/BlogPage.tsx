import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import {
  Calendar,
  Clock,
  Heart,
  ImagePlus,
  MessageCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUser } from "../../contexts/UserContext";
import { getErrorMessage } from "../../api/errors";
import { buildLikeLookup, fetchBlogFeed } from "../../api/services/blogAggregate";
import * as commentsService from "../../api/services/commentsService";
import * as likesService from "../../api/services/likesService";
import * as postsService from "../../api/services/postsService";
import {
  BLOG_CATEGORIES,
  type BlogComment,
  type BlogPost,
  DRPLANT_POSTS_CHANGED,
} from "../../lib/blogTypes";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";
import { Reveal } from "../../components/animations/Reveal";

const ringFocus =
  "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";
const btnPrimary = cn(
  "inline-flex items-center justify-center gap-2 min-h-10 px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-colors disabled:pointer-events-none disabled:opacity-50",
  ringFocus,
);
const btnSecondaryIcon = cn(
  "inline-flex items-center justify-center size-9 rounded-full border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
  ringFocus,
);
const btnOutline = cn(
  "inline-flex items-center justify-center gap-2 min-h-9 px-4 rounded-full text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors disabled:pointer-events-none disabled:opacity-50",
  ringFocus,
);
const btnGhostSm = cn(
  "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-full text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
  ringFocus,
);
const btnGhostIcon = cn(
  "inline-flex items-center justify-center size-9 shrink-0 rounded-full hover:bg-accent text-foreground transition-colors",
  ringFocus,
);

type MediaType = "image" | "video";

export type { BlogPost };

const POSTS_PER_PAGE = 6;

/** عنوان العرض: من post.title أو أول سطر من الوصف (منشورات قديمة بدون ترميز). */
function headingOrFirstLine(post: BlogPost): string {
  const t = post.title.trim();
  if (t) return t;
  const first = post.excerpt.trim().split(/\r?\n/)[0] ?? "";
  if (!first) return "";
  return first.length > 160 ? `${first.slice(0, 160)}…` : first;
}

interface LoggedAuthor {
  name: string;
  id: string;
}

export function BlogPage() {
  const { t, language } = useLanguage();
  const { user } = useUser();

  const loggedInAuthor = useMemo<LoggedAuthor | null>(() => {
    // id === 0 يعني غالباً الـ API لم يُرجع معرفاً؛ لا نعتبر المستخدم جاهزاً للتعليقات/الإعجابات بدون id صالح
    if (!user || user.id <= 0) return null;
    const full = [user.firstName, user.lastName]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ");
    return {
      name: full || user.email.split("@")[0] || user.email,
      id: String(user.id),
    };
  }, [user]);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [blogLoading, setBlogLoading] = useState(true);
  const [blogError, setBlogError] = useState<string | null>(null);
  const [likeLookup, setLikeLookup] = useState<Map<string, number>>(new Map());
  const [submitting, setSubmitting] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  /** number of posts in each tab, independent of the category filter */
  const [sectionCounts, setSectionCounts] = useState({ my: 0, community: 0 });
  const [showNewPostForm, setShowNewPostForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    category: "General",
    mediaUrl: null as string | null,
    mediaType: null as MediaType | null,
  });
  const [postSection, setPostSection] = useState<"my" | "community">(
    "community",
  );
  const [modalPostId, setModalPostId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [editingPostId, setEditingPostId] = useState<number | null>(null);

  // The latest page/filters, readable from handlers without stale closures
  const queryRef = useRef({ page: 1, category: "All", section: "community" as "my" | "community", userId: 0 });
  queryRef.current = {
    page: currentPage,
    category: selectedCategory,
    section: postSection,
    userId: loggedInAuthor ? Number(loggedInAuthor.id) : 0,
  };

  const loadBlog = useCallback(async () => {
    const { page, category, section, userId } = queryRef.current;
    setBlogLoading(true);
    setBlogError(null);
    try {
      const [feed, mine, community] = await Promise.all([
        fetchBlogFeed({
          page,
          pageSize: POSTS_PER_PAGE,
          category,
          userId: section === "my" && userId > 0 ? userId : undefined,
          excludeUserId: section === "community" && userId > 0 ? userId : undefined,
        }),
        // one-post pages: only their totals are used, for the tab counters
        userId > 0 ? fetchBlogFeed({ page: 1, pageSize: 1, userId }) : Promise.resolve(null),
        fetchBlogFeed({ page: 1, pageSize: 1, excludeUserId: userId > 0 ? userId : undefined }),
      ]);

      // The current page no longer exists (e.g. its last post was deleted): go back, the effect reloads
      if (feed.posts.length === 0 && page > 1 && feed.totalPages > 0) {
        setCurrentPage(feed.totalPages);
        return;
      }

      setPosts(feed.posts);
      setTotalPages(Math.max(1, feed.totalPages));
      setLikeLookup(feed.likeLookup);
      setSectionCounts({ my: mine?.total ?? 0, community: community.total });
    } catch (e) {
      setBlogError(getErrorMessage(e));
      setPosts([]);
    } finally {
      setBlogLoading(false);
    }
  }, []);

  // Reload whenever the page, the category, the tab or the signed-in user changes
  useEffect(() => {
    void loadBlog();
  }, [loadBlog, currentPage, selectedCategory, postSection, loggedInAuthor?.id]);

  useEffect(() => {
    const sync = () => void loadBlog();
    window.addEventListener(DRPLANT_POSTS_CHANGED, sync);
    return () => window.removeEventListener(DRPLANT_POSTS_CHANGED, sync);
  }, [loadBlog]);

  useEffect(() => {
    if (!loggedInAuthor && postSection === "my") setPostSection("community");
  }, [loggedInAuthor, postSection]);

  const handleAddPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInAuthor || !user || user.id <= 0) {
      alert(t("loginToPost"));
      return;
    }
    const contentTrim = formData.excerpt.trim();
    if (!contentTrim) {
      alert(t("fillAllFields"));
      return;
    }
    try {
      setSubmitting(true);
      const categoryTrim = (formData.category || "").trim() || "General";

      const payload = {
        title: formData.title.trim(),
        content: contentTrim,
        category: categoryTrim,
        userId: user.id,
        file: mediaFile,
      };
      if (editingPostId != null) {
        await postsService.updatePost(editingPostId, payload);
        alert(t("postUpdatedSuccess"));
      } else {
        await postsService.createPost(payload);
        alert(t("postCreatedSuccess"));
      }
      setFormData({
        title: "",
        excerpt: "",
        category: "General",
        mediaUrl: null,
        mediaType: null,
      });
      setMediaFile(null);
      setShowNewPostForm(false);
      setEditingPostId(null);
      // new posts appear on page 1: change page (the effect reloads) or reload in place
      if (currentPage !== 1) setCurrentPage(1);
      else await loadBlog();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      setSubmitting(true);
      await postsService.deletePost(id);
      await loadBlog();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setMediaFile(null);
      setFormData((prev) => ({ ...prev, mediaUrl: null, mediaType: null }));
      return;
    }
    const isVideo = file.type.startsWith("video/");
    const hasImageExt = /\.(jpe?g|png|gif|webp|bmp|heic|svg)$/i.test(file.name);
    const isImage =
      file.type.startsWith("image/") || (!file.type && hasImageExt);
    if (isVideo) {
      alert(
        language === "ar"
          ? "الفيديو غير مدعوم حالياً في الباك. استخدم صورة."
          : "Video is not supported by the backend yet. Please use an image.",
      );
      e.target.value = "";
      return;
    }
    if (!isImage) {
      alert(t("imageOrVideoHint"));
      e.target.value = "";
      return;
    }
    setMediaFile(isImage ? file : null);
    const reader = new FileReader();
    reader.onload = () => {
      setFormData((prev) => ({
        ...prev,
        mediaUrl: reader.result as string,
        mediaType: "image",
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const clearMedia = () => {
    setMediaFile(null);
    setFormData((prev) => ({ ...prev, mediaUrl: null, mediaType: null }));
  };

  const handleLike = async (post: BlogPost) => {
    if (!loggedInAuthor || !user || user.id <= 0) {
      alert(t("loginToLike"));
      return;
    }
    const key = `${String(post.id)}:${String(user.id)}`;
    const liked = isLiked(post);
    try {
      setSubmitting(true);
      if (liked) {
        let likeId = likeLookup.get(key);
        if (likeId == null || likeId <= 0) {
          const raw = await likesService.listLikesRaw(post.id);
          const m = buildLikeLookup(raw);
          setLikeLookup(m);
          likeId = m.get(key);
        }
        if (likeId != null && likeId > 0) {
          await likesService.deleteLike(likeId);
        } else {
          alert(t("couldNotRemoveLike"));
        }
      } else {
        await likesService.createLike({ postId: post.id, userId: user.id });
      }
      await loadBlog();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCommentClick = (post: BlogPost) => {
    setModalPostId(post.id);
    setCommentText("");
  };

  const handleCloseModal = () => {
    setModalPostId(null);
    setCommentText("");
  };

  useEffect(() => {
    if (modalPostId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setModalPostId(null);
        setCommentText("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalPostId]);

  const canDeleteComment = (c: BlogComment, post: BlogPost) => {
    if (!loggedInAuthor || !user || c.id <= 0) return false;
    const uid = String(user.id);
    const isCommentAuthor = String(c.authorId) === uid;
    const isPostOwner = String(post.userId) === loggedInAuthor.id;
    return isCommentAuthor || isPostOwner;
  };

  const handleDeleteComment = async (commentId: number) => {
    if (commentId <= 0) return;
    if (!confirm(t("deleteCommentConfirm"))) return;
    try {
      setSubmitting(true);
      await commentsService.deleteComment(commentId);
      await loadBlog();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInAuthor || !user || user.id <= 0) {
      alert(t("loginToComment"));
      return;
    }
    const text = (commentText || "").trim();
    if (!text || !modalPostId) return;
    try {
      setSubmitting(true);
      await commentsService.createComment({
        postId: modalPostId,
        userId: user.id,
        content: text,
        authorName: loggedInAuthor.name,
      });
      setCommentText("");
      await loadBlog();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isLiked = (post: BlogPost) =>
    Boolean(
      loggedInAuthor &&
      Array.isArray(post.likes) &&
      post.likes.includes(String(loggedInAuthor.id)),
    );

  // Categories offered in the filter: the standard ones, plus the selected one if it is a custom category
  const allCategories = [
    "All",
    ...new Set<string>([...BLOG_CATEGORIES, ...(selectedCategory !== "All" ? [selectedCategory] : [])]),
  ];

  // The server already filtered, sorted and cut the list to this page
  const paginatedPosts = posts;
  const myPostsCount = sectionCounts.my;
  const communityPostsCount = sectionCounts.community;

  const modalPost = modalPostId
    ? posts.find((p) => p.id === modalPostId)
    : null;

  const locale = language === "ar" ? "ar" : "en-US";

  const formatDate = (date: Date) =>
    date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatTime = (date: Date) =>
    date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });

  const headingFont = "'Playfair Display', 'Noto Kufi Arabic', serif";

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklch,var(--color-primary)_12%,transparent),transparent)] opacity-90"
        aria-hidden
      />
      <Reveal>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <header className="text-center mb-12 max-w-2xl mx-auto">
          <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {t("blog")}
          </span>
          <h1
            className="text-4xl sm:text-5xl font-bold text-foreground mb-4"
            style={{ fontFamily: headingFont }}
          >
            {t("blogPageTitle")}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            {t("blogPageSubtitle")}
          </p>
        </header>

        {blogError ? (
          <p
            role="alert"
            className="text-center text-destructive text-sm mb-6 max-w-xl mx-auto"
          >
            {blogError}
          </p>
        ) : null}

        {(loggedInAuthor && myPostsCount > 0) || communityPostsCount > 0 ? (
          <div
            className="flex flex-wrap gap-2 justify-center mb-8"
            role="tablist"
          >
            {loggedInAuthor ? (
              <button
                type="button"
                role="tab"
                aria-selected={postSection === "my"}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium border transition-all",
                  postSection === "my"
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                    : "bg-card border-border hover:border-primary/40 hover:text-primary",
                )}
                onClick={() => {
                  setPostSection("my");
                  setCurrentPage(1);
                }}
              >
                {t("myPosts")} ({myPostsCount})
              </button>
            ) : null}
            <button
              type="button"
              role="tab"
              aria-selected={postSection === "community"}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium border transition-all",
                postSection === "community"
                  ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                  : "bg-card border-border hover:border-primary/40 hover:text-primary",
              )}
              onClick={() => {
                setPostSection("community");
                setCurrentPage(1);
              }}
            >
              {t("communityPosts")} ({communityPostsCount})
            </button>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="categorySelect"
              className="text-sm font-medium text-muted-foreground"
            >
              {t("filterByCategory")}
            </label>
            <select
              id="categorySelect"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="h-10 w-full sm:w-64 rounded-lg border border-border/80 bg-card px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:border-white/15"
            >
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "All" ? t("allCategories") : cat}
                </option>
              ))}
            </select>
          </div>

          {loggedInAuthor ? (
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                if (showNewPostForm) {
                  setShowNewPostForm(false);
                  setEditingPostId(null);
                  setFormData({
                    title: "",
                    excerpt: "",
                    category: "General",
                    mediaUrl: null,
                    mediaType: null,
                  });
                  setMediaFile(null);
                } else {
                  setEditingPostId(null);
                  setFormData({
                    title: "",
                    excerpt: "",
                    category: "General",
                    mediaUrl: null,
                    mediaType: null,
                  });
                  setMediaFile(null);
                  setShowNewPostForm(true);
                }
              }}
            >
              {showNewPostForm ? (
                t("cancelEdit")
              ) : (
                <>
                  <Plus className="size-4" />
                  {t("newPost")}
                </>
              )}
            </button>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("loginToPost")}{" "}
              <Link
                to="/login"
                className="text-primary font-medium underline-offset-4 hover:underline"
              >
                {t("loginToPostLink")}
              </Link>
            </p>
          )}
        </div>

        {loggedInAuthor && showNewPostForm ? (
          <form
            onSubmit={handleAddPost}
            className="mb-10 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm space-y-4"
          >
            <Input
              placeholder={t("postTitle")}
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="rounded-xl"
            />
            <Textarea
              placeholder={t("postContent")}
              rows={4}
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              className="rounded-xl resize-y min-h-[120px]"
            />
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="h-10 w-full rounded-lg border border-border/80 bg-card px-3 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:border-white/15"
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
              {formData.mediaUrl ? (
                <div className="relative rounded-xl overflow-hidden max-h-64">
                  {formData.mediaType === "image" ? (
                    <img
                      src={formData.mediaUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <video
                      src={formData.mediaUrl}
                      muted
                      loop
                      controls
                      className="w-full max-h-64"
                    />
                  )}
                  <button
                    type="button"
                    className={cn(btnSecondaryIcon, "absolute top-2 end-2")}
                    onClick={clearMedia}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 cursor-pointer py-6">
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleMediaChange}
                    className="sr-only"
                  />
                  <ImagePlus className="size-8 text-primary" />
                  <span className="text-sm font-medium">
                    {t("addImageOrVideo")}
                  </span>
                  <span className="text-xs text-muted-foreground text-center max-w-sm">
                    {t("imageOrVideoHint")}
                  </span>
                </label>
              )}
            </div>
            <button type="submit" className={btnPrimary} disabled={submitting}>
              {editingPostId != null ? t("savePost") : t("createPost")}
            </button>
          </form>
        ) : null}

        <div className="grid gap-6 sm:gap-8">
          {blogLoading && posts.length === 0 ? (
            <div className="flex justify-center py-20" aria-busy="true">
              <span className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : null}
          {paginatedPosts.map((post) => (
            <article
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => handleCommentClick(post)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCommentClick(post);
                }
              }}
              className="group rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 text-start cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3 mb-4">
                <span className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {post.category}
                </span>
                {loggedInAuthor &&
                String(post.userId) === String(loggedInAuthor.id) ? (
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      className={btnGhostIcon}
                      title={t("editPost")}
                      disabled={submitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPostId(post.id);
                        setFormData({
                          title: post.title,
                          excerpt: post.excerpt,
                          category: post.category,
                          mediaUrl: post.mediaUrl ?? null,
                          mediaType: post.mediaType ?? null,
                        });
                        setMediaFile(null);
                        setShowNewPostForm(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        btnGhostIcon,
                        "text-destructive hover:text-destructive",
                      )}
                      title={t("deletePost")}
                      disabled={submitting}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeletePost(post.id);
                      }}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ) : null}
              </div>
              <h3
                className="text-xl sm:text-2xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors"
                style={{ fontFamily: headingFont }}
              >
                {headingOrFirstLine(post)}
              </h3>
              <p className="text-muted-foreground leading-relaxed mb-4 line-clamp-4">
                {post.excerpt}
              </p>
              {post.mediaUrl ? (
                <div
                  className="rounded-2xl overflow-hidden border border-border mb-4 max-h-72"
                  onClick={(e) => e.stopPropagation()}
                >
                  {post.mediaType === "video" ? (
                    <video
                      src={post.mediaUrl}
                      muted
                      loop
                      playsInline
                      controls
                      className="w-full max-h-72 object-cover"
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt=""
                      className="w-full max-h-72 object-cover"
                    />
                  )}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mb-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-7 rounded-full bg-linear-to-br from-green-300 to-emerald-600 text-white text-xs font-bold flex items-center justify-center">
                    {post.author[0]?.toUpperCase() ?? "?"}
                  </span>
                  {post.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  {formatDate(post.date)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {formatTime(post.date)}
                </span>
              </div>
              <div className="flex gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  disabled={submitting}
                  className={cn(
                    btnGhostSm,
                    isLiked(post) && "text-red-600 dark:text-red-400",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleLike(post);
                  }}
                >
                  <Heart
                    className={cn("size-4", isLiked(post) && "fill-current")}
                  />
                  {(post.likes || []).length}
                </button>
                <button
                  type="button"
                  className={btnGhostSm}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCommentClick(post);
                  }}
                >
                  <MessageCircle className="size-4" />
                  {(post.comments || []).length}
                </button>
              </div>
            </article>
          ))}
        </div>

        {!blogLoading && posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16 rounded-3xl border border-dashed border-border">
            {language === "ar"
              ? "لا توجد منشورات في هذا القسم."
              : "No posts in this section yet."}
          </p>
        ) : null}

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
            <button
              type="button"
              className={btnOutline}
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            >
              {t("previous")}
            </button>
            <span className="text-sm text-muted-foreground tabular-nums">
              {t("page")} {currentPage} {t("of")} {totalPages}
            </span>
            <button
              type="button"
              className={btnOutline}
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            >
              {t("next")}
            </button>
          </div>
        ) : null}
      </div>
      </Reveal>

      {modalPost ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-modal-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={handleCloseModal}
            aria-label={t("close")}
          />
          <div className="relative w-full max-w-2xl max-h-[min(90vh,800px)] overflow-y-auto rounded-3xl border border-border bg-background p-6 shadow-xl">
            <button
              type="button"
              onClick={handleCloseModal}
              className="absolute top-4 end-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              aria-label={t("close")}
            >
              <X className="size-5" />
            </button>
            <div className="text-start space-y-2 mb-4">
              <span className="inline-flex w-fit px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                {modalPost.category}
              </span>
              <h2
                id="blog-modal-title"
                className="text-2xl sm:text-3xl font-bold leading-tight pe-10"
                style={{ fontFamily: headingFont }}
              >
                {headingOrFirstLine(modalPost)}
              </h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              {modalPost.excerpt}
            </p>
            {modalPost.mediaUrl ? (
              <div className="rounded-2xl overflow-hidden border border-border mt-4">
                {modalPost.mediaType === "video" ? (
                  <video
                    src={modalPost.mediaUrl}
                    muted
                    loop
                    playsInline
                    controls
                    className="w-full max-h-80 object-cover"
                  />
                ) : (
                  <img
                    src={modalPost.mediaUrl}
                    alt=""
                    className="w-full max-h-80 object-cover"
                  />
                )}
              </div>
            ) : null}
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-4">
              <span>{modalPost.author}</span>
              <span>
                {formatDate(modalPost.date)} · {formatTime(modalPost.date)}
              </span>
            </div>

            <div className="border-t border-border pt-4 mt-6 space-y-3">
              <h4 className="font-semibold text-foreground">
                {t("comments")} ({(modalPost.comments || []).length})
              </h4>
              <div className="space-y-3 max-h-48 overflow-y-auto pe-1">
                {(modalPost.comments || []).map((c) => (
                  <div
                    key={c.id}
                    className="rounded-xl bg-muted/50 p-3 text-sm flex gap-2 justify-between items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">
                        {c.authorName}
                      </p>
                      <p className="text-muted-foreground mt-1">{c.text}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(c.date)} {formatTime(c.date)}
                      </p>
                    </div>
                    {canDeleteComment(c, modalPost) ? (
                      <button
                        type="button"
                        title={t("deleteComment")}
                        disabled={submitting}
                        className={cn(
                          btnGhostIcon,
                          "shrink-0 text-destructive hover:text-destructive",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteComment(c.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
              {loggedInAuthor ? (
                <form onSubmit={handleAddComment} className="space-y-2">
                  <Textarea
                    placeholder={t("writeComment")}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="rounded-xl resize-y"
                  />
                  <button
                    type="submit"
                    className={btnPrimary}
                    disabled={submitting}
                  >
                    {t("addComment")}
                  </button>
                </form>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Link
                    to="/login"
                    className="text-primary font-medium underline-offset-4 hover:underline"
                  >
                    {t("loginToComment")}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
