import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { createPortal } from "react-dom";
import {
  Calendar,
  ChevronDown,
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
import {
  buildLikeLookup,
  fetchBlogPostsMerged,
} from "../../api/services/blogAggregate";
import * as commentsService from "../../api/services/commentsService";
import * as likesService from "../../api/services/likesService";
import * as postsService from "../../api/services/postsService";
import { DRPLANT_POSTS_CHANGED } from "../../api/events";
import {
  BLOG_CATEGORIES,
  blogCategoryTranslationKey,
  type BlogComment,
  type BlogPost,
} from "../../lib/blogTypes";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { cn } from "../../components/ui/utils";
import { Reveal } from "../../components/animations/Reveal";
import { PageLabel } from "../../components/PageLabel";
import { formatPalestineDate, formatPalestineTime } from "../../lib/dateTime";
import { showAppAlert, showAppConfirm } from "../../lib/sweetAlert";

function formatBlogCategoryLabel(
  category: string,
  t: (key: string) => string,
): string {
  const key = blogCategoryTranslationKey(category);
  return key ? t(key) : category;
}

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
  const { user, isAdmin } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const loadBlog = useCallback(async (): Promise<BlogPost[]> => {
    setBlogLoading(true);
    setBlogError(null);
    try {
      const [merged, likesRaw] = await Promise.all([
        fetchBlogPostsMerged(),
        likesService.listLikesRaw(),
      ]);
      setPosts(merged);
      setLikeLookup(buildLikeLookup(likesRaw));
      return merged;
    } catch (e) {
      setBlogError(getErrorMessage(e));
      setPosts([]);
      return [];
    } finally {
      setBlogLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBlog();
  }, [loadBlog]);

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
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
        text: t("loginToPost"),
      });
      return;
    }
    const contentTrim = formData.excerpt.trim();
    if (!contentTrim) {
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "حقول ناقصة" : "Missing fields",
        text: t("fillAllFields"),
      });
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
        await showAppAlert({
          language,
          kind: "success",
          title: language === "ar" ? "تم التحديث" : "Updated",
          text: t("postUpdatedSuccess"),
        });
      } else {
        await postsService.createPost(payload);
        await showAppAlert({
          language,
          kind: "success",
          title: language === "ar" ? "تم النشر" : "Created",
          text: t("postCreatedSuccess"),
        });
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
      await loadBlog();
    } catch (err) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "فشل العملية" : "Operation failed",
        text: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePost = async (id: number) => {
    const ok = await showAppConfirm({
      language,
      title: t("deleteConfirm"),
      text:
        language === "ar"
          ? "لن يمكن استعادة المنشور بعد الحذف."
          : "This action cannot be undone.",
      confirmText: language === "ar" ? "حذف" : "Delete",
      cancelText: language === "ar" ? "إلغاء" : "Cancel",
    });
    if (!ok) return;
    try {
      setSubmitting(true);
      await postsService.deletePost(id);
      await loadBlog();
    } catch (err) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "فشل الحذف" : "Delete failed",
        text: getErrorMessage(err),
      });
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
      void showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "نوع غير مدعوم" : "Unsupported type",
        text:
          language === "ar"
            ? "الفيديو غير مدعوم حالياً في الباك. استخدم صورة."
            : "Video is not supported by the backend yet. Please use an image.",
      });
      e.target.value = "";
      return;
    }
    if (!isImage) {
      void showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "ملف غير صالح" : "Invalid file",
        text: t("imageOrVideoHint"),
      });
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
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
        text: t("loginToLike"),
      });
      return;
    }
    const key = `${String(post.id)}:${String(user.id)}`;
    const liked = isLiked(post);
    try {
      setSubmitting(true);
      if (liked) {
        let likeId = likeLookup.get(key);
        if (likeId == null || likeId <= 0) {
          const raw = await likesService.listLikesRaw();
          const m = buildLikeLookup(raw);
          setLikeLookup(m);
          likeId = m.get(key);
        }
        if (likeId != null && likeId > 0) {
          await likesService.deleteLike(likeId);
        } else {
          await showAppAlert({
            language,
            kind: "error",
            title: language === "ar" ? "تعذر الإزالة" : "Could not remove",
            text: t("couldNotRemoveLike"),
          });
        }
      } else {
        await likesService.createLike({ postId: post.id, userId: user.id });
      }
      await loadBlog();
    } catch (err) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "فشل العملية" : "Operation failed",
        text: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openPostModal = useCallback(
    (postId: number) => {
      setModalPostId(postId);
      setCommentText("");
      const next = new URLSearchParams(searchParams);
      next.set("post", String(postId));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleCommentClick = (post: BlogPost) => {
    openPostModal(post.id);
  };

  const handleCloseModal = useCallback(() => {
    setModalPostId(null);
    setCommentText("");
    const next = new URLSearchParams(searchParams);
    next.delete("post");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  /** URL `?post=` is the source of truth — avoids reopening after close (race with modalPostId). */
  useEffect(() => {
    const raw = searchParams.get("post");
    if (!raw) {
      setModalPostId(null);
      return;
    }
    const id = Number(raw);
    if (!Number.isFinite(id) || id <= 0) {
      setModalPostId(null);
      return;
    }
    setModalPostId(id);
  }, [searchParams]);

  useEffect(() => {
    if (modalPostId == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalPostId, handleCloseModal]);

  const canDeleteComment = (c: BlogComment, post: BlogPost) => {
    if (!loggedInAuthor || !user || c.id <= 0) return false;
    if (isAdmin) return true;
    const uid = String(user.id);
    const isCommentAuthor = String(c.authorId) === uid;
    const isPostOwner = String(post.userId) === loggedInAuthor.id;
    return isCommentAuthor || isPostOwner;
  };

  const handleDeleteComment = async (commentId: number) => {
    if (commentId <= 0) return;
    const ok = await showAppConfirm({
      language,
      title: t("deleteCommentConfirm"),
      text:
        language === "ar"
          ? "لن يمكن استعادة التعليق بعد الحذف."
          : "This action cannot be undone.",
      confirmText: language === "ar" ? "حذف" : "Delete",
      cancelText: language === "ar" ? "إلغاء" : "Cancel",
    });
    if (!ok) return;
    try {
      setSubmitting(true);
      await commentsService.deleteComment(commentId);
      await loadBlog();
    } catch (err) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "فشل الحذف" : "Delete failed",
        text: getErrorMessage(err),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loggedInAuthor || !user || user.id <= 0) {
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
        text: t("loginToComment"),
      });
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
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "فشل الإضافة" : "Add failed",
        text: getErrorMessage(err),
      });
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

  const allCategories = ["All", ...BLOG_CATEGORIES];

  const myPosts = loggedInAuthor
    ? posts.filter((p) => String(p.userId) === String(loggedInAuthor.id))
    : [];
  const communityPosts = loggedInAuthor
    ? posts.filter((p) => String(p.userId) !== String(loggedInAuthor.id))
    : posts;

  const sectionPosts = postSection === "my" ? myPosts : communityPosts;

  const filteredPosts =
    selectedCategory === "All"
      ? sectionPosts
      : sectionPosts.filter((p) => p.category === selectedCategory);

  const modalPost = modalPostId
    ? posts.find((p) => p.id === modalPostId)
    : null;

  const formatDate = (date: Date) => formatPalestineDate(date, language);
  const formatTime = (date: Date) => formatPalestineTime(date, language);

  const headingFont = "'Playfair Display', 'Noto Kufi Arabic', serif";

  return (
    <div className="relative min-h-screen bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,color-mix(in_oklch,var(--color-primary)_12%,transparent),transparent)] opacity-90"
        aria-hidden
      />
      <Reveal variant="rise">
        <div className="relative py-12 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <header className="text-center mb-16 max-w-2xl mx-auto">
              <PageLabel icon={MessageCircle}>{t("blog")}</PageLabel>
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

            {(loggedInAuthor && myPosts.length > 0) ||
            communityPosts.length > 0 ? (
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
                      "min-h-10 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
                      postSection === "my"
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                        : "border-border/90 bg-card text-foreground shadow-sm hover:border-primary/45 hover:bg-muted/50 dark:border-white/14 dark:bg-white/5 dark:text-foreground dark:hover:border-primary/50 dark:hover:bg-white/10",
                    )}
                    onClick={() => {
                      setPostSection("my");
                    }}
                  >
                    {t("myPosts")} ({myPosts.length})
                  </button>
                ) : null}
                <button
                  type="button"
                  role="tab"
                  aria-selected={postSection === "community"}
                  className={cn(
                    "min-h-10 rounded-full border px-5 py-2.5 text-sm font-semibold transition-all",
                    postSection === "community"
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "border-border/90 bg-card text-foreground shadow-sm hover:border-primary/45 hover:bg-muted/50 dark:border-white/14 dark:bg-white/5 dark:text-foreground dark:hover:border-primary/50 dark:hover:bg-white/10",
                  )}
                  onClick={() => {
                    setPostSection("community");
                  }}
                >
                  {t("communityPosts")} ({communityPosts.length})
                </button>
              </div>
            ) : null}

            <div className="mx-auto w-full max-w-3xl">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex w-full flex-col gap-2 sm:w-auto">
                  <label
                    htmlFor="categorySelect"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    {t("filterByCategory")}
                  </label>
                  <div className="relative w-full sm:w-64">
                    <select
                      id="categorySelect"
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                      }}
                      className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-border/80 bg-card px-3 pe-9 text-sm text-foreground shadow-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:border-white/15 scheme-light dark:scheme-dark"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat === "All"
                            ? t("allCategories")
                            : formatBlogCategoryLabel(cat, t)}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute top-1/2 end-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                  </div>
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
                        <Plus className="size-4 shrink-0" />
                        {t("newPost")}
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground sm:text-end">
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
                        {formatBlogCategoryLabel(c, t)}
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
                          className={cn(
                            btnSecondaryIcon,
                            "absolute top-2 inset-e-2",
                          )}
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
                  <button
                    type="submit"
                    className={btnPrimary}
                    disabled={submitting}
                  >
                    {editingPostId != null ? t("savePost") : t("createPost")}
                  </button>
                </form>
              ) : null}

              <div className="grid gap-7 sm:gap-9">
                {blogLoading && posts.length === 0 ? (
                  <div className="flex justify-center py-20" aria-busy="true">
                    <span className="size-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : null}
                {filteredPosts.map((post) => (
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
                    className="group relative cursor-pointer overflow-hidden rounded-3xl border border-border/90 bg-card text-start shadow-md ring-1 ring-black/4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-2xl hover:shadow-primary/10 dark:ring-white/6 dark:hover:shadow-primary/20"
                  >
                    <div
                      className="h-1 w-full shrink-0 bg-linear-to-r from-emerald-600 via-primary to-lime-400"
                      aria-hidden
                    />
                    {post.mediaUrl ? (
                      <div className="relative max-h-52 w-full overflow-hidden bg-muted/40 sm:max-h-64">
                        {post.mediaType === "video" ? (
                          <video
                            src={post.mediaUrl}
                            muted
                            loop
                            playsInline
                            controls
                            className="w-full max-h-52 object-cover sm:max-h-64"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <img
                            src={post.mediaUrl}
                            alt=""
                            className="h-full w-full max-h-52 object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] sm:max-h-64"
                          />
                        )}
                      </div>
                    ) : (
                      <div
                        className="relative h-24 overflow-hidden bg-linear-to-br from-primary/[0.14] via-emerald-600/8 to-transparent sm:h-28"
                        aria-hidden
                      >
                        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_70%_80%_at_20%_0%,color-mix(in_oklch,var(--color-primary)_35%,transparent),transparent_65%)]" />
                      </div>
                    )}

                    <div className="space-y-4 p-5 sm:p-7">
                      <div className="flex items-start justify-between gap-3">
                        <span className="inline-flex items-center border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary rounded-full">
                          {formatBlogCategoryLabel(
                            post.category || "General",
                            t,
                          )}
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
                                  category: post.category || "General",
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
                        className="text-xl font-bold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-2xl sm:leading-tight"
                        style={{ fontFamily: headingFont }}
                      >
                        {headingOrFirstLine(post)}
                      </h3>
                      <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground sm:text-base sm:line-clamp-4">
                        {post.excerpt}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border/70 bg-muted/25 px-3 py-2.5 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 font-medium text-foreground/90">
                          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary/90 to-emerald-700 text-xs font-bold text-primary-foreground shadow-sm">
                            {post.author[0]?.toUpperCase() ?? "?"}
                          </span>
                          {post.author}
                        </span>
                        <span
                          className="hidden h-4 w-px bg-border sm:block"
                          aria-hidden
                        />
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Calendar className="size-3.5 shrink-0 opacity-70" />
                          {formatDate(post.date)}
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums">
                          <Clock className="size-3.5 shrink-0 opacity-70" />
                          {formatTime(post.date)}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 border-t border-border/80 pt-4">
                        <button
                          type="button"
                          disabled={submitting}
                          className={cn(
                            btnGhostSm,
                            "rounded-full bg-muted/30 px-3.5",
                            isLiked(post) && "text-red-600 dark:text-red-400",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleLike(post);
                          }}
                        >
                          <Heart
                            className={cn(
                              "size-4",
                              isLiked(post) && "fill-current",
                            )}
                          />
                          {(post.likes || []).length}
                        </button>
                        <button
                          type="button"
                          className={cn(
                            btnGhostSm,
                            "rounded-full bg-muted/30 px-3.5",
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCommentClick(post);
                          }}
                        >
                          <MessageCircle className="size-4" />
                          {(post.comments || []).length}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {!blogLoading && filteredPosts.length === 0 ? (
                <p className="text-center text-muted-foreground py-16 rounded-3xl border border-dashed border-border">
                  {language === "ar"
                    ? "لا توجد منشورات في هذا القسم."
                    : "No posts in this section yet."}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </Reveal>

      {modalPost
        ? createPortal(
            <div
              className="scrollbar-themed fixed inset-0 z-100 flex items-center justify-center overflow-y-auto p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="blog-modal-title"
            >
              <button
                type="button"
                className="animate-dr-modal-backdrop absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                onClick={handleCloseModal}
                aria-label={t("close")}
              />
              <div className="scrollbar-themed animate-dr-modal-panel relative z-10 mt-auto mb-auto w-full max-w-2xl max-h-[min(calc(100vh-3rem),800px)] overflow-y-auto overscroll-contain rounded-3xl border border-border bg-background p-6 shadow-xl dark:border-white/12">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="absolute top-4 z-20 inset-e-4 rounded-full border border-border/90 bg-card p-2 text-foreground shadow-sm transition-colors hover:border-primary/45 hover:bg-muted dark:border-white/14 dark:bg-card/95"
                  aria-label={t("close")}
                >
                  <X className="size-5" />
                </button>
                <div className="text-start space-y-2 mb-4">
                  <span className="inline-flex w-fit px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                    {formatBlogCategoryLabel(modalPost.category, t)}
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
                  <div className="scrollbar-themed max-h-48 space-y-3 overflow-y-auto pe-1">
                    {(modalPost.comments || []).map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border border-border bg-card p-3 text-sm shadow-sm flex gap-2 justify-between items-start"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">
                            {c.authorName}
                          </p>
                          <p className="text-foreground/90 mt-1 break-words leading-relaxed">
                            {c.text}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 tabular-nums">
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
                        className="rounded-xl resize-y min-h-[4.5rem] border-border bg-background text-foreground shadow-sm"
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
