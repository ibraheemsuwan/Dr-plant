import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, Loader2, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser, DRPLANT_AUTH_CHANGED_EVENT } from "../contexts/UserContext";
import {
  fetchNotifications,
  fetchUnreadCount,
  getNotificationDisplayMessage,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "../api/services/notificationsService";
import { formatPalestineDateTime } from "../lib/dateTime";
import { playNotificationSound } from "../lib/notificationSound";

const POLL_MS = 8_000;

function formatTypeLabel(type: string, language: "ar" | "en"): string {
  const key = type.trim().toLowerCase();
  const labels: Record<string, { ar: string; en: string }> = {
    like: { ar: "إعجاب", en: "Like" },
    comment: { ar: "تعليق", en: "Comment" },
    reply: { ar: "رد", en: "Reply" },
    post: { ar: "منشور", en: "Post" },
    message: { ar: "رسالة", en: "Message" },
    system: { ar: "نظام", en: "System" },
  };
  const hit = labels[key];
  if (hit) return language === "ar" ? hit.ar : hit.en;
  return type.trim() || (language === "ar" ? "إشعار" : "Notification");
}

function newestUnread(items: AppNotification[]): AppNotification | null {
  return items.find((n) => !n.isRead) ?? items[0] ?? null;
}

export function NotificationsBell() {
  const { language, t } = useLanguage();
  const { isLoggedIn } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<AppNotification | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const pollReadyRef = useRef(false);
  const lastUnreadRef = useRef(0);
  const lastTopIdRef = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  const showToast = useCallback((n: AppNotification) => {
    setToast(n);
    window.setTimeout(() => {
      setToast((current) =>
        current?.notificationId === n.notificationId ? null : current,
      );
    }, 6_000);
  }, []);

  const applyIncoming = useCallback(
    (list: AppNotification[], count: number) => {
    const topId = list[0]?.notificationId ?? 0;
    const hadBaseline = pollReadyRef.current;
    const unreadIncreased = hadBaseline && count > lastUnreadRef.current;
    const newerItem = hadBaseline && topId > 0 && topId > lastTopIdRef.current;

    setItems(list);
    setUnreadCount(count);
    lastUnreadRef.current = count;
    lastTopIdRef.current = topId;

    if (!hadBaseline) {
      pollReadyRef.current = true;
      return;
    }

    if (unreadIncreased || newerItem) {
      const latest = newestUnread(list);
      if (latest) {
        playNotificationSound();
        showToast(latest);
      }
    }
  },
    [showToast],
  );

  const pollNotifications = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!isLoggedIn) {
        pollReadyRef.current = false;
        lastUnreadRef.current = 0;
        lastTopIdRef.current = 0;
        setUnreadCount(0);
        setItems([]);
        return;
      }

      try {
        const [list, count] = await Promise.all([
          fetchNotifications(),
          fetchUnreadCount(),
        ]);
        applyIncoming(list, count);
      } catch {
        if (!opts?.silent && openRef.current) {
          setError(
            language === "ar"
              ? "تعذر تحميل الإشعارات."
              : "Could not load notifications.",
          );
        }
      }
    },
    [applyIncoming, isLoggedIn, language],
  );

  const loadList = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingList(true);
    setError(null);
    try {
      const [list, count] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setItems(list);
      setUnreadCount(count);
      lastUnreadRef.current = count;
      lastTopIdRef.current = list[0]?.notificationId ?? 0;
      pollReadyRef.current = true;
    } catch {
      setError(
        language === "ar"
          ? "تعذر تحميل الإشعارات."
          : "Could not load notifications.",
      );
    } finally {
      setLoadingList(false);
    }
  }, [isLoggedIn, language]);

  useEffect(() => {
    if (!isLoggedIn) {
      pollReadyRef.current = false;
      lastUnreadRef.current = 0;
      lastTopIdRef.current = 0;
      setUnreadCount(0);
      setItems([]);
      setToast(null);
      return;
    }

    pollReadyRef.current = false;
    void pollNotifications();

    const intervalId = window.setInterval(
      () => void pollNotifications({ silent: true }),
      POLL_MS,
    );

    const onAuth = () => {
      pollReadyRef.current = false;
      void pollNotifications();
    };
    const onFocus = () => void pollNotifications({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pollNotifications({ silent: true });
      }
    };

    window.addEventListener(DRPLANT_AUTH_CHANGED_EVENT, onAuth);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener(DRPLANT_AUTH_CHANGED_EVENT, onAuth);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [isLoggedIn, pollNotifications]);

  useEffect(() => {
    if (!open) return;
    void loadList();
  }, [open, loadList]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!isLoggedIn) return null;

  async function handleMarkAll() {
    setMarkingAll(true);
    setError(null);
    try {
      await markAllNotificationsRead();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      lastUnreadRef.current = 0;
      setToast(null);
    } catch {
      setError(
        language === "ar"
          ? "تعذر تعليم الكل كمقروء."
          : "Could not mark all as read.",
      );
    } finally {
      setMarkingAll(false);
    }
  }

  async function handleItemClick(n: AppNotification) {
    setError(null);
    setToast(null);

    if (!n.isRead) {
      try {
        await markNotificationRead(n.notificationId);
        setItems((prev) =>
          prev.map((item) =>
            item.notificationId === n.notificationId
              ? { ...item, isRead: true }
              : item,
          ),
        );
        setUnreadCount((c) => {
          const next = Math.max(0, c - 1);
          lastUnreadRef.current = next;
          return next;
        });
      } catch {
        setError(
          language === "ar"
            ? "تعذر تحديث الإشعار."
            : "Could not update notification.",
        );
        return;
      }
    }

    setOpen(false);

    if (n.postId && n.postId > 0) {
      navigate(`/blog?post=${n.postId}`);
    }
  }

  const badge =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <>
      {toast ? (
        <button
          type="button"
          onClick={() => void handleItemClick(toast)}
          className="fixed z-[250] top-[4.75rem] start-3 end-3 sm:start-auto sm:end-6 sm:max-w-sm rounded-2xl border border-primary/30 bg-card shadow-xl shadow-primary/15 p-4 text-start hover:bg-accent/30 transition-colors"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Bell className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-primary mb-0.5">
                {formatTypeLabel(toast.type, language)}
              </p>
              <p className="text-sm font-medium text-foreground leading-snug">
                {getNotificationDisplayMessage(toast, language)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {language === "ar" ? "اضغط للعرض" : "Tap to view"}
              </p>
            </div>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setToast(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  e.stopPropagation();
                  setToast(null);
                }
              }}
              className="shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground"
              aria-label={t("close")}
            >
              <X className="size-4" />
            </span>
          </div>
        </button>
      ) : null}

      <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-full hover:bg-accent transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("notifications")}
      >
        <Bell className="w-5 h-5 text-foreground/70" />
        {badge ? (
          <span className="absolute -top-0.5 end-0.5 min-w-[1.125rem] h-[1.125rem] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none shadow-sm ring-2 ring-card animate-pulse">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed top-16 inset-x-0 bottom-0 z-[40] bg-black/25 lg:hidden"
            aria-label={t("close")}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed z-[60] top-[4.25rem] start-3 end-3 w-auto max-h-[min(85dvh,32rem)] rounded-2xl border border-border bg-card shadow-xl shadow-primary/10 overflow-hidden flex flex-col lg:absolute lg:z-[200] lg:top-[calc(100%+1rem)] lg:end-0 lg:start-auto lg:w-[min(100vw-2rem,22rem)] lg:max-w-[22rem] lg:max-h-[min(70vh,24rem)]"
            role="dialog"
            aria-label={t("notifications")}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 px-3 py-2.5 sm:px-4 sm:py-3 border-b border-border bg-muted/30 shrink-0">
              <h3 className="text-sm font-semibold text-foreground">
                {t("notifications")}
              </h3>
              <button
                type="button"
                disabled={markingAll || unreadCount === 0}
                onClick={() => void handleMarkAll()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-40 disabled:pointer-events-none transition-colors shrink-0"
              >
                {markingAll ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5" />
                )}
                {t("markAllNotificationsRead")}
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {loadingList ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : error ? (
                <p className="px-4 py-6 text-sm text-destructive text-center">
                  {error}
                </p>
              ) : items.length === 0 ? (
                <p className="px-4 py-10 text-sm text-muted-foreground text-center">
                  {t("noNotifications")}
                </p>
              ) : (
                <ul className="p-1.5 space-y-1">
                  {items.map((n) => {
                    const hasPost = Boolean(n.postId && n.postId > 0);
                    return (
                      <li key={n.notificationId}>
                        <button
                          type="button"
                          onClick={() => void handleItemClick(n)}
                          className={`w-full text-start rounded-xl px-3 py-2.5 transition-colors border ${
                            n.isRead
                              ? "border-transparent bg-transparent opacity-75 hover:bg-accent/50"
                              : "border-primary/20 bg-primary/10 hover:bg-primary/15 shadow-sm"
                          } ${hasPost ? "cursor-pointer" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                n.isRead
                                  ? "bg-muted text-muted-foreground"
                                  : "bg-primary/15 text-primary"
                              }`}
                            >
                              {formatTypeLabel(n.type, language)}
                            </span>
                            {!n.isRead ? (
                              <span
                                className="shrink-0 size-2 rounded-full bg-primary mt-1"
                                aria-hidden
                              />
                            ) : null}
                          </div>
                          <p
                            className={`text-sm leading-snug ${
                              n.isRead
                                ? "text-muted-foreground font-normal"
                                : "text-foreground font-medium"
                            }`}
                          >
                            {getNotificationDisplayMessage(n, language)}
                          </p>
                          <p className="mt-1.5 text-[11px] text-muted-foreground">
                            {formatPalestineDateTime(n.createdAt, language)}
                          </p>
                          {hasPost ? (
                            <p className="mt-1 text-[10px] font-medium text-primary/80">
                              {language === "ar"
                                ? "عرض المنشور ←"
                                : "View post →"}
                            </p>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : null}
      </div>
    </>
  );
}
