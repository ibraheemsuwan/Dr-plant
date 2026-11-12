import { useState, type ChangeEvent, type FormEvent } from "react";
import { Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useUser } from "../contexts/UserContext";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { Reveal } from "./animations/Reveal";

export function Login() {
  const { t, language } = useLanguage();
  const { login, register, isLoggedIn, authLoading } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname === "/login";
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  if (isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isLogin && formData.password !== formData.confirmPassword) {
      alert(t("passwordsDoNotMatch"));
      return;
    }
    if (isLogin) {
      const r = await login(formData.email, formData.password);
      if (!r.ok) {
        alert(r.error || t("invalidLogin"));
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
        alert(r.error || t("invalidLogin"));
        return;
      }
    }
    navigate(isLogin ? "/" : "/login");
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="relative min-h-[calc(100vh-64px)] flex bg-background overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 start-[12%] h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-1/3 -end-24 h-72 w-72 rounded-full bg-emerald-400/8 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_10%,transparent),transparent_62%)]" />
      </div>
      {/* Left: Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-emerald-800 relative z-10 overflow-hidden items-center justify-center p-12">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-10 start-10 w-32 h-32 rounded-full bg-white/10" />
          <div className="absolute bottom-20 end-10 w-48 h-48 rounded-full bg-white/10" />
          <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/5" />
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
              { num: "90%", label: language === "ar" ? "دقة" : "Accuracy" },
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
        <Reveal>
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
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
          <div className="flex p-1 bg-muted rounded-full mb-8">
            <Link
              to="/login"
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all text-center ${
                isLogin
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("login")}
            </Link>
            <Link
              to="/register"
              className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-all text-center ${
                !isLogin
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("signUp")}
            </Link>
          </div>

          <div className="mb-8">
            <h1
              className="text-3xl font-bold mb-2"
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
            <p className="text-muted-foreground">
              {isLogin
                ? language === "ar"
                  ? "سجل الدخول للوصول إلى حسابك"
                  : "Sign in to access your account"
                : language === "ar"
                  ? "أنشئ حسابك مجاناً اليوم"
                  : "Create your free account today"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 ps-11 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="example@email.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium">{t("password")}</label>
                {isLogin && (
                  <Link to="/forgot-password" className="text-primary text-sm hover:underline">
                    {t("forgotPassword")}
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 ps-11 pe-12 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  <Lock className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 accent-primary"
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-muted-foreground cursor-pointer"
                >
                  {language === "ar" ? "تذكرني" : "Remember me"}
                </label>
              </div>
            )}

            {!isLogin ? (
              <p className="text-center text-xs leading-relaxed text-muted-foreground">
                {language === "ar" ? "بإنشاء حساب فإنك توافق على " : "By signing up you agree to the "}
                <Link to="/terms" className="font-medium text-primary hover:underline">
                  {language === "ar" ? "شروط الاستخدام" : "Terms of Use"}
                </Link>
                {language === "ar" ? " و" : " and "}
                <Link to="/privacy" className="font-medium text-primary hover:underline">
                  {language === "ar" ? "سياسة الخصوصية" : "Privacy Policy"}
                </Link>
                .
              </p>
            ) : null}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-semibold flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-60 disabled:pointer-events-none"
            >
              {authLoading ? (
                <span className="inline-block size-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : null}
              {isLogin ? t("login") : t("signUp")}
              {!authLoading ? <ArrowRight className="w-4 h-4" /> : null}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
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
    </div>
  );
}
