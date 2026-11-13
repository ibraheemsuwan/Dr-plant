import { Mail, Phone, MapPin, Send, MessageCircle, Clock } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useState, type ChangeEvent, type FormEvent } from "react";
import emailjs from "@emailjs/browser";
import { createContactMessage } from "../api/services/contactMessagesService";
import { getErrorMessage } from "../api/errors";
import { emailJsConfig } from "../../config/emailjs";
import { Reveal } from "./animations/Reveal";
import { PageLabel } from "./PageLabel";

export function Contact() {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateContactForm = (): string | null => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const subject = formData.subject.trim();
    const message = formData.message.trim();

    if (!name) {
      return language === "ar" ? "الاسم مطلوب." : "Name is required.";
    }
    if (name.length < 2) {
      return language === "ar"
        ? "الاسم يجب أن يكون حرفين على الأقل."
        : "Name must be at least 2 characters.";
    }
    if (!email) {
      return language === "ar"
        ? "البريد الإلكتروني مطلوب."
        : "Email is required.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return language === "ar"
        ? "صيغة البريد الإلكتروني غير صحيحة."
        : "Please enter a valid email address.";
    }
    if (!subject) {
      return language === "ar" ? "الموضوع مطلوب." : "Subject is required.";
    }
    if (!message) {
      return language === "ar" ? "الرسالة مطلوبة." : "Message is required.";
    }
    if (message.length < 5) {
      return language === "ar"
        ? "الرسالة قصيرة جدًا."
        : "Message is too short.";
    }
    return null;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateContactForm();
    if (validationError) {
      setSubmitError(validationError);
      setSubmitted(false);
      return;
    }

    setLoading(true);
    setSubmitError(null);
    setSubmitted(false);
    try {
      await createContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      try {
        console.log("EmailJS params:", {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        });
        await emailjs.send(
          emailJsConfig.serviceId,
          emailJsConfig.contactTemplateId,
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          },
          emailJsConfig.publicKey,
        );
      } catch {
        setSubmitError("Saved, but email was not sent.");
        setSubmitted(false);
        return;
      }

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      window.setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      setSubmitError(
        getErrorMessage(err) ||
          (language === "ar"
            ? "حدث خطأ أثناء إرسال الرسالة. حاول مرة أخرى."
            : "Failed to send message. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const contactInfo = [
    {
      icon: <Mail className="w-5 h-5" />,
      title: language === "ar" ? "البريد الإلكتروني" : "Email",
      details: ["yazanarar59@gmail.com"],
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400",
    },
    {
      icon: <Phone className="w-5 h-5" />,
      title: language === "ar" ? "الهاتف" : "Phone",
      details: ["+970 599812555"],
      color:
        "bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400",
    },
    {
      icon: <MapPin className="w-5 h-5" />,
      title: language === "ar" ? "العنوان" : "Address",
      details: [
        language === "ar" ? "الضفة الغربية، فلسطين" : "West Bank, Palestine",
      ],
      color: "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400",
    },
    {
      icon: <Clock className="w-5 h-5" />,
      title: language === "ar" ? "ساعات العمل" : "Working Hours",
      details: [
        language === "ar" ? "السبت - الخميس: 9ص - 5م" : "Sat - Thu: 9AM - 5PM",
        language === "ar" ? "الجمعة: مغلق" : "Friday: Closed",
      ],
      color:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400",
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden py-12 px-4 bg-background">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute -top-24 start-[12%] h-72 w-72 rounded-full bg-primary/12 blur-[95px]" />
        <div className="absolute top-1/3 -end-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,color-mix(in_oklch,var(--color-primary)_14%,transparent),transparent_62%)]" />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background" />
      </div>
      <Reveal variant="pop">
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <PageLabel icon={MessageCircle}>
              {language === "ar" ? "نحن هنا لمساعدتك" : "We're Here to Help"}
            </PageLabel>
            <h1
              className="text-5xl font-bold mb-4"
              style={{
                fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
              }}
            >
              {t("contactUs")}
            </h1>
            <p className="text-muted-foreground text-lg">
              {language === "ar"
                ? "نحن هنا للإجابة على أسئلتك ومساعدتك"
                : "We're here to answer your questions and help you"}
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {contactInfo.map((info, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 ${info.color} rounded-xl flex items-center justify-center mx-auto mb-3`}
                >
                  {info.icon}
                </div>
                <h3 className="font-semibold mb-2 text-sm">{info.title}</h3>
                {info.details.map((detail, i) => (
                  <p key={i} className="text-muted-foreground text-xs">
                    {detail}
                  </p>
                ))}
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-8 flex flex-col h-full">
              <h2
                className="text-2xl font-bold mb-6"
                style={{
                  fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                }}
              >
                {language === "ar" ? "أرسل لنا رسالة" : "Send Us a Message"}
              </h2>

              {submitted && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-2xl text-sm font-medium">
                  ✓{" "}
                  {language === "ar"
                    ? "تم إرسال رسالتك بنجاح! سنرد عليك قريباً."
                    : "Message sent successfully! We'll reply soon."}
                </div>
              )}
              {submitError ? (
                <div className="mb-6 p-4 bg-destructive/10 border border-destructive/30 text-destructive rounded-2xl text-sm font-medium">
                  {submitError}
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                className="space-y-5 flex flex-col flex-1"
              >
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block mb-2 text-sm font-medium"
                    >
                      {t("name")}
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder={
                        language === "ar" ? "أدخل اسمك" : "Enter your name"
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block mb-2 text-sm font-medium"
                    >
                      {t("email")}
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      placeholder="example@email.com"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block mb-2 text-sm font-medium"
                  >
                    {language === "ar" ? "الموضوع" : "Subject"}
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">
                      {language === "ar" ? "اختر الموضوع" : "Select subject"}
                    </option>
                    <option value="support">
                      {language === "ar" ? "دعم تقني" : "Technical Support"}
                    </option>
                    <option value="general">
                      {language === "ar" ? "استفسار عام" : "General Inquiry"}
                    </option>
                    <option value="partnership">
                      {language === "ar" ? "شراكة" : "Partnership"}
                    </option>
                    <option value="feedback">
                      {language === "ar" ? "ملاحظات" : "Feedback"}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block mb-2 text-sm font-medium"
                  >
                    {t("message")}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={8}
                    className="w-full px-4 py-3 bg-muted/40 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none min-h-[180px] sm:min-h-[220px]"
                    placeholder={
                      language === "ar"
                        ? "اكتب رسالتك هنا..."
                        : "Write your message here..."
                    }
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all flex items-center justify-center gap-3 font-semibold shadow-lg shadow-primary/25 mt-auto"
                >
                  <Send className="w-5 h-5" />
                  {loading
                    ? language === "ar"
                      ? "جارٍ الإرسال..."
                      : "Sending..."
                    : t("send")}
                </button>
              </form>
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6 h-full">
              {/* Map Placeholder */}
              <div className="rounded-3xl border border-border bg-card overflow-hidden flex-1">
                <div className="relative h-[260px] sm:h-[320px] lg:h-[360px]">
                  <img
                    src="/assets/map.jpg"
                    alt={language === "ar" ? "خريطة الموقع" : "Location map"}
                    className="absolute inset-0 h-full w-full object-cover"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/15 to-transparent" />

                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none"></div>
                </div>

                <div className="p-6 sm:p-8">
                  <h3
                    className="font-bold text-xl mb-2 text-foreground"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {language === "ar" ? "زورنا" : "Visit Us"}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                    {language === "ar"
                      ? "الضفة الغربية، فلسطين\nشارع يافا، طولكرم"
                      : "West Bank, Palestine\nJaffa Street, Tulkarm"}
                  </p>
                  <a
                    href="https://maps.app.goo.gl/8uMfi8XhQB9zsx6UA"
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center justify-center px-5 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    {language === "ar" ? "عرض الخريطة" : "View on Map"}
                  </a>
                </div>
              </div>

              {/* Quick Reply */}
              <div className="bg-muted/40 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <h3 className="font-semibold text-sm">
                    {language === "ar"
                      ? "متاحون للمساعدة"
                      : "Available for Help"}
                  </h3>
                </div>
                <p className="text-muted-foreground text-xs">
                  {language === "ar"
                    ? "وقت الرد المتوقع: أقل من 24 ساعة"
                    : "Expected response time: Less than 24 hours"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
