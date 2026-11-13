import { Link, useLocation, useNavigate } from "react-router";
import {
  Moon,
  Sun,
  Menu,
  X,
  Globe,
  UserCircle,
  Settings,
  LogOut,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { useState, useRef, useEffect } from "react";
import { NotificationsBell } from "./NotificationsBell";

function UserAccountMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { t, language } = useLanguage();
  const { user, logout, isAdmin } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  if (!user) return null;

  const display =
    [user.firstName, user.lastName].filter(Boolean).join(" ").trim() ||
    user.email.split("@")[0] ||
    user.email;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 p-1.5 ps-2 pe-3 rounded-full border border-border hover:bg-accent transition-colors"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={language === "ar" ? "حسابي" : "My account"}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-primary">
          <UserCircle className="w-5 h-5" />
        </span>
        <span className="hidden sm:inline max-w-[120px] truncate text-sm font-medium text-foreground">
          {display}
        </span>
      </button>

      {open ? (
        <div
          className="absolute end-0 top-[calc(100%+1rem)] w-60 rounded-2xl border border-border bg-card shadow-xl shadow-primary/10 z-[200] overflow-hidden"
          role="menu"
        >
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
            <p className="text-sm font-semibold truncate">{display}</p>
          </div>
          <div className="p-1.5">
            {isAdmin ? (
              <Link
                to="/admin"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-primary shrink-0" />
                {t("adminDashboard")}
              </Link>
            ) : null}
            <Link
              to="/settings"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-accent transition-colors"
            >
              <Settings className="w-4 h-4 text-primary shrink-0" />
              {t("settings")}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                logout();
                setOpen(false);
                onNavigate?.();
                navigate("/");
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors text-start"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {t("logOut")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { isLoggedIn, logout, isAdmin } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: t("home") },
    { path: "/scan", label: t("scan") },
    { path: "/weather", label: t("weather") },
    { path: "/seasonal-crops", label: t("seasonalCrops") },
    { path: "/blog", label: t("blog") },
    { path: "/contact", label: t("contact") },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img
              src="/logo.jpg"
              alt=""
              className="h-11 w-auto max-h-11 shrink-0 object-contain object-left"
              decoding="async"
            />
            <span
              className="text-2xl font-bold tracking-tight"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Dr Plant
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`px-4 py-2 rounded-lg text-sm transition-colors relative ${
                  location.pathname === item.path
                    ? "text-primary font-semibold"
                    : "text-foreground/70 hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
                {location.pathname === item.path && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-foreground/70" />
              ) : (
                <Sun className="w-5 h-5 text-foreground/70" />
              )}
            </button>

            <NotificationsBell />

            <button
              onClick={toggleLanguage}
              className="p-2 rounded-full hover:bg-accent transition-colors inline-flex items-center gap-0.5"
              aria-label="Toggle language"
            >
              <Globe className="w-5 h-5 text-foreground/70" />
              <span
                dir={language === "ar" ? "rtl" : "ltr"}
                className="inline-flex items-center whitespace-nowrap text-[11px] font-semibold leading-none text-foreground/80"
              >
                {language === "ar" ? "ع" : "EN"}
              </span>
            </button>

            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-1">
                {isAdmin ? (
                  <Link
                    to="/admin"
                    className="p-2 rounded-full hover:bg-accent transition-colors text-primary"
                    aria-label={t("adminDashboard")}
                    title={t("adminDashboard")}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                  </Link>
                ) : null}
                <UserAccountMenu />
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-1.5 text-sm border border-border rounded-full hover:bg-accent transition-colors text-foreground/80"
                >
                  {t("login")}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-1.5 text-sm rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity shadow-sm"
                >
                  {language === "ar" ? "تسجيل" : "Register"}
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-border space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-accent text-foreground/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-2 flex flex-col gap-2 px-4 border-t border-border mt-2">
              {isLoggedIn ? (
                <>
                  {isAdmin ? (
                    <Link
                      to="/admin"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-2 py-3 px-4 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary" />
                      {t("adminDashboard")}
                    </Link>
                  ) : null}
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-2 py-3 px-4 rounded-xl border border-border hover:bg-accent transition-colors text-sm font-medium"
                  >
                    <Settings className="w-4 h-4 text-primary" />
                    {t("settings")}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      logout();
                      navigate("/");
                    }}
                    className="py-3 px-4 rounded-xl text-destructive bg-destructive/10 hover:bg-destructive/15 transition-colors text-sm font-medium text-start w-full"
                  >
                    {t("logOut")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-3 text-center border border-border rounded-xl hover:bg-accent transition-colors text-sm"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="py-3 text-center rounded-xl bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity text-sm"
                  >
                    {language === "ar" ? "تسجيل" : "Register"}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
