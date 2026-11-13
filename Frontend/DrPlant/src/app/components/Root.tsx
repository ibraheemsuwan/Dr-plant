import { Outlet } from "react-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { UserProvider } from "../contexts/UserContext";
import { RouteMotionProvider } from "../contexts/RouteMotionContext";
import { Navbar } from "./Navbar";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { ScrollToTopOnNavigate } from "./ScrollToTopOnNavigate";
import { ApiAuthListener } from "./ApiAuthListener";
import { SmoothScroll } from "./SmoothScroll";

export function Root() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <RouteMotionProvider>
            <ApiAuthListener />
            <SmoothScroll />
            <div className="dr-motion min-h-screen bg-background text-foreground">
              <ScrollToTopOnNavigate />
              <Navbar />
              <Outlet />
              <ScrollToTopButton />
            </div>
          </RouteMotionProvider>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
