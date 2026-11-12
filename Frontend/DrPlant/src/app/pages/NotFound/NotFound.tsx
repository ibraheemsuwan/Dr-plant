import { Link } from "react-router";
import { Home, Leaf } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

/** Shown for any address that does not exist (the navigation bar stays, since this renders inside the site layout). */
export function NotFound() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
        <Leaf className="h-9 w-9 text-primary" />
      </div>
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold">{isAr ? "هذه الصفحة غير موجودة" : "This page doesn't exist"}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {isAr
          ? "ربما تغيّر الرابط أو كُتب بشكل خاطئ. يمكنك العودة للرئيسية أو فحص نبتتك."
          : "The link may have changed or been typed wrongly. Go back home, or scan a plant."}
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          {isAr ? "الصفحة الرئيسية" : "Home"}
        </Link>
        <Link to="/scan" className="rounded-full border border-border px-6 py-3 font-medium transition-colors hover:border-primary hover:text-primary">
          {isAr ? "فحص نبتة" : "Scan a plant"}
        </Link>
      </div>
    </div>
  );
}
