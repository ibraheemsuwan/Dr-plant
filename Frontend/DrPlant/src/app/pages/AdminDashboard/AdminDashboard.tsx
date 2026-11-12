import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import {
  ArrowLeft,
  FileText,
  LayoutDashboard,
  Leaf,
  Mail,
  Sprout,
  Trash2,
  Users,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUser } from "../../contexts/UserContext";
import { getErrorMessage } from "../../api/errors";
import { mapApiCropDto, type ApiCropCard } from "../../api/cropsMap";
import {
  emitApiCropsChanged,
  DRPLANT_API_CROPS_CHANGED,
} from "../../api/events";
import * as cropsService from "../../api/services/cropsService";
import * as postsService from "../../api/services/postsService";
import * as usersService from "../../api/services/usersService";
import { fetchBlogPostsMerged } from "../../api/services/blogAggregate";
import type { AuthUser } from "../../api/types";
import type {
  ContactMessage,
  ContactMessageStatus,
} from "../../api/services/contactMessagesService";
import * as contactMessagesService from "../../api/services/contactMessagesService";
import emailjs from "@emailjs/browser";
import { SEASON_IDS, type SeasonTabId } from "../../data/seasonalCropsData";
import {
  DRPLANT_POSTS_CHANGED,
  type BlogPost,
} from "../../lib/blogTypes";

type AdminTab = "users" | "crops" | "posts" | "messages";

const headingFont = "'Playfair Display', 'Noto Kufi Arabic', serif";
const EMAILJS_SERVICE_ID = "service_wvxexne";
const EMAILJS_REPLY_TEMPLATE_ID = "template_7qo6txb";
const EMAILJS_PUBLIC_KEY = "Lwn0SYM9kr1o0y1V4";

export function AdminDashboard() {
  const { t, language } = useLanguage();
  const { user, isLoggedIn, isAdmin, logout } = useUser();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>("users");
  const [version, setVersion] = useState(0);

  const [apiUsers, setApiUsers] = useState<AuthUser[]>([]);
  const [apiCrops, setApiCrops] = useState<ApiCropCard[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);

  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingCrops, setLoadingCrops] = useState(false);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [messageQuery, setMessageQuery] = useState("");
  const [messageFilter, setMessageFilter] = useState<
    "all" | ContactMessageStatus
  >("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [replyDraft, setReplyDraft] = useState("");
  const [replySending, setReplySending] = useState(false);
  const [replyNotice, setReplyNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setApiUsers(await usersService.listUsers());
    } catch {
      setApiUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  const loadCrops = useCallback(async () => {
    setLoadingCrops(true);
    try {
      const raw = await cropsService.listCropsRaw();
      const cards = raw
        .map((r) => mapApiCropDto(r))
        .filter((c): c is ApiCropCard => c != null);
      setApiCrops(cards);
    } catch {
      setApiCrops([]);
    } finally {
      setLoadingCrops(false);
    }
  }, []);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      setPosts(await fetchBlogPostsMerged());
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadMessages = useCallback(async () => {
    setLoadingMessages(true);
    try {
      const rows = await contactMessagesService.getContactMessages();
      setMessages(rows);
      if (selectedMessageId && !rows.some((m) => m.id === selectedMessageId)) {
        setSelectedMessageId(null);
        setReplyDraft("");
      }
    } catch {
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [selectedMessageId]);

  useEffect(() => {
    if (tab === "users") void loadUsers();
  }, [tab, version, loadUsers]);

  useEffect(() => {
    if (tab === "crops") void loadCrops();
  }, [tab, version, loadCrops]);

  useEffect(() => {
    if (tab === "posts") void loadPosts();
  }, [tab, version, loadPosts]);

  useEffect(() => {
    if (tab === "messages") void loadMessages();
  }, [tab, version, loadMessages]);

  useEffect(() => {
    const onPosts = () => void loadPosts();
    window.addEventListener(DRPLANT_POSTS_CHANGED, onPosts);
    return () => window.removeEventListener(DRPLANT_POSTS_CHANGED, onPosts);
  }, [loadPosts]);

  useEffect(() => {
    const onCrops = () => void loadCrops();
    window.addEventListener(DRPLANT_API_CROPS_CHANGED, onCrops);
    return () => window.removeEventListener(DRPLANT_API_CROPS_CHANGED, onCrops);
  }, [loadCrops]);

  const [cropForm, setCropForm] = useState({
    season: "spring" as SeasonTabId,
    nameEn: "",
    nameAr: "",
    plantingEn: "",
    plantingAr: "",
    growthEn: "",
    growthAr: "",
    difficultyEn: "",
    difficultyAr: "",
    difficultyLevel: 2 as 1 | 2 | 3,
    imagePreview: "" as string,
  });
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center rounded-3xl border border-border bg-card p-10 shadow-lg">
          <p className="text-muted-foreground mb-4">{t("adminAccessDenied")}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t("adminBackHome")}
          </Link>
        </div>
      </div>
    );
  }

  async function handleDeleteUser(u: AuthUser) {
    if (
      !window.confirm(
        language === "ar"
          ? `حذف المستخدم ${u.email}؟`
          : `Delete user ${u.email}?`,
      )
    ) {
      return;
    }
    try {
      setSubmitting(true);
      await usersService.deleteUser(u.id);
      if (user?.id === u.id) {
        logout();
        navigate("/login");
        return;
      }
      refresh();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteCrop(c: ApiCropCard) {
    if (!window.confirm(language === "ar" ? "حذف المحصول؟" : "Delete crop?")) {
      return;
    }
    try {
      setSubmitting(true);
      await cropsService.deleteCrop(c.apiId);
      emitApiCropsChanged();
      refresh();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCropImageFile(file: File | null) {
    setCropImageFile(file && file.type.startsWith("image/") ? file : null);
    if (!file || !file.type.startsWith("image/")) {
      setCropForm((f) => ({ ...f, imagePreview: "" }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r === "string") {
        setCropForm((f) => ({ ...f, imagePreview: r }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleAddCrop(e: FormEvent) {
    e.preventDefault();
    const f = cropForm;
    if (
      !f.nameEn.trim() ||
      !f.nameAr.trim() ||
      !f.plantingEn.trim() ||
      !f.plantingAr.trim() ||
      !f.growthEn.trim() ||
      !f.growthAr.trim() ||
      !f.difficultyEn.trim() ||
      !f.difficultyAr.trim()
    ) {
      alert(language === "ar" ? "يرجى ملء جميع الحقول." : "Fill all fields.");
      return;
    }
    if (!user?.id || user.id <= 0) {
      alert(language === "ar" ? "يرجى تسجيل الدخول." : "Please sign in.");
      return;
    }
    try {
      setSubmitting(true);
      await cropsService.createCrop({
        Season: f.season,
        Name: f.nameEn.trim(),
        NameArabic: f.nameAr.trim(),
        PlantingTimeEn: f.plantingEn.trim(),
        PlantingTimeAr: f.plantingAr.trim(),
        GrowthPeriodEn: f.growthEn.trim(),
        GrowthPeriodAr: f.growthAr.trim(),
        DifficultyEn: f.difficultyEn.trim(),
        DifficultyAr: f.difficultyAr.trim(),
        UserId: user.id,
        File: cropImageFile,
      });
      setCropForm({
        season: "spring",
        nameEn: "",
        nameAr: "",
        plantingEn: "",
        plantingAr: "",
        growthEn: "",
        growthAr: "",
        difficultyEn: "",
        difficultyAr: "",
        difficultyLevel: 2,
        imagePreview: "",
      });
      setCropImageFile(null);
      emitApiCropsChanged();
      refresh();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePost(id: number) {
    if (!window.confirm(t("deleteConfirm"))) return;
    try {
      setSubmitting(true);
      await postsService.deletePost(id);
      window.dispatchEvent(new Event(DRPLANT_POSTS_CHANGED));
      refresh();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  const selectedMessage =
    selectedMessageId != null
      ? (messages.find((m) => m.id === selectedMessageId) ?? null)
      : null;

  const messageStatusLabel = (s: ContactMessageStatus): string => {
    if (language === "ar") {
      const map: Record<ContactMessageStatus, string> = {
        unread: "غير مقروءة",
        read: "مقروءة",
        replied: "تم الرد",
      };
      return map[s];
    }
    const map: Record<ContactMessageStatus, string> = {
      unread: "Unread",
      read: "Read",
      replied: "Replied",
    };
    return map[s];
  };

  const messageSubjectLabel = (raw: string): string => {
    const key = (raw ?? "").trim().toLowerCase();
    const isAr = language === "ar";
    const map: Record<string, { ar: string; en: string }> = {
      support: { ar: "دعم تقني", en: "Technical Support" },
      general: { ar: "استفسار عام", en: "General Inquiry" },
      partnership: { ar: "شراكة", en: "Partnership" },
      feedback: { ar: "ملاحظات", en: "Feedback" },
    };
    const v = map[key];
    if (!v) return raw || "—";
    return isAr ? v.ar : v.en;
  };

  const filteredMessages = messages
    .filter((m) =>
      messageFilter === "all" ? true : m.status === messageFilter,
    )
    .filter((m) => {
      const q = messageQuery.trim().toLowerCase();
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q)
      );
    });

  async function handleSetMessageStatus(
    id: string,
    status: ContactMessageStatus,
  ) {
    try {
      setSubmitting(true);
      await contactMessagesService.markMessageStatus(id, status);
      refresh();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteMessage(id: string) {
    if (
      !window.confirm(language === "ar" ? "حذف الرسالة؟" : "Delete message?")
    ) {
      return;
    }
    try {
      setSubmitting(true);
      await contactMessagesService.removeContactMessage(id);
      refresh();
    } catch (e) {
      alert(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReply() {
    if (!selectedMessage) return;
    const text = replyDraft.trim();
    if (!text) {
      alert(language === "ar" ? "اكتب الرد أولاً." : "Write a reply first.");
      return;
    }
    try {
      setReplySending(true);
      setReplyNotice(null);
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_REPLY_TEMPLATE_ID,
        {
          name: selectedMessage.name,
          email: selectedMessage.email,
          subject: selectedMessage.subject,
          reply: text,
          message: selectedMessage.message,
        },
        {
          publicKey: EMAILJS_PUBLIC_KEY,
        },
      );

      await contactMessagesService.sendReplyToContactMessage({
        id: selectedMessage.id,
        replyText: text,
      });

      setReplyDraft("");
      setReplyNotice({
        type: "success",
        text: language === "ar" ? "تم إرسال الرد." : "Reply sent.",
      });
      refresh();
    } catch (e) {
      setReplyNotice({
        type: "error",
        text:
          language === "ar"
            ? `فشل إرسال الرد: ${getErrorMessage(e)}`
            : `Failed to send reply: ${getErrorMessage(e)}`,
      });
    } finally {
      setReplySending(false);
    }
  }

  const tabs: { id: AdminTab; label: string; icon: typeof Users }[] = [
    { id: "users", label: t("adminNavUsers"), icon: Users },
    { id: "crops", label: t("adminNavCrops"), icon: Sprout },
    { id: "posts", label: t("adminNavPosts"), icon: FileText },
    {
      id: "messages",
      label: language === "ar" ? "الرسائل" : "Messages",
      icon: Mail,
    },
  ];

  const seasonLabel = (s: SeasonTabId) => {
    const map: Record<SeasonTabId, string> = {
      spring: t("spring"),
      summer: t("summer"),
      autumn: t("autumn"),
      winter: t("winter"),
    };
    return map[s];
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="relative max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {t("adminBackHome")}
        </Link>

        <header className="mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-4">
            <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
            {t("adminDashboard")}
          </div>
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-2 sm:mb-3 break-words"
            style={{ fontFamily: headingFont }}
          >
            {t("adminDashboard")}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl">
            {t("adminDemoNote")}
          </p>
        </header>

        <div className="grid grid-cols-2 gap-2 mb-8 sm:flex sm:flex-wrap sm:gap-2">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex w-full items-center justify-center gap-2 px-3 py-2.5 sm:px-5 sm:w-auto rounded-full text-xs sm:text-sm font-semibold transition-all ${
                tab === id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                  : "bg-card border border-border text-foreground/80 hover:border-primary/40"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>

        {tab === "users" ? (
          <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
            <div
              className="h-1 w-full shrink-0 bg-linear-to-r from-primary via-emerald-500 to-lime-500 sm:h-1.5 md:h-2"
              aria-hidden
            />
            <div className="p-4 sm:p-6 md:p-8 min-w-0">
              <h2
                className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex flex-wrap items-center gap-2"
                style={{ fontFamily: headingFont }}
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                {t("adminUsersTitle")}
              </h2>
              {loadingUsers ? (
                <div className="flex justify-center py-12">
                  <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : apiUsers.length === 0 ? (
                <p className="text-muted-foreground">{t("adminNoUsers")}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:hidden">
                    {apiUsers.map((u) => (
                      <div
                        key={u.id}
                        className="rounded-xl border border-border bg-muted/15 p-4 space-y-3"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("email")}
                          </p>
                          <p className="text-sm font-semibold break-all">
                            {u.email}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            {t("name")}
                          </p>
                          <p className="text-sm text-foreground">
                            {[u.firstName, u.lastName]
                              .filter(Boolean)
                              .join(" ") || "—"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-border pt-3">
                          <div>
                            <p className="text-xs text-muted-foreground">ID</p>
                            <p className="text-xs tabular-nums font-mono text-foreground">
                              {u.id}
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => void handleDeleteUser(u)}
                            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 active:bg-destructive/20 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4 shrink-0" />
                            {t("adminDelete")}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="hidden md:block min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x rounded-xl border border-border">
                    <table className="w-full min-w-[36rem] border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold text-foreground whitespace-nowrap min-w-48">
                            {t("email")}
                          </th>
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold text-foreground min-w-36">
                            {t("name")}
                          </th>
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold text-foreground whitespace-nowrap">
                            ID
                          </th>
                          <th
                            className="px-3 py-3 sm:px-4 text-end align-middle font-semibold text-foreground w-24 sm:w-28"
                            aria-hidden
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {apiUsers.map((u) => (
                          <tr
                            key={u.id}
                            className="border-b border-border last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-3 py-3 sm:px-4 text-start align-middle font-medium break-words min-w-48 max-w-56 sm:max-w-none">
                              {u.email}
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground break-words min-w-36 max-w-56">
                              {[u.firstName, u.lastName]
                                .filter(Boolean)
                                .join(" ") || "—"}
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                              {u.id}
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-end align-middle whitespace-nowrap">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleDeleteUser(u)}
                                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 sm:px-3 text-destructive hover:bg-destructive/10 text-xs font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                {t("adminDelete")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {tab === "crops" ? (
          <div className="space-y-8">
            <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
              <div
                className="h-1 w-full shrink-0 bg-linear-to-r from-emerald-600 via-primary to-teal-500 sm:h-1.5 md:h-2"
                aria-hidden
              />
              <div className="p-4 sm:p-6 md:p-8">
                <h2
                  className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex flex-wrap items-center gap-2"
                  style={{ fontFamily: headingFont }}
                >
                  <Leaf className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                  {t("adminCropsTitle")}
                </h2>
                {loadingCrops ? (
                  <div className="flex justify-center py-12">
                    <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : apiCrops.length === 0 ? (
                  <p className="text-muted-foreground text-sm mb-6">
                    {language === "ar"
                      ? "لا توجد محاصيل على الخادم بعد."
                      : "No crops on the server yet."}
                  </p>
                ) : (
                  <div className="-mx-1 overflow-x-auto rounded-xl sm:mx-0 sm:rounded-2xl border border-border max-h-72 overflow-y-auto">
                    <table className="w-full min-w-[22rem] border-collapse text-sm">
                      <thead className="sticky top-0 z-[1] bg-muted/95 backdrop-blur">
                        <tr className="border-b border-border">
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold whitespace-nowrap">
                            {t("adminSelectSeason")}
                          </th>
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold min-w-[8rem]">
                            {language === "ar" ? "الاسم" : "Name"}
                          </th>
                          <th
                            className="px-3 py-3 sm:px-4 text-end align-middle font-semibold w-14"
                            aria-hidden
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {apiCrops.map((row) => (
                          <tr
                            key={row.apiId}
                            className="border-b border-border last:border-0"
                          >
                            <td className="px-3 py-2 sm:px-4 text-start align-middle text-muted-foreground whitespace-nowrap">
                              {seasonLabel(row.season)}
                            </td>
                            <td className="px-3 py-2 sm:px-4 text-start align-middle break-words">
                              {language === "ar" ? row.nameAr : row.nameEn}
                            </td>
                            <td className="px-3 py-2 sm:px-4 text-end align-middle whitespace-nowrap">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleDeleteCrop(row)}
                                className="text-destructive hover:bg-destructive/10 rounded-full p-2"
                                aria-label={t("adminDelete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-4 sm:p-6 md:p-8">
                <h3
                  className="text-base sm:text-lg font-semibold mb-4"
                  style={{ fontFamily: headingFont }}
                >
                  {t("adminAddCrop")}
                </h3>
                <form
                  onSubmit={(e) => void handleAddCrop(e)}
                  className="grid sm:grid-cols-2 gap-4"
                >
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-primary mb-1 block">
                      {t("adminSelectSeason")}
                    </label>
                    <select
                      value={cropForm.season}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          season: e.target.value as SeasonTabId,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    >
                      {SEASON_IDS.map((s) => (
                        <option key={s} value={s}>
                          {seasonLabel(s)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("firstName")} (EN)
                    </label>
                    <input
                      value={cropForm.nameEn}
                      onChange={(e) =>
                        setCropForm((f) => ({ ...f, nameEn: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                      placeholder="Tomato"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {language === "ar" ? "الاسم بالعربية" : "Name (Arabic)"}
                    </label>
                    <input
                      value={cropForm.nameAr}
                      onChange={(e) =>
                        setCropForm((f) => ({ ...f, nameAr: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("plantingTime")} (EN)
                    </label>
                    <input
                      value={cropForm.plantingEn}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          plantingEn: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("plantingTime")} (AR)
                    </label>
                    <input
                      value={cropForm.plantingAr}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          plantingAr: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("adminGrowthPeriod")} (EN)
                    </label>
                    <input
                      value={cropForm.growthEn}
                      onChange={(e) =>
                        setCropForm((f) => ({ ...f, growthEn: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("adminGrowthPeriod")} (AR)
                    </label>
                    <input
                      value={cropForm.growthAr}
                      onChange={(e) =>
                        setCropForm((f) => ({ ...f, growthAr: e.target.value }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("difficulty")} (EN)
                    </label>
                    <input
                      value={cropForm.difficultyEn}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          difficultyEn: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      {t("difficulty")} (AR)
                    </label>
                    <input
                      value={cropForm.difficultyAr}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          difficultyAr: e.target.value,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                      dir="rtl"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium mb-1 block">
                      {t("difficulty")} (1–3)
                    </label>
                    <select
                      value={cropForm.difficultyLevel}
                      onChange={(e) =>
                        setCropForm((f) => ({
                          ...f,
                          difficultyLevel: Number(e.target.value) as 1 | 2 | 3,
                        }))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3"
                    >
                      <option value={1}>{t("adminDifficultyEasy")}</option>
                      <option value={2}>{t("adminDifficultyMedium")}</option>
                      <option value={3}>{t("adminDifficultyHard")}</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-sm font-medium text-primary mb-1 block">
                      {t("adminCropImage")}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleCropImageFile(e.target.files?.[0] ?? null)
                      }
                      className="w-full text-sm text-muted-foreground file:me-4 file:rounded-full file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground"
                    />
                    {cropForm.imagePreview ? (
                      <img
                        src={cropForm.imagePreview}
                        alt=""
                        className="mt-3 h-32 w-full max-w-xs rounded-xl object-cover border border-border"
                      />
                    ) : null}
                  </div>
                  <div className="sm:col-span-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-60"
                    >
                      {submitting ? (
                        <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      ) : null}
                      {t("adminSaveCrop")}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        ) : null}

        {tab === "posts" ? (
          <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
            <div
              className="h-1 w-full shrink-0 bg-linear-to-r from-lime-500 via-primary to-emerald-600 sm:h-1.5 md:h-2"
              aria-hidden
            />
            <div className="p-4 sm:p-6 md:p-8 min-w-0">
              <h2
                className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex flex-wrap items-center gap-2"
                style={{ fontFamily: headingFont }}
              >
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                {t("adminPostsTitle")}
              </h2>
              {loadingPosts ? (
                <div className="flex justify-center py-12">
                  <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : posts.length === 0 ? (
                <p className="text-muted-foreground">{t("adminNoPosts")}</p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 md:hidden">
                    {posts.map((p) => {
                      const dateStr =
                        p.date instanceof Date
                          ? p.date.toLocaleDateString()
                          : new Date(p.date).toLocaleDateString();
                      return (
                        <div
                          key={p.id}
                          className="rounded-xl border border-border bg-muted/15 p-4 space-y-3"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {t("postTitle")}
                            </p>
                            <p className="text-sm font-semibold break-words">
                              {p.title}
                            </p>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {language === "ar" ? "الكاتب" : "Author"}
                              </p>
                              <p className="text-sm text-foreground break-words">
                                {p.author}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-xs font-medium text-muted-foreground">
                                {language === "ar" ? "التاريخ" : "Date"}
                              </p>
                              <p className="text-sm tabular-nums text-muted-foreground">
                                {dateStr}
                              </p>
                            </div>
                          </div>
                          <div className="flex justify-end border-t border-border pt-3">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void handleDeletePost(p.id)}
                              className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 active:bg-destructive/20 disabled:opacity-50"
                              aria-label={t("adminDelete")}
                            >
                              <Trash2 className="w-4 h-4 shrink-0" />
                              {t("adminDelete")}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="hidden md:block min-w-0 overflow-x-auto overscroll-x-contain touch-pan-x rounded-xl border border-border">
                    <table className="w-full min-w-160 border-collapse text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold min-w-44">
                            {t("postTitle")}
                          </th>
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold min-w-32">
                            {language === "ar" ? "الكاتب" : "Author"}
                          </th>
                          <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold whitespace-nowrap">
                            {language === "ar" ? "التاريخ" : "Date"}
                          </th>
                          <th
                            className="px-3 py-3 sm:px-4 text-end align-middle font-semibold w-12 sm:w-14"
                            aria-hidden
                          />
                        </tr>
                      </thead>
                      <tbody>
                        {posts.map((p) => (
                          <tr
                            key={p.id}
                            className="border-b border-border last:border-0 hover:bg-muted/20"
                          >
                            <td className="px-3 py-3 sm:px-4 text-start align-middle font-medium min-w-44 max-w-56 sm:max-w-xs">
                              <span
                                className="line-clamp-2 md:line-clamp-none md:whitespace-normal break-words"
                                title={p.title}
                              >
                                {p.title}
                              </span>
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground break-words min-w-32 max-w-48">
                              {p.author}
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                              {p.date instanceof Date
                                ? p.date.toLocaleDateString()
                                : new Date(p.date).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-3 sm:px-4 text-end align-middle whitespace-nowrap">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => void handleDeletePost(p.id)}
                                className="text-destructive hover:bg-destructive/10 rounded-full p-2 shrink-0"
                                aria-label={t("adminDelete")}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </section>
        ) : null}

        {tab === "messages" ? (
          <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
            <div
              className="h-1 w-full shrink-0 bg-linear-to-r from-primary via-emerald-500 to-lime-500 sm:h-1.5 md:h-2"
              aria-hidden
            />
            <div className="p-4 sm:p-6 md:p-8">
              <h2
                className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex flex-wrap items-center gap-2"
                style={{ fontFamily: headingFont }}
              >
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                {language === "ar" ? "رسائل التواصل" : "Contact Messages"}
              </h2>

              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-muted-foreground">
                  {language === "ar"
                    ? "لا توجد رسائل حتى الآن."
                    : "No messages yet."}
                </p>
              ) : (
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* List */}
                  <div className="lg:col-span-1">
                    <div className="rounded-2xl border border-border bg-muted/20 p-4">
                      <div className="flex flex-col gap-3">
                        <input
                          value={messageQuery}
                          onChange={(e) => setMessageQuery(e.target.value)}
                          placeholder={
                            language === "ar"
                              ? "ابحث بالاسم أو البريد أو العنوان..."
                              : "Search name, email, subject..."
                          }
                          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all text-sm"
                        />

                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              {
                                id: "all",
                                label: language === "ar" ? "الكل" : "All",
                              },
                              {
                                id: "unread",
                                label:
                                  language === "ar" ? "غير مقروءة" : "Unread",
                              },
                              {
                                id: "read",
                                label: language === "ar" ? "مقروءة" : "Read",
                              },
                              {
                                id: "replied",
                                label:
                                  language === "ar" ? "تم الرد" : "Replied",
                              },
                            ] as const
                          ).map((f) => (
                            <button
                              key={f.id}
                              type="button"
                              onClick={() => setMessageFilter(f.id)}
                              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                messageFilter === f.id
                                  ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                                  : "bg-card border border-border text-foreground/75 hover:border-primary/40"
                              }`}
                            >
                              {f.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-border overflow-hidden bg-card">
                      <div className="max-h-[520px] overflow-y-auto">
                        {filteredMessages.length === 0 ? (
                          <p className="p-4 text-sm text-muted-foreground">
                            {language === "ar"
                              ? "لا توجد نتائج."
                              : "No results."}
                          </p>
                        ) : (
                          <ul className="divide-y divide-border">
                            {filteredMessages.map((m) => {
                              const isSelected = m.id === selectedMessageId;
                              const badge =
                                m.status === "unread"
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-200"
                                  : m.status === "replied"
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200"
                                    : "bg-muted text-foreground/70";
                              return (
                                <li key={m.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedMessageId(m.id);
                                      const lastAdmin =
                                        (m.replies ?? [])
                                          .filter(
                                            (r) => r.senderType === "admin",
                                          )
                                          .slice(-1)[0] ?? null;
                                      setReplyDraft(lastAdmin?.content ?? "");
                                      if (m.status === "unread") {
                                        void handleSetMessageStatus(
                                          m.id,
                                          "read",
                                        );
                                      }
                                    }}
                                    className={`w-full text-start p-4 hover:bg-muted/30 transition-colors ${
                                      isSelected ? "bg-muted/40" : ""
                                    }`}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                          {messageSubjectLabel(m.subject)}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                          {m.name} • {m.email}
                                        </p>
                                      </div>
                                      <span
                                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}
                                      >
                                        {messageStatusLabel(m.status)}
                                      </span>
                                    </div>
                                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                                      {m.message}
                                    </p>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details / Reply */}
                  <div className="lg:col-span-2">
                    <div className="rounded-2xl border border-border bg-card p-6">
                      {selectedMessage ? (
                        <div className="space-y-5">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-xs text-muted-foreground">
                                {language === "ar" ? "المرسل" : "Sender"}
                              </p>
                              <p
                                className="text-lg font-bold truncate"
                                style={{ fontFamily: headingFont }}
                              >
                                {selectedMessage.name}
                              </p>
                              <a
                                href={`mailto:${selectedMessage.email}`}
                                className="text-sm text-primary hover:underline break-all"
                              >
                                {selectedMessage.email}
                              </a>
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(
                                selectedMessage.createdAt,
                              ).toLocaleString()}
                            </div>
                          </div>

                          <div className="rounded-xl border border-border bg-muted/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {language === "ar" ? "الموضوع" : "Subject"}
                            </p>
                            <p className="mt-1 font-semibold">
                              {messageSubjectLabel(selectedMessage.subject)}
                            </p>
                            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {language === "ar" ? "الرسالة" : "Message"}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                              {selectedMessage.message}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-border bg-card p-4">
                            <p className="text-sm font-semibold mb-3">
                              {language === "ar" ? "المحادثة" : "Conversation"}
                            </p>
                            <div className="space-y-3">
                              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                                <div className="flex items-center justify-between gap-3">
                                  <p className="text-xs font-semibold text-foreground/80">
                                    {selectedMessage.name}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                                    {new Date(
                                      selectedMessage.createdAt,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                                  {selectedMessage.message}
                                </p>
                              </div>

                              {(selectedMessage.replies ?? []).map((r) => {
                                const isAdmin = r.senderType === "admin";
                                return (
                                  <div
                                    key={r.id}
                                    className={
                                      isAdmin
                                        ? "rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20"
                                        : "rounded-2xl border border-border bg-muted/20 p-4"
                                    }
                                  >
                                    <div className="flex items-center justify-between gap-3">
                                      <p className="text-xs font-semibold text-foreground/80">
                                        {isAdmin
                                          ? language === "ar"
                                            ? "دعم Dr Plant"
                                            : "Dr Plant Support"
                                          : r.senderName}
                                      </p>
                                      <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                                        {new Date(r.createdAt).toLocaleString()}
                                      </p>
                                    </div>
                                    <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                                      {r.content}
                                    </p>
                                  </div>
                                );
                              })}

                              <div className="rounded-2xl border border-dashed border-border bg-muted/10 p-4">
                                <p className="text-xs text-muted-foreground">
                                  {language === "ar"
                                    ? "سيتم عرض ردود المستخدم هنا لاحقًا عند ربط النظام بواجهة خلفية/Webhook لمزوّد البريد."
                                    : "User replies will appear here later once connected to a backend/webhook from the email provider."}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                void handleSetMessageStatus(
                                  selectedMessage.id,
                                  selectedMessage.status === "unread"
                                    ? "read"
                                    : "unread",
                                )
                              }
                              className="px-4 py-2 rounded-full text-sm font-semibold border border-border bg-card hover:border-primary/40 transition-colors"
                            >
                              {selectedMessage.status === "unread"
                                ? language === "ar"
                                  ? "تعليم كمقروءة"
                                  : "Mark as read"
                                : language === "ar"
                                  ? "تعليم كغير مقروءة"
                                  : "Mark as unread"}
                            </button>
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() =>
                                void handleDeleteMessage(selectedMessage.id)
                              }
                              className="px-4 py-2 rounded-full text-sm font-semibold text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors"
                            >
                              {language === "ar" ? "حذف" : "Delete"}
                            </button>
                          </div>

                          <div className="pt-2">
                            <p className="text-sm font-semibold mb-2">
                              {language === "ar" ? "الرد" : "Reply"}
                            </p>
                            <textarea
                              value={replyDraft}
                              onChange={(e) => setReplyDraft(e.target.value)}
                              rows={5}
                              className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none text-sm"
                              placeholder={
                                language === "ar"
                                  ? "اكتب الرد هنا..."
                                  : "Type your reply..."
                              }
                            />
                            <div className="mt-3 flex flex-wrap items-center gap-3">
                              <button
                                type="button"
                                disabled={replySending}
                                onClick={() => void handleReply()}
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 disabled:opacity-60"
                              >
                                {replySending ? (
                                  <span className="size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                ) : null}
                                {replySending
                                  ? language === "ar"
                                    ? "جارٍ الإرسال..."
                                    : "Sending..."
                                  : language === "ar"
                                    ? "إرسال الرد"
                                    : "Send reply"}
                              </button>
                              {replyNotice ? (
                                <span
                                  className={
                                    replyNotice.type === "success"
                                      ? "text-xs font-medium text-emerald-600 dark:text-emerald-400"
                                      : "text-xs font-medium text-destructive"
                                  }
                                >
                                  {replyNotice.text}
                                </span>
                              ) : null}
                              {selectedMessage.status === "replied" &&
                              selectedMessage.repliedAt ? (
                                <span className="text-xs text-muted-foreground">
                                  {language === "ar"
                                    ? `تم الرد: ${new Date(selectedMessage.repliedAt).toLocaleString()}`
                                    : `Replied: ${new Date(selectedMessage.repliedAt).toLocaleString()}`}
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-10 text-center">
                          <p className="text-sm text-muted-foreground">
                            {language === "ar"
                              ? "اختر رسالة لعرض التفاصيل."
                              : "Select a message to view details."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
