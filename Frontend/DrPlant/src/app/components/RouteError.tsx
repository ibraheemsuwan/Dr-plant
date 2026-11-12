import { useEffect } from "react";
import { useRouteError } from "react-router";

/**
 * Last-resort screen when a page crashes while rendering. It stands alone on purpose (no language/theme providers),
 * because the crash may have happened inside them. The language follows the browser.
 */
export function RouteError() {
  const error = useRouteError();
  const isAr = typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("ar");

  useEffect(() => {
    console.error("Page crashed:", error);
  }, [error]);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
      <h1 className="text-2xl font-semibold">{isAr ? "حدث خطأ غير متوقع" : "Something went wrong"}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {isAr
          ? "تعذّر عرض هذه الصفحة. جرّب إعادة التحميل، وإن استمرت المشكلة فتواصل معنا."
          : "This page could not be shown. Try reloading, and contact us if it keeps happening."}
      </p>
      <div className="mt-8 flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          {isAr ? "إعادة التحميل" : "Reload"}
        </button>
        <a href="/" className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:border-primary hover:text-primary">
          {isAr ? "الصفحة الرئيسية" : "Home"}
        </a>
      </div>
    </div>
  );
}
