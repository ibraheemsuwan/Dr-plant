import { useState, useEffect, type FormEvent } from "react";
import { Link, Navigate } from "react-router";
import {
  Mail,
  User,
  Save,
  ArrowLeft,
  Shield,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { Reveal } from "./animations/Reveal";

export function Settings() {
  const { t, language } = useLanguage();
  const { user, isLoggedIn, updateProfile, updatePassword, authLoading } =
    useUser();
  const [saved, setSaved] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({
    firstName: user?.firstName ?? "",
    lastName: user?.lastName ?? "",
    email: user?.email ?? "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      newPassword: "",
      confirmPassword: "",
    });
  }, [user]);

  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.id <= 0) {
    return <Navigate to="/login" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const np = form.newPassword.trim();
    const cp = form.confirmPassword.trim();
    if (np || cp) {
      if (!np || !cp) {
        alert(t("fillBothPasswordFields"));
        return;
      }
      if (np !== cp) {
        alert(t("passwordsDoNotMatch"));
        return;
      }
    }

    const pr = await updateProfile({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
    });
    if (!pr.ok) {
      alert(pr.error);
      return;
    }

    let changedPw = false;
    if (np && cp && np === cp) {
      const pw = await updatePassword(np);
      if (!pw.ok) {
        alert(pw.error);
        return;
      }
      changedPw = true;
      setForm((f) => ({ ...f, newPassword: "", confirmPassword: "" }));
    }

    setSaved(true);
    setPasswordSaved(changedPw);
    window.setTimeout(() => {
      setSaved(false);
      setPasswordSaved(false);
    }, 3000);
  }

  const headingFont = "'Playfair Display', 'Noto Kufi Arabic', serif";

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute top-1/3 -end-24 h-72 w-72 rounded-full bg-emerald-400/6 blur-[110px]" />
        <div className="absolute -bottom-24 start-[18%] h-80 w-80 rounded-full bg-primary/6 blur-[130px]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background opacity-85" />
      </div>

      <Reveal>
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          {language === "ar" ? "الرئيسية" : "Back to home"}
        </Link>

        <header className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Shield className="w-3.5 h-3.5" />
            {t("accountSettings")}
          </div>
          <h1
            className="text-4xl sm:text-5xl font-bold text-foreground mb-3"
            style={{ fontFamily: headingFont }}
          >
            {t("settings")}
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl">
            {language === "ar"
              ? "تحديث الملف الشخصي عبر الخادم."
              : "Update your profile on the server."}
          </p>
        </header>

        <div className="grid gap-8">
          <section className="rounded-3xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="h-2 bg-linear-to-r from-primary via-emerald-500 to-lime-500" />
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-primary to-emerald-700 flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/25">
                  <img
                    src="/logo2.jpg"
                    alt=""
                    className="h-14 w-14 object-contain"
                    decoding="async"
                  />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "مرحباً" : "Signed in as"}
                  </p>
                  <p className="text-xl font-semibold" style={{ fontFamily: headingFont }}>
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") ||
                      user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <User className="w-4 h-4 text-primary" />
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firstName: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <User className="w-4 h-4 text-primary" />
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, lastName: e.target.value }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Mail className="w-4 h-4 text-primary" />
                    {t("email")}
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {t("passwordChangeHint")}
                  </p>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      {t("newPassword")}
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? "text" : "password"}
                        value={form.newPassword}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, newPassword: e.target.value }))
                        }
                        autoComplete="new-password"
                        placeholder="••••••••"
                        className="w-full px-4 py-3 pe-12 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPw ? "Hide" : "Show"}
                      >
                        {showPw ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium mb-2">
                      <Lock className="w-4 h-4 text-primary" />
                      {t("confirmPassword")}
                    </label>
                    <input
                      type={showPw ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {saved ? (
                  <p className="text-sm font-medium text-primary">
                    {t("profileSaved")}
                  </p>
                ) : null}
                {passwordSaved ? (
                  <p className="text-sm font-medium text-primary">
                    {t("passwordUpdated")}
                  </p>
                ) : null}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/25 disabled:opacity-60 disabled:pointer-events-none"
                >
                  {authLoading ? (
                    <span className="inline-block size-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {t("saveChanges")}
                </button>
              </form>
            </div>
          </section>

          <p className="text-center text-sm text-muted-foreground px-4">
            {language === "ar"
              ? "يتم مزامنة التغييرات مع حسابك على الخادم."
              : "Changes are synced with your account on the server."}
          </p>
        </div>
      </div>
      </Reveal>
    </div>
  );
}
