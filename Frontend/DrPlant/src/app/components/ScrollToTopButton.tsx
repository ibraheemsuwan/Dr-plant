import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { cn } from "./ui/utils";

const SHOW_AFTER_PX = 320;

export function ScrollToTopButton() {
  const { language } = useLanguage();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }}
      className={cn(
        "fixed bottom-6 end-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none",
      )}
      aria-label={
        language === "ar" ? "العودة لأعلى الصفحة" : "Back to top of page"
      }
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
    >
      <ChevronUp className="h-6 w-6" strokeWidth={2.5} />
    </button>
  );
}
