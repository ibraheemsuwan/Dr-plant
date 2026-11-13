import { FileText, Trash2 } from "lucide-react";
import type { BlogPost } from "../../lib/blogTypes";
import { formatPalestineDate } from "../../lib/dateTime";
import { AdminPanelSearch } from "./AdminPanelSearch";
import { ADMIN_HEADING_FONT } from "./constants";

type AdminPostsTabProps = {
  language: "ar" | "en";
  t: (key: string) => string;
  postsSearch: string;
  setPostsSearch: (v: string) => void;
  loadingPosts: boolean;
  posts: BlogPost[];
  filteredAdminPosts: BlogPost[];
  submitting: boolean;
  onDeletePost: (id: number) => void;
};

export function AdminPostsTab({
  language,
  t,
  postsSearch,
  setPostsSearch,
  loadingPosts,
  posts,
  filteredAdminPosts,
  submitting,
  onDeletePost,
}: AdminPostsTabProps) {
  return (
    <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
      <div
        className="h-1 w-full shrink-0 bg-linear-to-r from-lime-500 via-primary to-emerald-600 sm:h-1.5 md:h-2"
        aria-hidden
      />
      <div className="p-4 sm:p-6 md:p-8 min-w-0">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <h2
            className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 min-w-0"
            style={{ fontFamily: ADMIN_HEADING_FONT }}
          >
            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            {t("adminPostsTitle")}
          </h2>
          <AdminPanelSearch
            language={language}
            value={postsSearch}
            onChange={setPostsSearch}
            placeholderEn="Search title, author, category…"
            placeholderAr="ابحث بالعنوان أو الكاتب أو الفئة…"
            ariaLabelEn="Search posts"
            ariaLabelAr="بحث في المقالات"
          />
        </div>
        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <p className="text-muted-foreground">{t("adminNoPosts")}</p>
        ) : filteredAdminPosts.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {language === "ar"
              ? "لا توجد نتائج مطابقة للبحث."
              : "No results match your search."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {filteredAdminPosts.map((p) => {
                const dateStr = formatPalestineDate(p.date, language);
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
                          {language === "ar" ? "الفئة" : "Category"}
                        </p>
                        <p className="text-sm text-foreground break-words">
                          {p.category || "General"}
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
                        onClick={() => void onDeletePost(p.id)}
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
                    <th className="px-3 py-3 sm:px-4 text-start align-middle font-semibold min-w-32">
                      {language === "ar" ? "الفئة" : "Category"}
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
                  {filteredAdminPosts.map((p) => (
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
                      <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground break-words min-w-32 max-w-48">
                        {p.category || "General"}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                        {formatPalestineDate(p.date, language)}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-end align-middle whitespace-nowrap">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void onDeletePost(p.id)}
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
  );
}
