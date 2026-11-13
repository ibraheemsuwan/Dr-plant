import { useState, type ChangeEvent, type FormEvent } from "react";
import { Lock, Mail, Eye, EyeOff, ArrowRight, X } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Reveal } from "./animations/Reveal";
import * as authService from "../api/services/authService";
import * as usersService from "../api/services/usersService";
import { getErrorMessage } from "../api/errors";
import { showAppAlert } from "../lib/sweetAlert";

export function Login() {
  const { t, language } = useLanguage();
  const { login, register, isLoggedIn, authLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showForgotForm, setShowForgotForm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [forgotData, setForgotData] = useState({
    email: "",
    oldPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "عدم تطابق" : "Mismatch",
        text: t("passwordsDoNotMatch"),
      });
      return;
    }
    if (isLogin) {
      const r = await login(formData.email, formData.password);
      if (!r.ok) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل تسجيل الدخول" : "Login failed",
          text: r.error || t("invalidLogin"),
        });
        return;
      }
    } else {
      const r = await register({
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
      });
      if (!r.ok) {
        await showAppAlert({
          language,
          kind: "error",
          title: language === "ar" ? "فشل إنشاء الحساب" : "Signup failed",
          text: r.error || t("invalidLogin"),
        });
        return;
      }
    }
    navigate(isLogin ? "/" : "/login");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleForgotPassword = async () => {
    const email = forgotData.email.trim();
    const oldPassword = forgotData.oldPassword.trim();
    const newPassword = forgotData.newPassword.trim();
    const confirmNewPassword = forgotData.confirmNewPassword.trim();
    if (!email || !oldPassword || !newPassword || !confirmNewPassword) {
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "حقول ناقصة" : "Missing fields",
        text:
          language === "ar"
            ? "يرجى إدخال الإيميل وكلمة السر القديمة والجديدة والتأكيد."
            : "Please provide email, old password, new password, and confirmation.",
      });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      await showAppAlert({
        language,
        kind: "error",
        title: language === "ar" ? "عدم تطابق" : "Mismatch",
        text: t("passwordsDoNotMatch"),
      });
      return;
    }
    if (oldPassword === newPassword) {
      await showAppAlert({
        language,
        kind: "warning",
        title: language === "ar" ? "غير مسموح" : "Not allowed",
        text:
          language === "ar"
            ? "غير مسموح استخدام نفس الباسورد الحالي كباسورد جديد."
            : "You cannot use the current password as the new password.",
      });
      return;
    }
    setForgotLoading(true);
    try {
      const verify = await authService.verifyLoginCredentials({
        email,
        password: oldPassword,
      });
      await usersService.changePasswordWithToken(
        { oldPassword, newPassword },
        verify.token,
      );
      setForgotData({
        email: "",
        oldPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setShowForgotForm(false);
      await showAppAlert({
        language,
        kind: "success",
        title: language === "ar" ? "تم التحديث" : "Updated",
        text:
          language === "ar"
            ? "تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن."
            : "Password changed successfully. You can now log in.",
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      const lower = msg.toLowerCase();
      const isOldWrong =
        lower.includes("invalid") ||
        lower.includes("incorrect") ||
        lower.includes("unauthorized") ||
        lower.includes("wrong password");
      await showAppAlert({
        language,
        kind: "error",
        title:
          language === "ar" ? "تعذر تغيير كلمة المرور" : "Password not changed",
        text: isOldWrong
          ? language === "ar"
            ? "كلمة السر القديمة غير صحيحة."
            : "Old password is incorrect."
          : msg,
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 inset-s-[12%] h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -inset-e-24 h-72 w-72 rounded-full bg-emerald-400/8 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_62%)]" />
      </div>
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-primary to-emerald-800 relative z-10 overflow-hidden items-center justify-center p-12">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 inset-s-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-20 inset-e-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute top-1/2 inset-s-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <img
              src="/logo2.jpg"
              alt=""
              className="h-18 w-17 object-contain"
              decoding="async"
            />
          </div>
          <h2
            className="text-4xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Dr Plant
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-sm">
            {language === "ar"
              ? "منصتك الزراعية الذكية للعناية بالنباتات وتشخيص الأمراض باستخدام الذكاء الاصطناعي"
              : "Your smart agricultural platform for plant care and disease diagnosis using AI"}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              {
                num: "3+",
                label: language === "ar" ? "أدوات" : "Tools",
              },
              { num: "96%", label: language === "ar" ? "دقة" : "Accuracy" },
              { num: "50K+", label: language === "ar" ? "مستخدم" : "Users" },
            ].map((stat) => (
              <div
                key={stat.num}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4"
              >
                <p
                  className="text-2xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {stat.num}
                </p>
                <p className="text-white/70 text-xs">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-8 bg-background">
        <Reveal variant="pop">
          <div className={`w-full ${isLogin ? "max-w-xl" : "max-w-md"}`}>
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-primary/35 dark:bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <img
                  src="/logo2.jpg"
                  alt=""
                  className="h-11 w-11 object-contain"
                  decoding="async"
                />
              </div>
              <span
                className="text-2xl font-bold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Dr Plant
              </span>
            </div>

            {/* Tab Toggle */}
            <div
              className={`flex bg-muted rounded-full ${isLogin ? "p-1.5 mb-10" : "p-1 mb-8"}`}
            >
              <Link
                to="/login"
                className={`flex-1 rounded-full font-medium transition-all text-center ${
                  isLogin ? "py-3 text-base" : "py-2.5 text-sm"
                } ${
                  isLogin
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className={`flex-1 rounded-full font-medium transition-all text-center ${
                  isLogin ? "py-3 text-base" : "py-2.5 text-sm"
                } ${
                  !isLogin
                    ? "bg-card shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("signUp")}
              </Link>
            </div>

            <div className={isLogin ? "mb-10" : "mb-8"}>
              <h1
                className={
                  isLogin
                    ? "text-4xl font-bold mb-3"
                    : "text-3xl font-bold mb-2"
                }
                style={{
                  fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                }}
              >
                {isLogin
                  ? language === "ar"
                    ? "مرحباً بعودتك 👋"
                    : "Welcome Back 👋"
                  : language === "ar"
                    ? "إنشاء حساب جديد"
                    : "Create New Account"}
              </h1>
              <p
                className={
                  isLogin
                    ? "text-muted-foreground text-lg"
                    : "text-muted-foreground"
                }
              >
                {isLogin
                  ? language === "ar"
                    ? "سجل الدخول للوصول إلى حسابك"
                    : "Sign in to access your account"
                  : language === "ar"
                    ? "أنشئ حسابك مجاناً اليوم"
                    : "Create your free account today"}
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className={isLogin ? "space-y-6" : "space-y-5"}
            >
              {!isLogin && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      {t("firstName")}
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={
                        language === "ar" ? "الاسم الأول" : "First name"
                      }
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium">
                      {t("lastName")}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={
                        language === "ar" ? "اسم العائلة" : "Last name"
                      }
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm font-medium">
                  {t("email")}
                </label>
                <div className="relative">
                  <Mail className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className={`w-full bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      isLogin ? "px-5 py-3.5 ps-12 text-lg" : "px-4 py-3 ps-11"
                    }`}
                    placeholder="example@email.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label
                    className={
                      isLogin ? "text-base font-medium" : "text-sm font-medium"
                    }
                  >
                    {t("password")}
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotForm((open) => {
                          const next = !open;
                          if (next) {
                            setForgotData((f) => ({
                              ...f,
                              email: f.email.trim() || formData.email.trim(),
                            }));
                          }
                          return next;
                        });
                      }}
                      className={
                        isLogin
                          ? "text-primary text-base hover:underline"
                          : "text-primary text-sm hover:underline"
                      }
                    >
                      {t("forgotPassword")}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className={`w-full pe-12 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all ${
                      isLogin ? "px-5 py-3.5 ps-12 text-lg" : "px-4 py-3 ps-11"
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-e-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div>
                  <label className="block mb-2 text-sm font-medium">
                    {t("confirmPassword")}
                  </label>
                  <div className="relative">
                    <Lock className="absolute inset-s-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required={!isLogin}
                      className="w-full px-4 py-3 ps-11 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="••••••••"
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div
                  className={
                    isLogin
                      ? "flex items-center gap-2.5"
                      : "flex items-center gap-2"
                  }
                >
                  <input
                    type="checkbox"
                    id="remember"
                    className="w-4 h-4 accent-primary"
                  />
                  <label
                    htmlFor="remember"
                    className={
                      isLogin
                        ? "text-base text-muted-foreground cursor-pointer"
                        : "text-sm text-muted-foreground cursor-pointer"
                    }
                  >
                    {language === "ar" ? "تذكرني" : "Remember me"}
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className={`w-full bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:pointer-events-none ${
                  isLogin ? "py-4.5 text-xl" : "py-4"
                }`}
              >
                {authLoading ? (
                  <span className="inline-block size-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : null}
                {isLogin ? t("login") : t("signUp")}
                {!authLoading ? <ArrowRight className="w-4 h-4" /> : null}
              </button>
            </form>

            <p
              className={
                isLogin
                  ? "text-center text-lg text-muted-foreground mt-7"
                  : "text-center text-sm text-muted-foreground mt-6"
              }
            >
              {isLogin
                ? t("dontHaveAccount")
                : language === "ar"
                  ? "لديك حساب بالفعل؟"
                  : "Already have an account?"}{" "}
              <Link
                to={isLogin ? "/register" : "/login"}
                className="text-primary font-semibold hover:underline"
              >
                {isLogin ? t("signUp") : t("login")}
              </Link>
            </p>
          </div>
        </Reveal>
      </div>
      {isLogin && showForgotForm ? (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label={
            language === "ar" ? "استعادة كلمة المرور" : "Reset password"
          }
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setShowForgotForm(false)}
            aria-label={language === "ar" ? "إغلاق" : "Close"}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-primary">
                {language === "ar" ? "استعادة كلمة المرور" : "Reset Password"}
              </h3>
              <button
                type="button"
                onClick={() => setShowForgotForm(false)}
                className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground hover:border-primary/40"
                aria-label={language === "ar" ? "إغلاق" : "Close"}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              {language === "ar"
                ? "غيّر كلمة المرور فقط للحساب الذي تدخل إيميله وكلمة مروره القديمة بشكل صحيح."
                : "Password changes only for the account matching the entered email and old password."}
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                void handleForgotPassword();
              }}
            >
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="forgot-email-input"
                >
                  {t("email")}
                </label>
                <input
                  id="forgot-email-input"
                  type="email"
                  name="forgot-email"
                  autoComplete="email"
                  value={forgotData.email}
                  onChange={(e) =>
                    setForgotData((f) => ({ ...f, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="example@email.com"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="forgot-old-pw"
                >
                  {language === "ar" ? "كلمة السر القديمة" : "Old password"}
                </label>
                <div className="relative">
                  <input
                    id="forgot-old-pw"
                    type={showForgotPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={forgotData.oldPassword}
                    onChange={(e) =>
                      setForgotData((f) => ({
                        ...f,
                        oldPassword: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 pe-11 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword((v) => !v)}
                    className="absolute inset-e-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showForgotPassword ? "Hide" : "Show"}
                  >
                    {showForgotPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="forgot-new-pw"
                >
                  {language === "ar" ? "كلمة السر الجديدة" : "New password"}
                </label>
                <input
                  id="forgot-new-pw"
                  type={showForgotPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={forgotData.newPassword}
                  onChange={(e) =>
                    setForgotData((f) => ({
                      ...f,
                      newPassword: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium"
                  htmlFor="forgot-confirm-pw"
                >
                  {language === "ar"
                    ? "تأكيد كلمة السر الجديدة"
                    : "Confirm new password"}
                </label>
                <input
                  id="forgot-confirm-pw"
                  type={showForgotPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={forgotData.confirmNewPassword}
                  onChange={(e) =>
                    setForgotData((f) => ({
                      ...f,
                      confirmNewPassword: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-60"
              >
                {forgotLoading
                  ? language === "ar"
                    ? "جارٍ التحقق..."
                    : "Processing..."
                  : language === "ar"
                    ? "تغيير كلمة المرور"
                    : "Change password"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
