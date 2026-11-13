import { Search } from "lucide-react";

type AdminPanelSearchProps = {
  language: "ar" | "en";
  value: string;
  onChange: (next: string) => void;
  placeholderEn: string;
  placeholderAr: string;
  ariaLabelEn: string;
  ariaLabelAr: string;
};

export function AdminPanelSearch({
  language,
  value,
  onChange,
  placeholderEn,
  placeholderAr,
  ariaLabelEn,
  ariaLabelAr,
}: AdminPanelSearchProps) {
  const ph = language === "ar" ? placeholderAr : placeholderEn;
  const aria = language === "ar" ? ariaLabelAr : ariaLabelEn;

  return (
    <div className="relative w-full min-w-0 sm:max-w-[200px] md:max-w-[240px] lg:max-w-xs sm:ms-auto sm:flex-shrink-0">
      <Search
        className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={ph}
        aria-label={aria}
        className="w-full rounded-full border border-border/80 bg-muted/30 py-2 ps-9 pe-3 text-sm text-foreground shadow-sm placeholder:text-muted-foreground outline-none transition-[border-color,box-shadow] focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10"
      />
    </div>
  );
}
