import React, { createContext, useContext, useEffect, useState } from 'react';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations = {
  ar: {
    home: 'الرئيسية',
    scan: 'فحص النبات',
    weather: 'الطقس',
    seasonalCrops: 'المحاصيل الموسمية',
    blog: 'المدونة',
    contact: 'التواصل',
    login: 'تسجيل الدخول',
    heroTitle: 'فحص النباتات الذكي',
    heroSubtitle: 'اكتشف أمراض النباتات واحصل على نصائح زراعية متقدمة باستخدام الذكاء الاصطناعي',
    getStarted: 'ابدأ الآن',
    learnMore: 'اعرف المزيد',
    features: 'الميزات',
    scanFeatureTitle: 'فحص فوري للنباتات',
    scanFeatureDesc: 'التقط صورة واحصل على تشخيص فوري',
    weatherFeatureTitle: 'تحديثات الطقس',
    weatherFeatureDesc: 'توقعات طقس دقيقة للمزارعين',
    weatherExplainBadge: 'طقس فلسطين',
    weatherExplainTitle: 'عرض الطقس في مدن فلسطين',
    weatherExplainLead:
      'اطّلع على حالة الطقس الحالية في مدن فلسطين من مكان واحد—مناسب للمزارع والمهتمين بالزراعة.',
    weatherExplainP1: 'تغطية لأهم المدن في الضفة وقطاع غزة.',
    weatherExplainP2: 'درجة الحرارة والوصف الجوي لكل مدينة في بطاقة واضحة.',
    weatherExplainP3: 'واجهة بسيطة للمقارنة السريعة بين المناطق.',
    weatherExplainCta: 'شاهد الطقس الآن',
    cropsFeatureTitle: 'دليل المحاصيل الموسمية',
    cropsFeatureDesc: 'اعرف أفضل المحاصيل للزراعة',
    uploadImage: 'ارفع صورة النبات',
    scanNow: 'افحص الآن',
    scanDescription: 'التقط أو ارفع صورة نبتتك للحصول على تشخيص فوري',
    currentWeather: 'الطقس الحالي',
    forecast: 'التوقعات',
    today: 'اليوم',
    tomorrow: 'غداً',
    seasonalCropsTitle: 'المحاصيل الموسمية',
    spring: 'الربيع',
    summer: 'الصيف',
    autumn: 'الخريف',
    winter: 'الشتاء',
    latestPosts: 'أحدث المنشورات',
    readMore: 'اقرأ المزيد',
    blogPageTitle: 'مجتمع الدُرّ والزراعة',
    blogPageSubtitle:
      'شارك تجاربك، واطّلع على نصائح الزراعة والمحاصيل، وتفاعل مع المنشورات.',
    myPosts: 'منشوراتي',
    communityPosts: 'منشورات المجتمع',
    filterByCategory: 'التصنيف',
    allCategories: 'الكل',
    loginToPost: 'سجّل الدخول لإضافة منشور.',
    loginToPostLink: 'تسجيل الدخول',
    cancelEdit: 'إلغاء',
    newPost: 'منشور جديد',
    postTitle: 'عنوان المنشور',
    postContent: 'نص المنشور',
    postExcerpt: 'ملخص أو نص المنشور',
    addImageOrVideo: 'إضافة صورة أو فيديو',
    imageOrVideoHint: 'صورة أو فيديو (الفيديو حتى 5 ميجابايت تقريباً)',
    createPost: 'نشر',
    editPost: 'تعديل المنشور',
    savePost: 'حفظ التغييرات',
    deleteConfirm: 'حذف هذا المنشور؟',
    deletePost: 'حذف',
    like: 'إعجاب',
    loginToLike: 'سجّل الدخول للإعجاب',
    comment: 'تعليق',
    previous: 'السابق',
    next: 'التالي',
    page: 'صفحة',
    of: 'من',
    close: 'إغلاق',
    comments: 'التعليقات',
    writeComment: 'اكتب تعليقاً…',
    addComment: 'إرسال التعليق',
    loginToComment: 'سجّل الدخول للتعليق',
    fillAllFields: 'يرجى ملء العنوان والنص.',
    postCreatedSuccess: 'تم نشر المنشور.',
    postUpdatedSuccess: 'تم تحديث المنشور.',
    deleteComment: 'حذف التعليق',
    deleteCommentConfirm: 'حذف هذا التعليق؟',
    couldNotRemoveLike: 'تعذر إيجاد الإعجاب لإزالته. حدّث الصفحة وحاول مرة أخرى.',
    postSaveErrorStorage:
      'تعذر الحفظ (قد يكون التخزين ممتلئاً). جرّب صورة أصغر أو احذف منشورات قديمة.',
    contactUs: 'تواصل معنا',
    name: 'الاسم',
    firstName: 'الاسم الأول',
    lastName: 'اسم العائلة',
    confirmPassword: 'تأكيد كلمة المرور',
    passwordsDoNotMatch: 'كلمتا المرور غير متطابقتين',
    email: 'البريد الإلكتروني',
    message: 'الرسالة',
    send: 'إرسال',
    loginTitle: 'تسجيل الدخول',
    password: 'كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    dontHaveAccount: 'ليس لديك حساب؟',
    signUp: 'سجل الآن',
    settings: 'الإعدادات',
    logOut: 'تسجيل الخروج',
    accountSettings: 'إعدادات الحساب',
    saveChanges: 'حفظ التغييرات',
    profileSaved: 'تم حفظ التغييرات بنجاح.',
    newPassword: 'كلمة المرور الجديدة',
    passwordChangeHint:
      'اتركهما فارغين إن لم ترد تغيير كلمة المرور. لتحديثها املأ الحقلين بنفس القيمة.',
    invalidLogin: 'البريد أو كلمة المرور غير صحيحة.',
    passwordUpdated: 'تم تحديث كلمة المرور.',
    fillBothPasswordFields: 'املأ حقلي كلمة المرور الجديدة والتأكيد معاً.',
    adminDashboard: 'لوحة التحكم',
    adminNavUsers: 'المستخدمون',
    adminNavCrops: 'المحاصيل',
    adminNavPosts: 'المنشورات',
    adminAccessDenied: 'هذه الصفحة للمسؤولين فقط.',
    adminDemoNote:
      'وضع تجريبي محلي: الأدمن يُحدد بالبريد في الإعدادات. البيانات في المتصفح حتى ربط الخادم.',
    adminUsersTitle: 'الحسابات المسجّلة',
    adminCropsTitle: 'إدارة المحاصيل',
    adminPostsTitle: 'منشورات المدونة',
    adminBuiltinCrops: 'محاصيل افتراضية',
    adminCustomCrops: 'محاصيل مضافة',
    adminAddCrop: 'إضافة محصول',
    adminSaveCrop: 'حفظ المحصول',
    adminCropImage: 'صورة المحصول',
    adminDifficultyEasy: 'سهل',
    adminDifficultyMedium: 'متوسط',
    adminDifficultyHard: 'صعب',
    adminSelectSeason: 'الموسم',
    adminGrowthPeriod: 'مدة النمو',
    adminNoUsers: 'لا يوجد مستخدمون في السجل بعد.',
    adminNoPosts: 'لا توجد منشورات.',
    adminDelete: 'حذف',
    adminRegisteredAt: 'تاريخ التسجيل',
    difficulty: 'الصعوبة',
    adminBackHome: 'العودة للرئيسية',
    weatherClimateTitle: 'الطقس والمناخ',
    liveLabel: 'مباشر',
    realTimeUpdates: 'تحديثات فورية لـ',
    lastUpdate: 'آخر تحديث',
    weatherRefresh: 'تحديث',
    humidity: 'الرطوبة',
    windSpeed: 'سرعة الرياح',
    city: 'المدينة',
    weatherMax: 'الأعلى',
    weatherMin: 'الأدنى',
    weatherNextFiveDays: 'الأيام الخمسة القادمة',
    weatherSelectCity: 'اختر المدينة',
    weatherPoweredBy: 'بيانات من Open-Meteo',
    clear: 'صافٍ',
    mostlyClear: 'صافٍ في الغالب',
    cloudy: 'غائم',
    fog: 'ضباب',
    drizzle: 'رذاذ',
    rain: 'مطر',
    freezingRain: 'مطر متجمد',
    snow: 'ثلج',
    snowGrains: 'حبات ثلج',
    rainShowers: 'زخات مطر',
    snowShowers: 'زخات ثلجية',
    thunderstorm: 'عاصفة رعدية',
    weatherLabel: 'الطقس',
    weatherCityNotFound: 'المدينة غير موجودة',
    weatherErrorGeneric: 'حدث خطأ ما',
    analyzing: 'جاري التحميل...',
    plantingTime: 'وقت الزراعة',
    weatherPageSeasonCropsTitle: 'محاصيل مناسبة حسب الموسم',
    weatherPageSeasonCropsSubtitle:
      'أوقات زراعة مقترحة في فلسطين — تظهر صورة كل محصول عند إضافتها إلى مجلد الصور.',
  },
  en: {
    home: 'Home',
    scan: 'Plant Scan',
    weather: 'Weather',
    seasonalCrops: 'Seasonal Crops',
    blog: 'Blog',
    contact: 'Contact',
    login: 'Login',
    heroTitle: 'Smart Plant Detection',
    heroSubtitle: 'Discover plant diseases and get advanced farming advice using AI technology',
    getStarted: 'Get Started',
    learnMore: 'Learn More',
    features: 'Features',
    scanFeatureTitle: 'Instant Plant Scan',
    scanFeatureDesc: 'Take a photo and get instant diagnosis',
    weatherFeatureTitle: 'Weather Updates',
    weatherFeatureDesc: 'Accurate weather forecasts for farmers',
    weatherExplainBadge: 'Palestine weather',
    weatherExplainTitle: 'Weather across Palestinian cities',
    weatherExplainLead:
      'See current conditions across Palestinian cities in one place—built for growers and plant enthusiasts.',
    weatherExplainP1: 'Coverage for major cities in the West Bank and Gaza Strip.',
    weatherExplainP2: 'Temperature and sky conditions per city in a clear card.',
    weatherExplainP3: 'A simple layout to compare areas at a glance.',
    weatherExplainCta: 'View weather now',
    cropsFeatureTitle: 'Seasonal Crops Guide',
    cropsFeatureDesc: 'Know the best crops to plant',
    uploadImage: 'Upload Plant Image',
    scanNow: 'Scan Now',
    scanDescription: 'Capture or upload an image of your plant for instant diagnosis',
    currentWeather: 'Current Weather',
    forecast: 'Forecast',
    today: 'Today',
    tomorrow: 'Tomorrow',
    seasonalCropsTitle: 'Seasonal Crops',
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
    latestPosts: 'Latest Posts',
    readMore: 'Read More',
    blogPageTitle: 'Growing together',
    blogPageSubtitle:
      'Share experiences, read farming tips, and engage with the community.',
    myPosts: 'My posts',
    communityPosts: 'Community',
    filterByCategory: 'Category',
    allCategories: 'All',
    loginToPost: 'Log in to create a post.',
    loginToPostLink: 'Log in',
    cancelEdit: 'Cancel',
    newPost: 'New post',
    postTitle: 'Post title',
    postContent: 'Post body',
    postExcerpt: 'Excerpt or body',
    addImageOrVideo: 'Add image or video',
    imageOrVideoHint: 'Image or short video (videos ~5MB max for storage)',
    createPost: 'Publish',
    editPost: 'Edit post',
    savePost: 'Save changes',
    deleteConfirm: 'Delete this post?',
    deletePost: 'Delete',
    like: 'Like',
    loginToLike: 'Log in to like',
    comment: 'Comment',
    previous: 'Previous',
    next: 'Next',
    page: 'Page',
    of: 'of',
    close: 'Close',
    comments: 'Comments',
    writeComment: 'Write a comment…',
    addComment: 'Post comment',
    loginToComment: 'Log in to comment',
    fillAllFields: 'Please fill in title and content.',
    postCreatedSuccess: 'Post published.',
    postUpdatedSuccess: 'Post updated.',
    deleteComment: 'Delete comment',
    deleteCommentConfirm: 'Delete this comment?',
    couldNotRemoveLike: 'Could not find this like to remove. Refresh and try again.',
    postSaveErrorStorage:
      'Could not save (storage may be full). Try a smaller image or remove old posts.',
    contactUs: 'Contact Us',
    name: 'Name',
    firstName: 'First name',
    lastName: 'Last name',
    confirmPassword: 'Confirm password',
    passwordsDoNotMatch: 'Passwords do not match',
    email: 'Email',
    message: 'Message',
    send: 'Send',
    loginTitle: 'Login',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    dontHaveAccount: "Don't have an account?",
    signUp: 'Sign Up',
    settings: 'Settings',
    logOut: 'Log out',
    accountSettings: 'Account settings',
    saveChanges: 'Save changes',
    profileSaved: 'Your changes were saved.',
    newPassword: 'New password',
    passwordChangeHint:
      'Leave both blank to keep your current password. To change it, fill both fields with the same new password.',
    invalidLogin: 'Invalid email or password.',
    passwordUpdated: 'Password updated.',
    fillBothPasswordFields: 'Fill in both new password and confirm fields.',
    adminDashboard: 'Admin dashboard',
    adminNavUsers: 'Users',
    adminNavCrops: 'Crops',
    adminNavPosts: 'Posts',
    adminAccessDenied: 'This page is for administrators only.',
    adminDemoNote:
      'Local demo: admin is determined by email in config. Data stays in the browser until the API is connected.',
    adminUsersTitle: 'Registered accounts',
    adminCropsTitle: 'Crop management',
    adminPostsTitle: 'Blog posts',
    adminBuiltinCrops: 'Built-in crops',
    adminCustomCrops: 'Custom crops',
    adminAddCrop: 'Add crop',
    adminSaveCrop: 'Save crop',
    adminCropImage: 'Crop image',
    adminDifficultyEasy: 'Easy',
    adminDifficultyMedium: 'Medium',
    adminDifficultyHard: 'Hard',
    adminSelectSeason: 'Season',
    adminGrowthPeriod: 'Growth period',
    adminNoUsers: 'No users in the registry yet.',
    adminNoPosts: 'No posts.',
    adminDelete: 'Delete',
    adminRegisteredAt: 'Registered',
    difficulty: 'Difficulty',
    adminBackHome: 'Back to home',
    weatherClimateTitle: 'Weather & Climate',
    liveLabel: 'Live',
    realTimeUpdates: 'Real-time updates for',
    lastUpdate: 'Last update',
    weatherRefresh: 'Refresh',
    humidity: 'Humidity',
    windSpeed: 'Wind speed',
    city: 'City',
    weatherMax: 'High',
    weatherMin: 'Low',
    weatherNextFiveDays: 'Next 5 days',
    weatherSelectCity: 'Select city',
    weatherPoweredBy: 'Data from Open-Meteo',
    clear: 'Clear',
    mostlyClear: 'Mostly clear',
    cloudy: 'Cloudy',
    fog: 'Fog',
    drizzle: 'Drizzle',
    rain: 'Rain',
    freezingRain: 'Freezing rain',
    snow: 'Snow',
    snowGrains: 'Snow grains',
    rainShowers: 'Rain showers',
    snowShowers: 'Snow showers',
    thunderstorm: 'Thunderstorm',
    weatherLabel: 'Weather',
    weatherCityNotFound: 'City not found',
    weatherErrorGeneric: 'Something went wrong',
    analyzing: 'Loading...',
    plantingTime: 'Planting time',
    weatherPageSeasonCropsTitle: 'Seasonal crops to grow',
    weatherPageSeasonCropsSubtitle:
      'Suggested planting windows in Palestine — each crop shows its photo when added to the crops folder.',
  },
};

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'drplant_language';

/** The saved choice, else the browser's language (Arabic for ar-*), else English. */
function initialLanguage(): Language {
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved === 'ar' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(initialLanguage);

  // Remember the choice and tell the browser (screen readers, translation tools, search engines)
  useEffect(() => {
    document.documentElement.lang = language;
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.ar] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      <div dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}