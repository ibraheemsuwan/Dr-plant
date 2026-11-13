import { Trash2, Users } from "lucide-react";
import type { AuthUser } from "../../api/types";
import { ADMIN_HEADING_FONT } from "./constants";
import { AdminPanelSearch } from "./AdminPanelSearch";

type AdminUsersTabProps = {
  language: "ar" | "en";
  t: (key: string) => string;
  usersSearch: string;
  setUsersSearch: (v: string) => void;
  loadingUsers: boolean;
  apiUsers: AuthUser[];
  filteredAdminUsers: AuthUser[];
  submitting: boolean;
  onDeleteUser: (u: AuthUser) => void;
};

export function AdminUsersTab({
  language,
  t,
  usersSearch,
  setUsersSearch,
  loadingUsers,
  apiUsers,
  filteredAdminUsers,
  submitting,
  onDeleteUser,
}: AdminUsersTabProps) {
  return (
    <section className="overflow-hidden rounded-2xl sm:rounded-3xl border border-border bg-card shadow-sm">
      <div
        className="h-1 w-full shrink-0 bg-linear-to-r from-primary via-emerald-500 to-lime-500 sm:h-1.5 md:h-2"
        aria-hidden
      />
      <div className="p-4 sm:p-6 md:p-8 min-w-0">
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 min-w-0">
          <h2
            className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 min-w-0"
            style={{ fontFamily: ADMIN_HEADING_FONT }}
          >
            <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
            {t("adminUsersTitle")}
          </h2>
          <AdminPanelSearch
            language={language}
            value={usersSearch}
            onChange={setUsersSearch}
            placeholderEn="Search email, name, ID…"
            placeholderAr="ابحث بالبريد أو الاسم أو الرقم…"
            ariaLabelEn="Search users"
            ariaLabelAr="بحث في المستخدمين"
          />
        </div>
        {loadingUsers ? (
          <div className="flex justify-center py-12">
            <span className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : apiUsers.length === 0 ? (
          <p className="text-muted-foreground">{t("adminNoUsers")}</p>
        ) : filteredAdminUsers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            {language === "ar"
              ? "لا توجد نتائج مطابقة للبحث."
              : "No results match your search."}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 md:hidden">
              {filteredAdminUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-xl border border-border bg-muted/15 p-4 space-y-3"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("email")}
                    </p>
                    <p className="text-sm font-semibold break-all">{u.email}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("name")}
                    </p>
                    <p className="text-sm text-foreground">
                      {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                        "—"}
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
                      onClick={() => void onDeleteUser(u)}
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
                  {filteredAdminUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-3 py-3 sm:px-4 text-start align-middle font-medium break-words min-w-48 max-w-56 sm:max-w-none">
                        {u.email}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground break-words min-w-36 max-w-56">
                        {[u.firstName, u.lastName].filter(Boolean).join(" ") ||
                          "—"}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-start align-middle text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                        {u.id}
                      </td>
                      <td className="px-3 py-3 sm:px-4 text-end align-middle whitespace-nowrap">
                        <button
                          type="button"
                          disabled={submitting}
                          onClick={() => void onDeleteUser(u)}
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
  );
}
