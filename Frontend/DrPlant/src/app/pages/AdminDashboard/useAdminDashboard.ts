import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router";
import emailjs from "@emailjs/browser";
import { getErrorMessage } from "../../api/errors";
import { mapApiCropDto, type ApiCropCard } from "../../api/cropsMap";
import {
  DRPLANT_API_CROPS_CHANGED,
  DRPLANT_POSTS_CHANGED,
  emitApiCropsChanged,
  emitPostsChanged,
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
import { emailJsConfig } from "../../../config/emailjs";
import type { SeasonTabId } from "../../data/seasonalCropsData";
import type { BlogPost } from "../../lib/blogTypes";
import { formatPalestineDateTime } from "../../lib/dateTime";
import { showAppAlert, showAppConfirm } from "../../lib/sweetAlert";
import { useLanguage } from "../../contexts/LanguageContext";
import { useUser } from "../../contexts/UserContext";
import type { AdminTab } from "./constants";
import { INITIAL_CROP_FORM, type CropFormState } from "./cropForm";

export function useAdminDashboard() {
  const { t, language } = useLanguage();
  const { user, isLoggedIn, logout } = useUser();
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
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [messageQuery, setMessageQuery] = useState("");
  const [usersSearch, setUsersSearch] = useState("");
  const [cropsSearch, setCropsSearch] = useState("");
  const [postsSearch, setPostsSearch] = useState("");
  const [messageFilter, setMessageFilter] = useState<
    "all" | ContactMessageStatus
  >("all");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );
  const [loadingSelectedMessage, setLoadingSelectedMessage] = useState(false);
  const [replyDraft, setReplyDraft] = useState("");
  const [replyDraftByMessageId, setReplyDraftByMessageId] = useState<
    Record<string, string>
  >({});
  const [replySending, setReplySending] = useState(false);
  const [replyNotice, setReplyNotice] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [cropForm, setCropForm] = useState<CropFormState>(INITIAL_CROP_FORM);
  const [cropImageFile, setCropImageFile] = useState<File | null>(null);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      setApiUsers(await usersService.listUsersForAdminDashboard());
    } catch {
      setApiUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [user?.email, user?.role]);

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
    setMessagesError(null);
    try {
      const rows = await contactMessagesService.getContactMessages();
      setMessages(rows);
      if (selectedMessageId && !rows.some((m) => m.id === selectedMessageId)) {
        setSelectedMessageId(null);
        setSelectedMessage(null);
        setReplyDraft("");
        setReplyDraftByMessageId((prev) => {
          const next = { ...prev };
          delete next[selectedMessageId];
          return next;
        });
      }
    } catch (e) {
      setMessages([]);
      setSelectedMessage(null);
      setMessagesError(
        language === "ar"
          ? `فشل جلب الرسائل: ${getErrorMessage(e)}`
          : `Failed to load messages: ${getErrorMessage(e)}`,
      );
    } finally {
      setLoadingMessages(false);
    }
  }, [language, selectedMessageId]);

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

  const handleDeleteUser = useCallback(
    async (u: AuthUser) => {
      const confirmed = await showAppConfirm({
        language,
        title: language === "ar" ? "حذف المستخدم؟" : "Delete user?",
        text:
          language === "ar"
            ? `سيتم حذف المستخدم ${u.email}.`
            : `User ${u.email} will be deleted.`,
        confirmText: language === "ar" ? "حذف" : "Delete",
      });
      if (!confirmed) return;
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
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل العملية" : "Operation failed",
          text: getErrorMessage(e),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [language, user?.id, logout, navigate, refresh],
  );

  const handleDeleteCrop = useCallback(
    async (c: ApiCropCard) => {
      const confirmed = await showAppConfirm({
        language,
        title: language === "ar" ? "حذف المحصول؟" : "Delete crop?",
        text:
          language === "ar"
            ? `سيتم حذف «${c.nameAr || c.nameEn}» وجميع معلومات الرعاية المرتبطة به.`
            : `«${c.nameEn}» and its care details will be removed.`,
        confirmText: language === "ar" ? "حذف" : "Delete",
      });
      if (!confirmed) return;
      try {
        setSubmitting(true);
        await cropsService.deleteCropDetailsByCropId(c.apiId);
        await cropsService.deleteCrop(c.apiId);
        emitApiCropsChanged();
        refresh();
        await showAppAlert({
          language,
          kind: "success",
          title: language === "ar" ? "تم الحذف" : "Deleted",
          text:
            language === "ar"
              ? "تم حذف المحصول بنجاح."
              : "The crop was deleted successfully.",
        });
      } catch (e) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل الحذف" : "Delete failed",
          text: getErrorMessage(e),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [language, refresh],
  );

  const handleCropImageFile = useCallback((file: File | null) => {
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
  }, []);

  const handleAddCrop = useCallback(
    async (e: FormEvent) => {
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
        !f.difficultyAr.trim() ||
        !f.plantingMethodEn.trim() ||
        !f.plantingMethodAr.trim() ||
        !f.wateringPlanEn.trim() ||
        !f.wateringPlanAr.trim() ||
        !f.sunlightNeedsEn.trim() ||
        !f.sunlightNeedsAr.trim() ||
        !f.soilAndFertilizingEn.trim() ||
        !f.soilAndFertilizingAr.trim() ||
        !f.avoidMistakesEn.trim() ||
        !f.avoidMistakesAr.trim()
      ) {
        await showAppAlert({
          language,
          kind: "warning",
          title: language === "ar" ? "حقول ناقصة" : "Missing fields",
          text:
            language === "ar" ? "يرجى ملء جميع الحقول." : "Fill all fields.",
        });
        return;
      }
      if (!user?.id || user.id <= 0) {
        await showAppAlert({
          language,
          kind: "warning",
          title: language === "ar" ? "تسجيل الدخول مطلوب" : "Sign in required",
          text: language === "ar" ? "يرجى تسجيل الدخول." : "Please sign in.",
        });
        return;
      }
      try {
        setSubmitting(true);
        const created = await cropsService.createCrop({
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
        let cropId = NaN;
        if (created && typeof created === "object") {
          const row = created as Record<string, unknown>;
          const candidate = row.CropId ?? row.cropId ?? row.Id ?? row.id;
          if (typeof candidate === "number" && Number.isFinite(candidate)) {
            cropId = candidate;
          } else if (typeof candidate === "string" && candidate.trim() !== "") {
            const parsed = Number(candidate);
            if (Number.isFinite(parsed)) cropId = parsed;
          }
        }
        if (!Number.isFinite(cropId)) {
          const fresh = await cropsService.listCropsRaw();
          for (const row of fresh) {
            const name = String(row.Name ?? row.name ?? "").trim();
            const nameArabic = String(
              row.NameArabic ?? row.nameArabic ?? "",
            ).trim();
            const idRaw = row.CropId ?? row.cropId ?? row.Id ?? row.id;
            if (name !== f.nameEn.trim() || nameArabic !== f.nameAr.trim())
              continue;
            if (typeof idRaw === "number" && Number.isFinite(idRaw)) {
              cropId = idRaw;
              break;
            }
            if (typeof idRaw === "string" && idRaw.trim() !== "") {
              const parsed = Number(idRaw);
              if (Number.isFinite(parsed)) {
                cropId = parsed;
                break;
              }
            }
          }
        }
        if (!Number.isFinite(cropId)) {
          throw new Error(
            language === "ar"
              ? "تم إنشاء المحصول ولكن لم يتم العثور على معرفه لحفظ التفاصيل."
              : "Crop was created but its ID was not found to save details.",
          );
        }
        await cropsService.createCropDetails({
          CropId: cropId,
          PlantingMethodEn: f.plantingMethodEn.trim(),
          PlantingMethodAr: f.plantingMethodAr.trim(),
          WateringPlanEn: f.wateringPlanEn.trim(),
          WateringPlanAr: f.wateringPlanAr.trim(),
          SunlightEn: f.sunlightNeedsEn.trim(),
          SunlightAr: f.sunlightNeedsAr.trim(),
          SoilAndFertilizingEn: f.soilAndFertilizingEn.trim(),
          SoilAndFertilizingAr: f.soilAndFertilizingAr.trim(),
          AvoidMistakesEn: f.avoidMistakesEn.trim(),
          AvoidMistakesAr: f.avoidMistakesAr.trim(),
        });
        setCropForm(INITIAL_CROP_FORM);
        setCropImageFile(null);
        emitApiCropsChanged();
        refresh();
        await showAppAlert({
          language,
          kind: "success",
          title: language === "ar" ? "تم الحفظ" : "Saved",
          text:
            language === "ar"
              ? "تمت إضافة المحصول ومعلومات الرعاية بنجاح."
              : "Crop and care details were added successfully.",
        });
      } catch (err) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل الحفظ" : "Save failed",
          text: getErrorMessage(err),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [cropForm, cropImageFile, language, refresh, user?.id],
  );

  const handleDeletePost = useCallback(
    async (id: number) => {
      const confirmed = await showAppConfirm({
        language,
        title: language === "ar" ? "حذف المنشور؟" : "Delete post?",
        text: t("deleteConfirm"),
        confirmText: language === "ar" ? "حذف" : "Delete",
      });
      if (!confirmed) return;
      try {
        setSubmitting(true);
        await postsService.deletePost(id);
        emitPostsChanged();
        refresh();
      } catch (e) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل الحذف" : "Delete failed",
          text: getErrorMessage(e),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [language, refresh, t],
  );

  const handleDeleteMessage = useCallback(
    async (id: string) => {
      const confirmed = await showAppConfirm({
        language,
        title: language === "ar" ? "حذف الرسالة؟" : "Delete message?",
        text:
          language === "ar"
            ? "سيتم حذف رسالة التواصل نهائيًا."
            : "This contact message will be deleted permanently.",
        confirmText: language === "ar" ? "حذف" : "Delete",
      });
      if (!confirmed) return;
      try {
        setSubmitting(true);
        const removed = await contactMessagesService.removeContactMessage(id);
        if (removed) {
          setMessages((prev) => prev.filter((m) => m.id !== id));
          setReplyDraftByMessageId((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          if (selectedMessageId === id) {
            setSelectedMessageId(null);
            setSelectedMessage(null);
            setReplyDraft("");
          }
        } else {
          refresh();
        }
      } catch (e) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل الحذف" : "Delete failed",
          text: getErrorMessage(e),
        });
      } finally {
        setSubmitting(false);
      }
    },
    [language, refresh, selectedMessageId],
  );

  const handleReply = useCallback(async () => {
    if (!selectedMessage) return;
    if (!selectedMessage.id) {
      setReplyNotice({ type: "error", text: "Message id is missing" });
      return;
    }
    if (!selectedMessage.email?.trim()) {
      setReplyNotice({
        type: "error",
        text: "User email is missing, cannot send reply.",
      });
      return;
    }
    const text = replyDraft.trim();
    if (!text) {
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "مطلوب إدخال" : "Input required",
        text: language === "ar" ? "اكتب الرد أولاً." : "Write a reply first.",
      });
      return;
    }
    try {
      setReplySending(true);
      setReplyNotice(null);
      const repliedAt = new Date().toISOString();
      await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.replyTemplateId,
        {
          name: selectedMessage.name,
          email: selectedMessage.email,
          reply: text,
          message: selectedMessage.message,
          subject: selectedMessage.subject,
        },
        emailJsConfig.publicKey,
      );

      await contactMessagesService.sendReplyToContactMessage({
        id: selectedMessage.id,
        replyText: text,
      });

      const nextSelected: ContactMessage = {
        ...selectedMessage,
        adminReply: text,
        status: "Replied",
        repliedAt,
      };
      setSelectedMessage(nextSelected);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === selectedMessage.id
            ? { ...m, adminReply: text, status: "Replied", repliedAt }
            : m,
        ),
      );

      setReplyDraft("");
      setReplyDraftByMessageId((prev) => {
        const next = { ...prev };
        delete next[selectedMessage.id];
        return next;
      });
      setReplyNotice({
        type: "success",
        text: language === "ar" ? "تم إرسال الرد." : "Reply sent.",
      });
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
  }, [language, replyDraft, selectedMessage]);

  const handleSelectMessage = useCallback(
    async (id: string) => {
      setSelectedMessageId(id);
      const savedDraft = replyDraftByMessageId[id];
      setReplyDraft(savedDraft ?? "");
      setReplyNotice(null);
      setLoadingSelectedMessage(true);
      try {
        const details = await contactMessagesService.getContactMessage(id);
        if (!details) {
          setSelectedMessage(null);
          return;
        }
        setSelectedMessage(details);
        setMessages((prev) =>
          prev.map((m) => (m.id === details.id ? details : m)),
        );
      } catch (e) {
        setSelectedMessage(null);
        setReplyNotice({
          type: "error",
          text:
            language === "ar"
              ? `فشل جلب الرسالة: ${getErrorMessage(e)}`
              : `Failed to load message: ${getErrorMessage(e)}`,
        });
      } finally {
        setLoadingSelectedMessage(false);
      }
    },
    [language, replyDraftByMessageId],
  );

  const formatDateTime = useCallback(
    (value: string | null | undefined) =>
      formatPalestineDateTime(value, language),
    [language],
  );

  const filteredMessages = useMemo(
    () =>
      messages
        .filter((m) =>
          messageFilter === "all" ? true : m.status === messageFilter,
        )
        .filter((m) => {
          const q = messageQuery.trim().toLowerCase();
          if (!q) return true;
          return (
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            m.subject.toLowerCase().includes(q) ||
            m.message.toLowerCase().includes(q)
          );
        }),
    [messages, messageFilter, messageQuery],
  );

  const filteredAdminUsers = useMemo(() => {
    const q = usersSearch.trim().toLowerCase();
    if (!q) return apiUsers;
    return apiUsers.filter((u) => {
      const name = [u.firstName, u.lastName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return (
        u.email.toLowerCase().includes(q) ||
        name.includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [apiUsers, usersSearch]);

  const filteredAdminCrops = useMemo(() => {
    const raw = cropsSearch.trim();
    if (!raw) return apiCrops;
    const q = raw.toLowerCase();
    const seasonMap: Record<SeasonTabId, string> = {
      spring: t("spring"),
      summer: t("summer"),
      autumn: t("autumn"),
      winter: t("winter"),
    };
    return apiCrops.filter((c) => {
      const season = (seasonMap[c.season] ?? "").toLowerCase();
      return (
        season.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.nameAr.includes(raw)
      );
    });
  }, [apiCrops, cropsSearch, t]);

  const filteredAdminPosts = useMemo(() => {
    const q = postsSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => {
      const title = (p.title ?? "").toLowerCase();
      const author = (p.author ?? "").toLowerCase();
      const excerpt = (p.excerpt ?? "").toLowerCase();
      const category = (p.category ?? "General").toLowerCase();
      return (
        title.includes(q) ||
        author.includes(q) ||
        excerpt.includes(q) ||
        category.includes(q)
      );
    });
  }, [posts, postsSearch]);

  const seasonLabel = useCallback(
    (s: SeasonTabId) => {
      const map: Record<SeasonTabId, string> = {
        spring: t("spring"),
        summer: t("summer"),
        autumn: t("autumn"),
        winter: t("winter"),
      };
      return map[s];
    },
    [t],
  );

  const isAdmin = user?.role === "admin";

  return {
    t,
    language,
    isLoggedIn,
    isAdmin,
    tab,
    setTab,
    apiUsers,
    loadingUsers,
    usersSearch,
    setUsersSearch,
    filteredAdminUsers,
    handleDeleteUser,
    apiCrops,
    loadingCrops,
    cropsSearch,
    setCropsSearch,
    filteredAdminCrops,
    cropForm,
    setCropForm,
    handleCropImageFile,
    handleAddCrop,
    handleDeleteCrop,
    seasonLabel,
    posts,
    loadingPosts,
    postsSearch,
    setPostsSearch,
    filteredAdminPosts,
    handleDeletePost,
    messages,
    messagesError,
    loadingMessages,
    messageQuery,
    setMessageQuery,
    messageFilter,
    setMessageFilter,
    filteredMessages,
    selectedMessageId,
    selectedMessage,
    loadingSelectedMessage,
    replyDraft,
    setReplyDraft,
    setReplyDraftByMessageId,
    replySending,
    replyNotice,
    handleSelectMessage,
    handleDeleteMessage,
    handleReply,
    formatDateTime,
    submitting,
  };
}
