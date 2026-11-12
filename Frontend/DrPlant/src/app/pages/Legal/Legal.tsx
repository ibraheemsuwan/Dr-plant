import { Link } from "react-router";
import { useLanguage } from "../../contexts/LanguageContext";

type Section = { title: string; body: string[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

const CONTACT_EMAIL = "yazanarar59@gmail.com";

const PRIVACY: Record<"en" | "ar", Doc> = {
  en: {
    title: "Privacy Policy",
    updated: "Last updated: 12 November 2026",
    intro:
      "Dr Plant helps you identify plant diseases from photos. This page explains what we collect, why, and the choices you have.",
    sections: [
      {
        title: "What we collect",
        body: [
          "Account details: your first and last name, email address and a password. The password is stored only as a one-way hash; we cannot read it.",
          "Photos you upload for diagnosis, together with the result, its confidence, and the date. These are linked to your account so you can review your history.",
          "Content you publish: blog posts, comments and likes. These are public to other visitors.",
          "Messages you send through the contact form (name, email, subject, message) and our replies.",
          "Basic technical data such as your IP address, used for security and to limit abuse (for example, repeated login attempts).",
        ],
      },
      {
        title: "How we use it",
        body: [
          "To diagnose your photos, keep your account, show your history and run the community features.",
          "To answer your messages and keep the service safe.",
          "To improve the accuracy of the service. We do not sell your data and we do not show advertising.",
        ],
      },
      {
        title: "Who processes it for us",
        body: [
          "Cloudinary stores the images you upload (photos for diagnosis, post and crop images).",
          "When our own model is not confident enough, a photo may be analysed by an AI provider (Anthropic) to produce a better diagnosis. Only the photo is sent, with metadata such as GPS location removed, never your name or email.",
          "EmailJS delivers contact-form notifications and our email replies to you.",
          "Open-Meteo provides weather data. Weather uses your device's location only when you allow it, and the location is sent from your browser to the weather service; we do not store it.",
          "Our hosting and database providers store the data described above on our behalf.",
        ],
      },
      {
        title: "Camera and location",
        body: [
          "The camera is used only when you choose to take a photo for a diagnosis. Location is used only for the weather page. You can refuse or revoke either permission in your browser settings; the rest of the app keeps working.",
        ],
      },
      {
        title: "Storage on your device",
        body: [
          "We store your sign-in token and your language and theme choices in your browser's local storage. We do not use advertising or tracking cookies.",
        ],
      },
      {
        title: "How long we keep data",
        body: [
          "We keep your account and history until you delete your account. Deleting your account removes your profile, posts, comments and likes, and your diagnosis history.",
          "Contact messages are kept so we can follow up and are removed on request.",
        ],
      },
      {
        title: "Your choices",
        body: [
          "You can update your name and email, change your password, or delete your account from Settings.",
          `To ask for a copy of your data or for anything removed, write to ${CONTACT_EMAIL}.`,
        ],
      },
      {
        title: "Children",
        body: ["Dr Plant is not directed at children under 13 and we do not knowingly collect their data."],
      },
      {
        title: "Changes",
        body: ["If we change this policy we will update the date above and, for significant changes, tell you in the app."],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 12 نوفمبر 2026",
    intro:
      "يساعدك Dr Plant على التعرف على أمراض النباتات من الصور. توضح هذه الصفحة ما الذي نجمعه ولماذا وما الخيارات المتاحة لك.",
    sections: [
      {
        title: "ما الذي نجمعه",
        body: [
          "بيانات الحساب: الاسم الأول والأخير والبريد الإلكتروني وكلمة المرور. تُحفظ كلمة المرور بصيغة مشفّرة باتجاه واحد ولا نستطيع قراءتها.",
          "الصور التي ترفعها للتشخيص مع النتيجة ونسبة الثقة والتاريخ. وهي مرتبطة بحسابك لتتمكن من مراجعة سجلك.",
          "المحتوى الذي تنشره: المنشورات والتعليقات والإعجابات، وهي ظاهرة لباقي الزوار.",
          "الرسائل التي ترسلها عبر نموذج التواصل (الاسم والبريد والموضوع والرسالة) وردودنا عليها.",
          "بيانات تقنية أساسية مثل عنوان IP، نستخدمها للأمان ولمنع إساءة الاستخدام (مثل تكرار محاولات تسجيل الدخول).",
        ],
      },
      {
        title: "كيف نستخدمها",
        body: [
          "لتشخيص صورك وإدارة حسابك وعرض سجلك وتشغيل ميزات المجتمع.",
          "للرد على رسائلك والحفاظ على أمان الخدمة.",
          "لتحسين دقة الخدمة. لا نبيع بياناتك ولا نعرض إعلانات.",
        ],
      },
      {
        title: "الجهات التي تعالج البيانات لأجلنا",
        body: [
          "تخزّن Cloudinary الصور التي ترفعها (صور التشخيص وصور المنشورات والمحاصيل).",
          "عندما لا يكون نموذجنا واثقًا بما يكفي، قد تُحلَّل الصورة بواسطة مزوّد ذكاء اصطناعي (Anthropic) للحصول على تشخيص أفضل. تُرسل الصورة فقط بعد إزالة بياناتها الوصفية مثل موقع GPS، ولا يُرسل اسمك ولا بريدك أبدًا.",
          "تقوم EmailJS بإيصال إشعارات نموذج التواصل وردودنا عبر البريد.",
          "توفّر Open-Meteo بيانات الطقس. يستخدم الطقس موقع جهازك فقط عندما تسمح بذلك، ويُرسل الموقع من متصفحك إلى خدمة الطقس ولا نخزّنه.",
          "يخزّن مزوّدو الاستضافة وقاعدة البيانات لدينا البيانات المذكورة أعلاه نيابةً عنا.",
        ],
      },
      {
        title: "الكاميرا والموقع",
        body: [
          "تُستخدم الكاميرا فقط عندما تختار التقاط صورة للتشخيص، ويُستخدم الموقع فقط في صفحة الطقس. يمكنك رفض أي إذن أو سحبه من إعدادات المتصفح وسيبقى باقي التطبيق يعمل.",
        ],
      },
      {
        title: "التخزين على جهازك",
        body: [
          "نحفظ رمز تسجيل الدخول واختيارك للغة والمظهر في التخزين المحلي للمتصفح. لا نستخدم ملفات تعريف ارتباط للإعلانات أو التتبع.",
        ],
      },
      {
        title: "مدة الاحتفاظ بالبيانات",
        body: [
          "نحتفظ بحسابك وسجلك حتى تحذف حسابك. حذف الحساب يزيل ملفك الشخصي ومنشوراتك وتعليقاتك وإعجاباتك وسجل تشخيصاتك.",
          "نحتفظ برسائل التواصل لنتمكن من المتابعة، ونحذفها عند الطلب.",
        ],
      },
      {
        title: "خياراتك",
        body: [
          "يمكنك تعديل اسمك وبريدك أو تغيير كلمة المرور أو حذف حسابك من صفحة الإعدادات.",
          `لطلب نسخة من بياناتك أو حذف أي شيء، راسلنا على ${CONTACT_EMAIL}.`,
        ],
      },
      {
        title: "الأطفال",
        body: ["Dr Plant غير موجّه للأطفال دون 13 سنة ولا نجمع بياناتهم عن علم."],
      },
      {
        title: "التغييرات",
        body: ["إذا غيّرنا هذه السياسة فسنحدّث التاريخ أعلاه، وسنخبرك داخل التطبيق عند التغييرات المهمة."],
      },
    ],
  },
};

const TERMS: Record<"en" | "ar", Doc> = {
  en: {
    title: "Terms of Use",
    updated: "Last updated: 12 November 2026",
    intro: "By creating an account or using Dr Plant you agree to these terms.",
    sections: [
      {
        title: "Diagnoses are guidance, not professional advice",
        body: [
          "Results come from an automated model and, sometimes, an AI assistant. They can be wrong. Many plant problems look alike, and photo quality, lighting and plant stage all affect the result.",
          "Do not rely on a diagnosis alone before spending money, destroying a crop or applying pesticides. Confirm with an agronomist or your local agricultural extension service, and always follow the product label and local regulations.",
          "We provide the service as is, without a guarantee of accuracy or of any outcome. To the extent the law allows, we are not liable for losses that result from acting on a diagnosis.",
        ],
      },
      {
        title: "Your account",
        body: [
          "Give accurate information and keep your password private. You are responsible for activity under your account.",
          "We may suspend accounts that abuse the service, for example by attacking it, sending spam, or uploading unlawful content.",
        ],
      },
      {
        title: "Your content",
        body: [
          "You keep ownership of the photos and posts you upload. You give us permission to store and display them as needed to run the service, and to analyse photos to produce diagnoses.",
          "Only upload content you have the right to share. Posts and comments are public. Do not post anything unlawful, abusive, misleading or harmful. We may remove content that breaks these rules.",
        ],
      },
      {
        title: "Acceptable use",
        body: [
          "Do not try to break, overload or reverse-engineer the service, or use it to harm others. Automated use of the diagnosis feature is limited to protect it for everyone.",
        ],
      },
      {
        title: "Changes and contact",
        body: [
          "We may update these terms; continuing to use the service after a change means you accept it.",
          `Questions: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
  ar: {
    title: "شروط الاستخدام",
    updated: "آخر تحديث: 12 نوفمبر 2026",
    intro: "بإنشاء حساب أو باستخدام Dr Plant فإنك توافق على هذه الشروط.",
    sections: [
      {
        title: "التشخيص إرشادي وليس استشارة مهنية",
        body: [
          "تأتي النتائج من نموذج آلي، وأحيانًا من مساعد ذكاء اصطناعي، وقد تكون خاطئة. فكثير من مشكلات النباتات متشابهة، وتؤثر جودة الصورة والإضاءة ومرحلة نمو النبات في النتيجة.",
          "لا تعتمد على التشخيص وحده قبل إنفاق المال أو إتلاف محصول أو استخدام المبيدات. تأكد من مهندس زراعي أو من الإرشاد الزراعي المحلي، والتزم دائمًا بتعليمات المنتج والأنظمة المحلية.",
          "نقدّم الخدمة كما هي دون ضمان للدقة أو لأي نتيجة. وفي الحدود التي يسمح بها القانون، لا نتحمل مسؤولية الخسائر الناتجة عن العمل بناءً على تشخيص.",
        ],
      },
      {
        title: "حسابك",
        body: [
          "قدّم معلومات صحيحة وحافظ على سرية كلمة المرور. أنت مسؤول عن النشاط الذي يتم عبر حسابك.",
          "قد نوقف الحسابات التي تسيء استخدام الخدمة، مثل مهاجمتها أو إرسال رسائل مزعجة أو رفع محتوى غير قانوني.",
        ],
      },
      {
        title: "المحتوى الذي تنشره",
        body: [
          "تبقى ملكية الصور والمنشورات التي ترفعها لك. وتمنحنا الإذن بتخزينها وعرضها بالقدر اللازم لتشغيل الخدمة ولتحليل الصور وإنتاج التشخيصات.",
          "ارفع فقط المحتوى الذي يحق لك مشاركته. المنشورات والتعليقات عامة. لا تنشر ما هو غير قانوني أو مسيء أو مضلل أو ضار. قد نحذف المحتوى المخالف.",
        ],
      },
      {
        title: "الاستخدام المقبول",
        body: [
          "لا تحاول تعطيل الخدمة أو إرهاقها أو الهندسة العكسية لها، ولا تستخدمها لإيذاء الآخرين. الاستخدام الآلي لميزة التشخيص محدود لحمايتها للجميع.",
        ],
      },
      {
        title: "التغييرات والتواصل",
        body: [
          "قد نحدّث هذه الشروط، واستمرارك في استخدام الخدمة بعد التغيير يعني قبولك له.",
          `للاستفسار: ${CONTACT_EMAIL}.`,
        ],
      },
    ],
  },
};

function LegalPage({ docs, other }: { docs: Record<"en" | "ar", Doc>; other: { to: string; en: string; ar: string } }) {
  const { language } = useLanguage();
  const lang = language === "ar" ? "ar" : "en";
  const doc = docs[lang];

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "'Playfair Display', 'Noto Kufi Arabic', serif" }}
        >
          {doc.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{doc.updated}</p>
        <p className="mt-6 leading-relaxed">{doc.intro}</p>

        {doc.sections.map((s) => (
          <section key={s.title} className="mt-8">
            <h2 className="mb-3 text-xl font-semibold">{s.title}</h2>
            <ul className="list-disc space-y-2 ps-5 leading-relaxed text-foreground/90">
              {s.body.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </section>
        ))}

        <p className="mt-10 text-sm">
          <Link to={other.to} className="font-medium text-primary hover:underline">
            {lang === "ar" ? other.ar : other.en}
          </Link>
        </p>
      </article>
    </div>
  );
}

export function PrivacyPage() {
  return <LegalPage docs={PRIVACY} other={{ to: "/terms", en: "Terms of Use →", ar: "شروط الاستخدام ←" }} />;
}

export function TermsPage() {
  return <LegalPage docs={TERMS} other={{ to: "/privacy", en: "Privacy Policy →", ar: "سياسة الخصوصية ←" }} />;
}
