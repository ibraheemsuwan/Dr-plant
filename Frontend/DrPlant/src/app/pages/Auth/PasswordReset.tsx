import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { Lock, Mail } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { apiPost } from "../../api/http";
import { getErrorMessage } from "../../api/errors";

const inputClass =
  "w-full px-4 py-3 ps-11 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";
const buttonClass =
  "w-full py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-semibold disabled:opacity-60 disabled:pointer-events-none";

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm">
        <h1
          className="mb-6 text-2xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif" }}
        >
          {title}
        </h1>
        {children}
      </div>
    </div>
  );
}

/** Step 1: ask for the email. The answer is always the same, so it never reveals which emails have accounts. */
export function ForgotPasswordPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiPost("/Auth/forgot-password", { email: email.trim() }, { skipAuth: true });
      setSent(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell title={isAr ? "نسيت كلمة المرور؟" : "Forgot your password?"}>
      {sent ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm leading-relaxed">
            {isAr
              ? "إذا كان هناك حساب بهذا البريد فقد أرسلنا إليه رابطًا لإعادة تعيين كلمة المرور. الرابط صالح لمدة ساعة. تحقق من صندوق الوارد ومن البريد غير المرغوب."
              : "If an account exists for that email, we sent it a link to reset the password. The link is valid for one hour. Check your inbox and your spam folder."}
          </p>
          <Link to="/login" className="block text-center text-sm font-semibold text-primary hover:underline">
            {isAr ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <p className="text-sm text-muted-foreground">
            {isAr
              ? "اكتب بريدك الإلكتروني وسنرسل لك رابطًا لاختيار كلمة مرور جديدة."
              : "Enter your email and we will send you a link to choose a new password."}
          </p>
          <div className="relative">
            <Mail className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className={inputClass}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="submit" disabled={loading || !email.trim()} className={buttonClass}>
            {loading ? (isAr ? "جارٍ الإرسال..." : "Sending...") : isAr ? "أرسل الرابط" : "Send reset link"}
          </button>
          <Link to="/login" className="block text-center text-sm text-muted-foreground hover:text-primary">
            {isAr ? "العودة لتسجيل الدخول" : "Back to sign in"}
          </Link>
        </form>
      )}
    </Shell>
  );
}

/** Step 2: the page the emailed link opens (/reset-password?token=...). */
export function ResetPasswordPage() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(isAr ? "كلمة المرور يجب أن لا تقل عن 6 أحرف." : "The password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError(isAr ? "كلمتا المرور غير متطابقتين." : "The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await apiPost("/Auth/reset-password", { token, newPassword: password }, { skipAuth: true });
      setDone(true);
    } catch (err) {
      setError(
        isAr
          ? "هذا الرابط غير صالح أو انتهت صلاحيته. اطلب رابطًا جديدًا."
          : getErrorMessage(err),
      );
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Shell title={isAr ? "رابط غير صالح" : "Invalid link"}>
        <p className="mb-4 text-sm text-muted-foreground">
          {isAr ? "هذا الرابط ناقص. اطلب رابطًا جديدًا." : "This link is incomplete. Request a new one."}
        </p>
        <Link to="/forgot-password" className="font-semibold text-primary hover:underline">
          {isAr ? "طلب رابط جديد" : "Request a new link"}
        </Link>
      </Shell>
    );
  }

  return (
    <Shell title={isAr ? "كلمة مرور جديدة" : "Choose a new password"}>
      {done ? (
        <div className="space-y-4">
          <p className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
            {isAr ? "تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول." : "Your password was changed. You can now sign in."}
          </p>
          <Link to="/login" className={`${buttonClass} block text-center`}>
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="relative">
            <Lock className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isAr ? "كلمة المرور الجديدة" : "New password"}
              className={inputClass}
            />
          </div>
          <div className="relative">
            <Lock className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={isAr ? "أعد كتابة كلمة المرور" : "Repeat the password"}
              className={inputClass}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <button type="submit" disabled={loading} className={buttonClass}>
            {loading ? (isAr ? "جارٍ الحفظ..." : "Saving...") : isAr ? "حفظ كلمة المرور" : "Save password"}
          </button>
        </form>
      )}
    </Shell>
  );
}
