import { Link } from "react-router";
import {
  Scan,
  Cloud,
  Sprout,
  ArrowRight,
  Star,
  TrendingUp,
  Leaf,
  ChevronRight,
  Droplets,
  ThermometerSun,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Reveal } from "./animations/Reveal";

/** Hero backdrop — light mode (`public/bg-hero.jpg`). */
const heroBackgroundImage = "/bg-hero.jpg";
/** Hero backdrop — dark mode only (`public/bg_hero2.jpg`). */
const heroBackgroundImageDark = "/bg_hero2.jpg";

const heroPlantImage =
  "https://images.unsplash.com/photo-1593536488938-e1ac82ece373?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cm9waWNhbCUyMGhvdXNlJTIwcGxhbnRzJTIwd2hpdGUlMjBwb3RzJTIwYXJyYW5nZW1lbnR8ZW58MXx8fHwxNzc1MzEzMjEzfDA&ixlib=rb-4.1.0&q=80&w=1080";
const farmImage =
  "https://images.unsplash.com/photo-1769441071410-40528743a0ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW4lMjBmYXJtaW5nJTIwYWdyaWN1bHR1cmUlMjBmaWVsZCUyMGNyb3BzfGVufDF8fHx8MTc3NTMxMzIxOHww&ixlib=rb-4.1.0&q=80&w=1080";
/** Scan feature visual (`public/scan-plant.jpg`). */
const scanImage = "/scan-plant.jpg";
const weatherExplainImage =
  "https://images.unsplash.com/photo-1500382017468-9049fed747ef?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

export function Home() {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: <Scan className="w-6 h-6" />,
      title: t("scanFeatureTitle"),
      description: t("scanFeatureDesc"),
      color: "bg-emerald-50 text-emerald-600",
      path: "/scan",
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: t("weatherFeatureTitle"),
      description: t("weatherFeatureDesc"),
      color: "bg-sky-50 text-sky-600",
      path: "/weather",
    },
    {
      icon: <Sprout className="w-6 h-6" />,
      title: t("cropsFeatureTitle"),
      description: t("cropsFeatureDesc"),
      color: "bg-amber-50 text-amber-600",
      path: "/seasonal-crops",
    },
  ];

  const stats = [
    {
      value: "3+",
      label: language === "ar" ? "أدوات ذكية" : "Smart tools",
    },
    {
      value: "90%",
      label: language === "ar" ? "دقة التشخيص" : "Scan Accuracy",
    },
    { value: "50K+", label: language === "ar" ? "مستخدم نشط" : "Active Users" },
    { value: "4.9", label: language === "ar" ? "تقييم التطبيق" : "App Rating" },
  ];

  const testimonials = [
    {
      name: language === "ar" ? "أحمد محمد" : "Ahmed Mohamed",
      role: language === "ar" ? "مزارع محترف" : "Professional Farmer",
      text:
        language === "ar"
          ? "ساعدني Dr Plant في تحديد أمراض نباتاتي بدقة عالية وإنقاذ محصولي"
          : "Dr Plant helped me identify plant diseases with high accuracy and save my harvest",
      rating: 5,
    },
    {
      name: language === "ar" ? "سارة أحمد" : "Sara Ahmed",
      role:
        language === "ar"
          ? "عاشقة النباتات المنزلية"
          : "Indoor Plant Enthusiast",
      text:
        language === "ar"
          ? "تطبيق رائع لكل من يحب النباتات، التصميم جميل والميزات مفيدة جداً"
          : "Amazing app for plant lovers, beautiful design and very useful features",
      rating: 5,
    },
    {
      name: language === "ar" ? "محمود علي" : "Mahmoud Ali",
      role: language === "ar" ? "مهندس زراعي" : "Agricultural Engineer",
      text:
        language === "ar"
          ? "الأفضل في مجاله، توقعات الطقس دقيقة ومفيدة لتخطيط الزراعة"
          : "Best in its field, weather forecasts are accurate and helpful for farming planning",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-x-clip overflow-y-visible bg-background">
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <img
            src={heroBackgroundImage}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-center dark:hidden"
          />
          <img
            src={heroBackgroundImageDark}
            alt=""
            className="absolute inset-0 hidden h-full w-full object-cover object-center dark:block"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-background via-background/50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="grid min-w-0 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-x-28 xl:gap-x-44 items-center min-h-[calc(100vh-64px)] py-10 sm:py-12 lg:py-0">
            {/* Left Content — يدخل من جهة (يسار LTR / يمين RTL) */}
            <div className="min-w-0 space-y-6 sm:space-y-8 order-2 lg:order-1 animate-dr-hero-text">
              {/* Badge */}
              <div className="inline-flex max-w-full items-center gap-2 px-3 py-2 sm:px-4 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
                <Leaf className="w-4 h-4" />
                {language === "ar"
                  ? "الذكاء الاصطناعي في خدمة النباتات"
                  : "AI-Powered Plant Care"}
              </div>

              {/* Heading */}
              <div>
                <h1
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight text-foreground"
                  style={{
                    fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                    lineHeight: 1.15,
                  }}
                >
                  {language === "ar" ? (
                    <>
                      النبات يجعل حياتك
                      <br />
                      <span className="bg-linear-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                        تتفتح
                      </span>
                    </>
                  ) : (
                    <>
                      Plant makes your life
                      <br />
                      <span className="bg-linear-to-r from-primary to-emerald-600 bg-clip-text text-transparent">
                        blossom
                      </span>
                    </>
                  )}
                </h1>
                <p className="mt-5 text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
                  {language === "ar"
                    ? "رؤى ذكية وتشخيص فوري—لتنمّي نباتاتك بثقة وتستمتع بكل يوم أخضر."
                    : "Smart insights and instant diagnosis—grow your plants with confidence and enjoy greener days."}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  to="/scan"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg shadow-primary/25"
                >
                  {t("scan")}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-foreground text-foreground rounded-full hover:bg-foreground hover:text-background transition-all duration-200 font-medium"
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById("features")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                >
                  {t("learnMore")}
                </a>
              </div>
            </div>

            {/* Right Image — يدخل من الجهة المقابلة */}
            <div className="relative order-1 lg:order-2 flex w-full min-w-0 items-center justify-center overflow-visible animate-dr-hero-image">
              {/* Soft glow behind the arch (matches hero plant frame) */}
              <div
                className="pointer-events-none absolute z-0 mx-auto w-full max-w-[min(100%,18rem)] sm:max-w-md lg:max-w-lg px-2 sm:px-0"
                style={{ aspectRatio: "4/5" }}
                aria-hidden
              >
                <div
                  className="absolute -inset-[8%] rounded-[50%_50%_0_0/60%_60%_0_0] bg-linear-to-b from-lime-200/30 via-emerald-400/22 to-green-300/14 blur-[1.75rem] sm:blur-[2rem] dark:from-teal-500/18 dark:via-emerald-600/24 dark:to-cyan-950/18 dark:blur-[2rem] dark:sm:blur-[2.35rem]"
                  style={{ borderRadius: "50% 50% 0 0 / 60% 60% 0 0" }}
                />
              </div>
              {/* Arch Background — padding داخلي يمنع قص البطاقات على الشاشات الضيقة */}
              <div
                className="relative z-10 mx-auto w-full max-w-[min(100%,18rem)] sm:max-w-md lg:max-w-lg px-2 sm:px-0"
                style={{ aspectRatio: "4/5" }}
              >
                {/* Arch/rounded top shape */}
                <div
                  className="absolute inset-0 bg-white dark:bg-card rounded-[50%_50%_0_0/60%_60%_0_0] shadow-xl"
                  style={{ borderRadius: "50% 50% 0 0 / 60% 60% 0 0" }}
                />
                {/* Decorative circles */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-primary/10 blur-xl" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-amber-400/10 blur-xl" />
                {/* Plant Image */}
                <ImageWithFallback
                  src={heroPlantImage}
                  alt="Beautiful house plants"
                  className="absolute inset-0 w-full h-full object-cover rounded-[50%_50%_0_0/60%_60%_0_0]"
                  style={{
                    borderRadius: "50% 50% 0 0 / 60% 60% 0 0",
                    objectPosition: "center top",
                  }}
                />
                {/* Floating Badge — داخل الإطار على الموبايل */}
                <div className="absolute left-1 top-[28%] z-10 sm:left-0 sm:-left-3 sm:top-1/3 md:-left-5 lg:-left-6 bg-card shadow-lg rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 border border-border animate-dr-float-a max-w-[calc(100%-0.5rem)] sm:max-w-none">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 bg-green-100 rounded-lg sm:rounded-xl flex items-center justify-center text-base sm:text-lg">
                    🌿
                  </div>
                  <div>
                    <p className="text-xs font-semibold">
                      {language === "ar" ? "نبات صحي" : "Healthy Plant"}
                    </p>
                    <p className="text-xs text-green-600">
                      95% {language === "ar" ? "مؤكد" : "Confident"}
                    </p>
                  </div>
                </div>
                {/* Floating Badge 2 */}
                <div className="absolute right-1 bottom-[26%] z-10 sm:right-0 sm:-right-3 sm:bottom-1/3 md:-right-5 lg:-right-6 bg-card shadow-lg rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-border animate-dr-float-b max-w-[calc(100%-0.5rem)] sm:max-w-none">
                  <p className="text-xs text-muted-foreground mb-1">
                    {language === "ar" ? "النوع" : "Species"}
                  </p>
                  <p className="text-sm font-semibold">Monstera</p>
                  <div className="flex gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-primary"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <div key={index}>
                <p
                  className="text-3xl font-bold mb-1"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-primary-foreground/80 text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section — عنوان يظهر بالتمرير، بطاقات تنبثق متتابعة */}
      <section id="features" className="py-24 px-4 scroll-mt-24">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                {language === "ar" ? "ميزاتنا" : "Our Features"}
              </span>
              <h2
                className="text-4xl md:text-5xl mb-4"
                style={{
                  fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                }}
              >
                {t("features")}
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {language === "ar"
                  ? "كل ما تحتاجه لرعاية نباتاتك في مكان واحد"
                  : "Everything you need for plant care in one place"}
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Reveal
                key={feature.path}
                variant="pop"
                delayMs={index * 150}
                className="h-full min-h-0"
              >
                <Link
                  to={feature.path}
                  className="group relative flex h-full flex-col bg-card border border-border rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
                >
                  <div className="p-8 flex flex-col flex-1">
                    <div
                      className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                    >
                      {feature.icon}
                    </div>
                    <h3
                      className="text-xl font-semibold mb-3"
                      style={{
                        fontFamily:
                          "'Playfair Display', 'Noto Kufi Arabic', serif",
                      }}
                    >
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed flex-1">
                      {feature.description}
                    </p>
                    <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm">
                      {language === "ar" ? "اعرف المزيد" : "Learn more"}
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                  <div className="absolute top-0 end-0 w-32 h-32 opacity-5 rounded-full bg-primary translate-x-8 -translate-y-8 pointer-events-none" />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <Reveal>
        <section className="py-24 px-4 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                  {language === "ar" ? "كيف يعمل" : "How It Works"}
                </span>
                <h2
                  className="text-4xl md:text-5xl mb-6"
                  style={{
                    fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                  }}
                >
                  {language === "ar"
                    ? "فحص نبتتك في ٣ خطوات"
                    : "Scan Your Plant in 3 Steps"}
                </h2>
                <div className="space-y-6 mt-8">
                  {[
                    {
                      step: "01",
                      title: language === "ar" ? "التقط صورة" : "Take a Photo",
                      desc:
                        language === "ar"
                          ? "التقط صورة لنبتتك باستخدام كاميرا هاتفك"
                          : "Capture a photo of your plant using your phone camera",
                    },
                    {
                      step: "02",
                      title:
                        language === "ar"
                          ? "حلل بالذكاء الاصطناعي"
                          : "AI Analysis",
                      desc:
                        language === "ar"
                          ? "يقوم نظامنا بتحليل الصورة وتحديد النوع والصحة"
                          : "Our system analyzes the image to identify species and health",
                    },
                    {
                      step: "03",
                      title:
                        language === "ar"
                          ? "احصل على التوصيات"
                          : "Get Recommendations",
                      desc:
                        language === "ar"
                          ? "احصل على نصائح مخصصة لرعاية نبتتك"
                          : "Receive personalized tips for caring for your plant",
                    },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4 items-start">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">
                        {item.step}
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-sm">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/scan"
                  className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-all font-medium shadow-lg shadow-primary/25"
                >
                  <Scan className="w-5 h-5" />
                  {t("scanNow")}
                </Link>
              </div>
              <div className="relative rounded-3xl overflow-hidden aspect-square">
                <ImageWithFallback
                  src={scanImage}
                  alt="Plant scanning technology"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Weather explanation */}
      <Reveal>
        <section className="py-24 px-4 bg-background border-y border-border/60">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-lg border border-border">
                <ImageWithFallback
                  src={weatherExplainImage}
                  alt={
                    language === "ar"
                      ? "سماء وحقل—طقس والزراعة"
                      : "Sky over farmland—weather and growing"
                  }
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-brand-dark/55 via-transparent to-transparent" />
                <div className="absolute bottom-6 start-6 end-6 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-white/95 leading-snug">
                    {language === "ar"
                      ? "طقس مدن فلسطين في لمحة واحدة"
                      : "Palestine city weather at a glance"}
                  </p>
                </div>
              </div>
              <div>
                <span className="inline-block px-4 py-1.5 bg-sky-500/10 text-sky-700 dark:bg-sky-500/15 dark:text-sky-300 rounded-full text-sm font-medium mb-4">
                  {t("weatherExplainBadge")}
                </span>
                <h2
                  className="text-4xl md:text-5xl mb-4 text-brand-dark dark:text-foreground"
                  style={{
                    fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                  }}
                >
                  {t("weatherExplainTitle")}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {t("weatherExplainLead")}
                </p>
                <ul className="space-y-4 mb-8">
                  {[
                    { icon: Cloud, text: t("weatherExplainP1") },
                    { icon: ThermometerSun, text: t("weatherExplainP2") },
                    { icon: Droplets, text: t("weatherExplainP3") },
                  ].map((item, i) => {
                    const IconCmp = item.icon;
                    return (
                      <li key={i} className="flex gap-3 items-start">
                        <span className="w-10 h-10 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                          <IconCmp className="w-5 h-5" />
                        </span>
                        <span className="text-sm text-foreground/90 leading-relaxed pt-1.5">
                          {item.text}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <Link
                  to="/weather"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-primary text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all font-medium shadow-sm hover:shadow-md"
                >
                  {t("weatherExplainCta")}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Seasonal Crops Promo — same surface as How It Works (Plant Scan steps) */}
      <Reveal>
        <section className="py-24 px-4 bg-card">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col gap-12 items-start lg:flex-row">
              <div
                className={`w-full lg:flex-1 ${language === "ar" ? "lg:order-1" : "lg:order-1"}`}
              >
                <span className="inline-block px-4 py-1.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-sm font-medium mb-4">
                  {language === "ar" ? "المحاصيل الموسمية" : "Seasonal Crops"}
                </span>
                <h2
                  className="text-4xl md:text-5xl mb-6"
                  style={{
                    fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                  }}
                >
                  {language === "ar"
                    ? "ازرع بذكاء… واحصد أفضل"
                    : "Plant Smart… Harvest Better"}
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  {language === "ar"
                    ? "دليلك الزراعي الشامل لمعرفة أفضل المحاصيل لزراعتها في كل موسم مع نصائح الخبراء لتحقيق أفضل النتائج"
                    : "Your comprehensive farming guide to knowing the best crops to grow in each season with expert tips for best results"}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    "🌸 " + (language === "ar" ? "الربيع" : "Spring"),
                    "☀️ " + (language === "ar" ? "الصيف" : "Summer"),
                    "🍂 " + (language === "ar" ? "الخريف" : "Autumn"),
                    "❄️ " + (language === "ar" ? "الشتاء" : "Winter"),
                  ].map((season) => (
                    <div
                      key={season}
                      className="px-4 py-3 bg-muted rounded-xl text-sm font-medium text-center"
                    >
                      {season}
                    </div>
                  ))}
                </div>
                <Link
                  to="/seasonal-crops"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-primary text-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-all font-medium"
                >
                  {language === "ar" ? "استكشف المحاصيل" : "Explore Crops"}
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
              <div
                className={`relative self-start w-full rounded-3xl overflow-hidden aspect-[3/2] lg:flex-1 ${
                  language === "ar" ? "lg:order-2" : "lg:order-2"
                }`}
              >
                <ImageWithFallback
                  src={farmImage}
                  alt="Farming and crops"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-brand-dark/55 via-transparent to-transparent" />
                <div className="absolute bottom-6 start-6 end-6 flex items-center gap-3 text-white">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-white/95 leading-snug font-sans">
                    {language === "ar" ? "زد إنتاجيتك" : "Boost Your Yield"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Testimonials — عنوان يظهر، بطاقات ترتفع متتابعة (أسلوب مختلف عن الميزات) */}
      <section className="py-24 px-4 bg-muted/40">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
                {language === "ar" ? "آراء العملاء" : "Testimonials"}
              </span>
              <h2
                className="text-4xl md:text-5xl"
                style={{
                  fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif",
                }}
              >
                {language === "ar"
                  ? "ماذا يقول مستخدمونا"
                  : "What Our Users Say"}
              </h2>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Reveal
                key={testimonial.name}
                variant="lift"
                delayMs={index * 170}
                className="h-full"
              >
                <div className="bg-card rounded-3xl p-8 border border-border hover:shadow-lg transition-shadow h-full">
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground leading-relaxed mb-6 italic">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-300 to-emerald-600 flex items-center justify-center text-white font-bold">
                      {testimonial.name[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <Reveal>
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="relative bg-primary rounded-3xl p-12 text-center text-primary-foreground overflow-hidden">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-56 h-56 rounded-full bg-white translate-x-1/4 translate-y-1/4" />
                <div className="absolute top-1/2 left-1/2 w-32 h-32 rounded-full bg-white -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="relative z-10">
                <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium mb-4">
                  🌱 Dr Plant
                </span>
                <h2
                  className="text-3xl md:text-5xl font-bold mb-4"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  {language === "ar"
                    ? "ابدأ رحلتك الزراعية اليوم"
                    : "Start Your Plant Journey Today"}
                </h2>
                <p className="text-primary-foreground/80 text-lg mb-8 max-w-2xl mx-auto">
                  {language === "ar"
                    ? "انضم إلى أكثر من ٥٠,٠٠٠ مستخدم يستخدمون Dr Plant لرعاية نباتاتهم"
                    : "Join over 50,000 users using Dr Plant to care for their plants"}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link
                    to="/scan"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary rounded-full hover:bg-white/90 transition-all font-semibold shadow-lg"
                  >
                    <Scan className="w-5 h-5" />
                    {t("scanNow")}
                  </Link>
                  <Link
                    to="/blog"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white border border-white/30 rounded-full hover:bg-white/30 transition-all font-medium"
                  >
                    {t("learnMore")}
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <Reveal>
        <footer className="bg-foreground text-background py-16 px-4 dark:bg-[#07140e] dark:text-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Leaf className="w-5 h-5 text-white" />
                  </div>
                  <span
                    className="text-xl font-bold"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Dr Plant
                  </span>
                </div>
                <p className="text-background/60 leading-relaxed max-w-xs dark:text-white/70">
                  {language === "ar"
                    ? "منصتك الزراعية الذكية لرعاية النباتات وتشخيص الأمراض"
                    : "Your smart agricultural platform for plant care and disease diagnosis"}
                </p>
              </div>
              <div>
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {language === "ar" ? "روابط سريعة" : "Quick Links"}
                </h4>
                <ul className="space-y-2 text-background/60 dark:text-white/70">
                  {[
                    { path: "/", label: t("home") },
                    { path: "/scan", label: t("scan") },
                    { path: "/blog", label: t("blog") },
                    { path: "/contact", label: t("contact") },
                  ].map((link) => (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className="hover:text-background transition-colors text-sm dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4
                  className="font-semibold mb-4"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {language === "ar" ? "تواصل معنا" : "Contact"}
                </h4>
                <ul className="space-y-2 text-background/60 text-sm dark:text-white/70">
                  <li>info@plantzone.com</li>
                  <li>+20 123 456 7890</li>
                  <li>{language === "ar" ? "القاهرة، مصر" : "Cairo, Egypt"}</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-background/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-background/40 text-sm dark:border-white/10 dark:text-white/55">
              <p>
                © 2026 Dr Plant.{" "}
                {language === "ar"
                  ? "جميع الحقوق محفوظة"
                  : "All rights reserved."}
              </p>
              <div className="flex gap-4">
                {["Facebook", "Twitter", "Instagram"].map((social) => (
                  <button
                    key={social}
                    className="hover:text-background transition-colors dark:hover:text-white"
                  >
                    {social}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </footer>
      </Reveal>
    </div>
  );
}
