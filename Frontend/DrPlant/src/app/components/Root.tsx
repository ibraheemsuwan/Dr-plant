import { Outlet, useLocation } from "react-router";
import { ThemeProvider } from "../contexts/ThemeContext";
import { LanguageProvider } from "../contexts/LanguageContext";
import { UserProvider } from "../contexts/UserContext";
import { Navbar } from "./Navbar";
import { ScrollToTopButton } from "./ScrollToTopButton";
import { ScrollToTopOnNavigate } from "./ScrollToTopOnNavigate";
import { ApiAuthListener } from "./ApiAuthListener";

function RootOutlet() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="animate-dr-page-in">
      <Outlet />
    </div>
  );
}

export function Root() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <UserProvider>
          <ApiAuthListener />
          <div className="min-h-screen bg-background text-foreground">
            <ScrollToTopOnNavigate />
            <Navbar />
            <RootOutlet />
            <ScrollToTopButton />
          </div>
        </UserProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
