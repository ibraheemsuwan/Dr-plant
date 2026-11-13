import { useEffect } from "react";
import { useLocation } from "react-router";

/** Scrolls to top when navigating to another page (pathname / search). Hash-only changes are ignored so in-page anchors still work. */
export function ScrollToTopOnNavigate() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname, search]);

  return null;
}
