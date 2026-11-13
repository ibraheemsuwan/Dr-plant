import type { Dispatch, SetStateAction } from "react";
import { Mail } from "lucide-react";
import type {
  ContactMessage,
  ContactMessageStatus,
} from "../../api/services/contactMessagesService";
import { AdminPanelSearch } from "./AdminPanelSearch";
import { ADMIN_HEADING_FONT } from "./constants";
import {
  messageStatusLabel,
  messageSubjectLabel,
} from "./messageLabels";

type AdminMessagesTabProps = {
  language: "ar" | "en";
  messageQuery: string;
  setMessageQuery: (v: string) => void;
  messagesError: string | null;
  loadingMessages: boolean;
  messages: ContactMessage[];
  messageFilter: "all" | ContactMessageStatus;
  setMessageFilter: (v: "all" | ContactMessageStatus) => void;
  filteredMessages: ContactMessage[];
  selectedMessageId: string | null;
  selectedMessage: ContactMessage | null;
  loadingSelectedMessage: boolean;
  replyDraft: string;
  setReplyDraft: (v: string) => void;
  setReplyDraftByMessageId: Dispatch<
    SetStateAction<Record<string, string>>
  >;
  replySending: boolean;
  replyNotice: { type: "success" | "error"; text: string } | null;
  submitting: boolean;
  onSelectMessage: (id: string) => void;
  onDeleteMessage: (id: string) => void;
  onReply: () => void;
  formatDateTime: (value: string | null | undefined) => string;
};

export function AdminMessagesTab({
  language,
  messageQuery,
  setMessageQuery,
  messagesError,
  loadingMessages,
  messages,
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
  submitting,
  onSelectMessage,
  onDeleteMessage,
  onReply,
  formatDateTime,
}: AdminMessagesTabProps) {
  return (
    <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
      <div
        className="h-1 w-full shrink-0 bg-linear-to-r from-primary via-emerald-500 to-lime-500 sm:h-1.5 md:h-2"
        aria-hidden
      />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <h2
            className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 min-w-0"
            style={{ fontFamily: ADMIN_HEADING_FONT }}
          >
            <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            {language === "ar" ? "رسائل التواصل" : "Contact Messages"}
          </h2>
          <AdminPanelSearch
            language={language}
            value={messageQuery}
            onChange={setMessageQuery}
            placeholderEn="Search name, email, subject…"
            placeholderAr="ابحث بالاسم أو البريد أو العنوان…"
            ariaLabelEn="Search messages"
            ariaLabelAr="بحث في الرسائل"
          />
        </div>
        {messagesError ? (
          <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {messagesError}
          </div>
        ) : null}

        {loadingMessages ? (
          <div className="flex justify-center py-12">
            <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-muted-foreground">
            {language === "ar" ? "لا توجد رسائل حتى الآن." : "No messages yet."}
          </p>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        {
                          id: "all",
                          label: language === "ar" ? "الكل" : "All",
                        },
                        {
                          id: "Unread",
                          label: language === "ar" ? "غير مقروءة" : "Unread",
                        },
                        {
                          id: "Read",
                          label: language === "ar" ? "مقروءة" : "Read",
                        },
                        {
                          id: "Replied",
                          label: language === "ar" ? "تم الرد" : "Replied",
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
                      {language === "ar" ? "لا توجد نتائج." : "No results."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {filteredMessages.map((m) => {
                        const isSelected = m.id === selectedMessageId;
                        const badge =
                          m.status === "Unread"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/25 dark:text-amber-200"
                            : m.status === "Replied"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200"
                              : "bg-muted text-foreground/70";
                        return (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => {
                                void onSelectMessage(m.id);
                              }}
                              className={`w-full text-start p-4 hover:bg-muted/30 transition-colors ${
                                isSelected ? "bg-muted/40" : ""
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm truncate">
                                    {messageSubjectLabel(m.subject, language)}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {m.name} • {m.email}
                                  </p>
                                </div>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge}`}
                                >
                                  {messageStatusLabel(m.status, language)}
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

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                {loadingSelectedMessage ? (
                  <div className="flex justify-center py-10">
                    <span className="size-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : selectedMessage ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">
                          {language === "ar" ? "المرسل" : "Sender"}
                        </p>
                        <p
                          className="text-lg font-bold truncate"
                          style={{ fontFamily: ADMIN_HEADING_FONT }}
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
                        {formatDateTime(selectedMessage.createdAt)}
                      </div>
                    </div>

                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {language === "ar" ? "الموضوع" : "Subject"}
                      </p>
                      <p className="mt-1 font-semibold">
                        {messageSubjectLabel(
                          selectedMessage.subject,
                          language,
                        )}
                      </p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {language === "ar" ? "الرسالة" : "Message"}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">
                        {selectedMessage.message}
                      </p>
                    </div>

                    {selectedMessage.adminReply ? (
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-xs font-semibold text-foreground/80">
                            {language === "ar"
                              ? "دعم Dr Plant"
                              : "Dr Plant Support"}
                          </p>
                          <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                            {formatDateTime(selectedMessage.repliedAt) || "—"}
                          </p>
                        </div>
                        <p className="mt-2 text-sm whitespace-pre-wrap leading-relaxed">
                          {selectedMessage.adminReply}
                        </p>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() =>
                          void onDeleteMessage(selectedMessage.id)
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
                        onChange={(e) => {
                          const nextDraft = e.target.value;
                          setReplyDraft(nextDraft);
                          if (selectedMessage) {
                            setReplyDraftByMessageId((prev) => ({
                              ...prev,
                              [selectedMessage.id]: nextDraft,
                            }));
                          }
                        }}
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
                          onClick={() => void onReply()}
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
                        {selectedMessage.status === "Replied" &&
                        selectedMessage.repliedAt ? (
                          <span className="text-xs text-muted-foreground">
                            {language === "ar"
                              ? `تم الرد: ${formatDateTime(selectedMessage.repliedAt)}`
                              : `Replied: ${formatDateTime(selectedMessage.repliedAt)}`}
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
  );
}
