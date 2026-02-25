
// واجهة إعدادات الموقع
import { API_URL } from "@/config/apiConfig";
export interface SiteSettings {
  // إعدادات عامة
  siteName: string; // اسم الموقع للداشبورد والإدارة
  displayName: string; // اسم العرض للمتجر والعملاء
  siteDescription: string;
  logo: string;
  favicon: string;
  storeNameImage?: string; // صورة اسم المتجر (بدلاً من النص)
  loginPageImage?: string; // صورة صفحة تسجيل الدخول (خاصة)

  // إعدادات لوحة التحكم
  dashboardLogoType: 'text' | 'image';
  dashboardTitle: string;
  dashboardLogoUrl?: string;
  dashboardWebsiteLink?: string; // رابط الموقع المخصص

  // إعدادات اللغة والعملة
  language: 'ar' | 'en'; // لغة الموقع
  currency: string; // عملة الموقع
  currencySymbol: string; // رمز العملة
  currencyPosition: 'before' | 'after'; // موضع رمز العملة (قبل أو بعد المبلغ)

  // الألوان
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;

  // صور المتجر
  storeBannerUrl: string; // بنر صفحة المنتجات

  // إعدادات الصفحة الرئيسية
  homePageBanners: Banner[];
  showFeaturedCategories: boolean;
  featuredCategoriesTitle: string;
  showFeaturedProducts: boolean;
  featuredProductsTitle: string;

  // إعدادات التواصل الاجتماعي
  socialLinks: SocialLink[];

  // إعدادات الاتصال
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;

  returnPolicy: string; // سياسة الاستبدال والاسترجاع
  aboutPageContent?: string; // محتوى صفحة من نحن
  googleMapsEmbed?: string; // كود تضمين خرائط جوجل

  // إعدادات الشعارات والنصوص
  footerText: string;
  copyrightText: string;

  // إعدادات SEO
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;

  // إعدادات العمولات والطلبات
  minCommission: number; // الحد الأدنى للعمولة
  maxCommission: number; // الحد الأقصى للعمولة
  maxOrders: number; // الحد الأقصى للطلبات
  minWithdrawal: number; // الحد الأدنى للسحب

  // إعدادات زر الواتساب
  whatsappNumber: string; // رقم الواتساب
  whatsappMessage: string; // الرسالة الافتراضية
  showWhatsappButton: boolean; // إظهار زر الواتساب
  whatsappButtonPosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'; // موضع زر الواتساب

  // إعدادات قفل المتجر
  storeStatus: 'open' | 'closed'; // حالة المتجر (مفتوح أو مقفول)
  closureMessage: string; // رسالة الإغلاق
  closureTitle: string; // عنوان الإغلاق
  closureStartDate?: string; // تاريخ بداية الإغلاق (اختياري)
  closureEndDate?: string; // تاريخ نهاية الإغلاق (اختياري)
  allowBrowsing: boolean; // السماح بتصفح المنتجات أثناء الإغلاق
  showContactInfo: boolean; // إظهار معلومات الاتصال أثناء الإغلاق

  // إعدادات عامة إضافية
  storeUrl?: string; // رابط المتجر (اختياري)
  companyName?: string; // اسم الشركة (اختياري - للفواتير)
  companyPhone?: string; // هاتف الشركة (اختياري)
  companyEmail?: string; // بريد الشركة (اختياري)
  companyAddress?: string; // عنوان الشركة (اختياري)
  companyLogo?: string; // شعار الشركة للفواتير (اختياري)
  categoryBanners: Record<string, string>; // بنرات الأقسام

  // سمات المنتجات (الألوان والمقاسات)
  productColors: string[];
  productSizes: Record<string, string[]>;

  // إعدادات الأمان
  adminMasterPassword?: string; // كلمة المرور الرئيسية للعمليات الحساسة
  archiveMasterPassword?: string; // كلمة المرور الخاصة بالأرشيف

  // فواصل الأرقام
  thousandSeparator: string;
  decimalSeparator: string;

  // إعدادات أخرى
  shippingFollowUpNumber?: string;

  // إعدادات المعلومات (Sidebar)
  isPriceInclusive?: string; // هل الأسعار شاملة العمولة؟
  shippingPrices?: string; // ماهي اسعار الشحن
  profitDepositSchedule?: string; // متى تنزل الارباح على حسابى
  commissionTransferSchedule?: string; // مواعيد تحويل العمولة
  minWithdrawalLimit?: string; // ماهو احد الادنى لسحب الارباح
  infoReturnPolicy?: string; // سياسة الاسترجاع والاستبدال
  aboutUs?: string; // من نحن
  contactUs?: string; // تواصل معنا
  sellToIndividuals?: string; // هل تبيعون للأفراد
  isProductOriginal?: string; // هل المنتج أصلي
  operationGuarantee?: string; // ضمان التشغيل
  infoAddCommission?: string; // إضافة العمولة
  customerService?: string; // خدمة العملاء
  infoMaxOrders?: string; // الحد الأقصى للقطع
}

// واجهة البانر
export interface Banner {
  id: number;
  imageUrl: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  order: number;
  active: boolean;
  type: 'main' | 'featured' | 'bestseller' | 'footer'; // نوع البانر: رئيسي، مميز، الأكثر مبيعًا، تذييل
}

// واجهة روابط التواصل الاجتماعي
export interface SocialLink {
  id: number;
  platform: SocialPlatform;
  url: string;
  active: boolean;
}

// أنواع منصات التواصل الاجتماعي
export type SocialPlatform = 'facebook' | 'twitter' | 'instagram' | 'youtube' | 'linkedin' | 'tiktok' | 'whatsapp' | 'telegram';

import { fetchJson } from "@/utils/apiUtils";


const getStoredSiteSettings = async (): Promise<SiteSettings | null> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/site_settings?t=${Date.now()}`);
    return data || null;
  } catch {
    return null;
  }
};

const saveStoredSiteSettings = async (settings: SiteSettings) => {
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: 'site_settings', value: settings })
  });
};


// الإعدادات الافتراضية للموقع
const defaultSettings: SiteSettings = {
  // إعدادات عامة
  siteName: 'لوحة التحكم', // للداشبورد
  displayName: 'نظام الأفلييت', // للمتجر
  siteDescription: 'أفضل نظام أفلييت متكامل',
  logo: '',
  favicon: '/favicon.svg',

  // إعدادات لوحة التحكم
  dashboardLogoType: 'text',
  dashboardTitle: 'نظام الأفلييت',
  dashboardLogoUrl: '',
  dashboardWebsiteLink: '',

  // إعدادات اللغة والعملة
  language: 'ar',
  currency: 'جنيه مصري',
  currencySymbol: 'ج.م',
  currencyPosition: 'after',

  // الألوان (ألوان المتجر - الأخضر)
  primaryColor: '#16a34a',      // green-600
  secondaryColor: '#166534',    // green-800
  accentColor: '#f59e0b',       // amber-500 (للعروض والتمييز)

  // صور المتجر
  storeBannerUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200',
  categoryBanners: {}, // بنرات الأقسام الافتراضية فارغة

  // إعدادات الصفحة الرئيسية
  homePageBanners: [
    {
      id: 1,
      imageUrl: 'https://placehold.co/1200x400/3b82f6/ffffff?text=Welcome+to+Cairo',
      title: 'مرحبًا بك في Cairo',
      subtitle: 'تسوق أفضل المنتجات بأفضل الأسعار',
      buttonText: 'تسوق الآن',
      buttonLink: '/products',
      order: 1,
      active: true,
      type: 'main'
    },
    {
      id: 2,
      imageUrl: 'https://placehold.co/800x300/4ade80/ffffff?text=Featured+Products',
      title: 'منتجات مميزة',
      subtitle: 'اكتشف منتجاتنا المميزة',
      buttonText: 'استكشف',
      buttonLink: '/featured',
      order: 2,
      active: true,
      type: 'featured'
    },
    {
      id: 3,
      imageUrl: 'https://placehold.co/800x300/f59e0b/ffffff?text=Best+Sellers',
      title: 'الأكثر مبيعًا',
      subtitle: 'المنتجات الأكثر مبيعًا لدينا',
      buttonText: 'تصفح',
      buttonLink: '/bestsellers',
      order: 3,
      active: true,
      type: 'bestseller'
    },
    {
      id: 4,
      imageUrl: 'https://placehold.co/1200x300/6366f1/ffffff?text=Footer+Banner',
      title: 'تواصل معنا',
      subtitle: 'لأي استفسارات أو مساعدة',
      buttonText: 'اتصل بنا',
      buttonLink: '/contact',
      order: 4,
      active: true,
      type: 'footer'
    }
  ],
  showFeaturedCategories: true,
  featuredCategoriesTitle: 'الأقسام المميزة',
  showFeaturedProducts: true,
  featuredProductsTitle: 'منتجات مميزة',

  // إعدادات التواصل الاجتماعي
  socialLinks: [
    {
      id: 1,
      platform: 'facebook',
      url: 'https://facebook.com',
      active: true
    },
    {
      id: 2,
      platform: 'instagram',
      url: 'https://instagram.com',
      active: true
    },
    {
      id: 3,
      platform: 'twitter',
      url: 'https://twitter.com',
      active: true
    }
  ],

  // إعدادات الاتصال
  contactEmail: 'info@cairo-affiliate.com',
  contactPhone: '+1234567890',
  contactAddress: 'Cairo, Egypt',
  returnPolicy: 'يمكن استبدال أو استرجاع المنتجات خلال 14 يومًا من تاريخ الشراء، شريطة أن تكون بحالتها الأصلية وبدون استخدام. يجب تقديم فاتورة الشراء الأصلية. لا يمكن استرجاع أو استبدال المنتجات المخفضة أو التي تم شراؤها في عروض خاصة.',
  aboutPageContent: 'نحن منصة رائدة في مجال التجارة الإلكترونية، نسعى لتقديم أفضل المنتجات والخدمات لعملائنا. تأسست شركتنا على مبادئ الجودة والشفافية، ونعمل جاهدين لتوفير تجربة تسوق مميزة وسهلة للجميع.',

  // إعدادات الشعارات والنصوص
  footerText: 'جميع الحقوق محفوظة',
  copyrightText: '© 2024 Cairo Affiliate',

  // إعدادات SEO
  seoTitle: 'نظام الأفلييت | أفضل منصة للتجارة الإلكترونية',
  seoDescription: 'نظام أفلييت متكامل للمسوقين. احصل على عمولات مجزية، تتبع أرباحك، وإدارة طلباتك بسهولة.',
  seoKeywords: 'أفلييت, نظام عمولة, تسويق بالعمولة, ربح من الانترنت',

  // إعدادات العمولات والطلبات
  minCommission: 50, // 50 جنيه كحد أدنى للعمولة
  maxCommission: 500, // 500 جنيه كحد أقصى للعمولة
  maxOrders: 5, // 5 منتجات كحد أقصى في الفاتورة الواحدة
  minWithdrawal: 200, // 200 جنيه كحد أدنى للسحب

  // إعدادات زر الواتساب
  whatsappNumber: '+1234567890', // رقم الواتساب
  whatsappMessage: 'مرحباً، أرغب في الاستفسار عن منتجاتكم', // الرسالة الافتراضية
  showWhatsappButton: true, // إظهار زر الواتساب
  whatsappButtonPosition: 'bottom-right', // موضع زر الواتساب

  // إعدادات قفل المتجر
  storeStatus: 'open', // المتجر مفتوح افتراضياً
  closureMessage: 'نعتذر، المتجر مغلق حالياً لأعمال الصيانة والتطوير. سنعود قريباً بخدمة أفضل!',
  closureTitle: 'المتجر مغلق مؤقتاً',
  closureStartDate: undefined,
  closureEndDate: undefined,
  allowBrowsing: false, // منع التصفح افتراضياً أثناء الإغلاق
  showContactInfo: true, // إظهار معلومات الاتصال أثناء الإغلاق

  // سمات المنتجات الافتراضية
  productColors: [
    "أحمر", "أزرق", "أخضر", "أصفر", "أسود", "أبيض", "رمادي", "بني", "برتقالي", "وردي", "بنفسجي", "فضي", "ذهبي"
  ],
  productSizes: {
    "ملابس": ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL", "34", "36", "38", "40", "42", "44", "46"],
    "أحذية": ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"],
    "إكسسوارات": ["مقاس موحد", "صغير", "متوسط", "كبير"],
    "حقائب": ["مقاس موحد", "صغير", "متوسط", "كبير"],
    "إلكترونيات": ["مقاس موحد"],
  },

  // إعدادات الأمان الافتراضية
  adminMasterPassword: "3990",
  archiveMasterPassword: "3990",

  // فواصل الأرقام الافتراضية
  thousandSeparator: ",",
  decimalSeparator: ".",

  // إعدادات المعلومات الافتراضية
  isPriceInclusive: "عمولتك مضافة بالفعل على السعر المعروض، السعر الذي تراه هو السعر النهائي للعميل شامل أرباحك.",
  shippingPrices: "يتم تحديد مصاريف الشحن عند إتمام الطلب بناءً على محافظة العميل والمنطقة المختارة.",
  profitDepositSchedule: "تتم إضافة أرباحك إلى المحفظة بمجرد تغيير حالة الطلب إلى (تم التسليم).",
  commissionTransferSchedule: "يتم تحويل العمولات فور طلبك للسحب حسب المواعيد المحددة في النظام.",
  minWithdrawalLimit: "الحد الأدنى لطلب سحب الأرباح هو 200 جنيه مصري بحد أقصى مرتين أسبوعياً.",
  infoReturnPolicy: "الاسترجاع والاستبدال متاح خلال 14 يوماً من استلام الطلب في حالة وجود عيوب صناعة أو خطأ في المنتج.",
  aboutUs: "منصة أفلييت رائدة توفر لك أفضل المنتجات بأسعار الجملة لتبدأ تجارتك الخاصة بسهولة.",
  contactUs: "يمكنك التواصل معنا عبر الأرقام الموضحة أو من خلال رسائل الصفحة المباشرة.",
  sellToIndividuals: "نعم، خدماتنا متاحة للأفراد والمسوقين على حد سواء بأفضل الأسعار.",
  isProductOriginal: "نعم، جميع المنتجات المعروضة أصلية 100% ومضمونة من الموردين مباشرة.",
  operationGuarantee: "نعم، نضمن تشغيل المنتج وفحصه جيداً قبل الشحن لضمان وصوله إليك بأفضل حالة.",
  infoAddCommission: "يمكنك إضافة عمولتك الخاصة على أي طلب، العمولات المقترحة تضمن لك المنافسة وتحقيق أرباح جيدة.",
  customerService: "فريق الدعم الفني متواجد لمساعدتك طوال أيام الأسبوع من الساعة 10 صباحاً حتى 10 مساءً.",
  infoMaxOrders: "الحد الأقصى للقطع في الفاتورة الواحدة هو 5 قطع لضمان سرعة الشحن والتوصيل."
};

// الحصول على إعدادات الموقع
export const getSiteSettings = async (): Promise<SiteSettings> => {
  const storedSettings = await getStoredSiteSettings();
  if (storedSettings) {
    return { ...defaultSettings, ...storedSettings };
  }
  return defaultSettings;
};

// حفظ إعدادات الموقع
export const saveSiteSettings = async (settings: SiteSettings): Promise<void> => {
  await saveStoredSiteSettings(settings);
};

// تحديث جزء من إعدادات الموقع
export const updateSiteSettings = async (partialSettings: Partial<SiteSettings>): Promise<SiteSettings> => {
  const currentSettings = await getSiteSettings();
  const updatedSettings = { ...currentSettings, ...partialSettings };
  await saveSiteSettings(updatedSettings);
  return updatedSettings;
};

// إضافة بانر جديد
export const addBanner = async (banner: Omit<Banner, 'id'>): Promise<Banner> => {
  const settings = await getSiteSettings();
  const newId = settings.homePageBanners.length > 0
    ? Math.max(...settings.homePageBanners.map(b => b.id)) + 1
    : 1;

  const newBanner: Banner = {
    ...banner,
    id: newId
  };

  settings.homePageBanners.push(newBanner);
  await saveSiteSettings(settings);

  return newBanner;
};

// تحديث بانر موجود
export const updateBanner = async (updatedBanner: Banner): Promise<void> => {
  const settings = await getSiteSettings();
  const index = settings.homePageBanners.findIndex(b => b.id === updatedBanner.id);

  if (index !== -1) {
    settings.homePageBanners[index] = updatedBanner;
    await saveSiteSettings(settings);
  }
};

// حذف بانر
export const deleteBanner = async (id: number): Promise<void> => {
  const settings = await getSiteSettings();
  settings.homePageBanners = settings.homePageBanners.filter(b => b.id !== id);
  await saveSiteSettings(settings);
};

// إضافة رابط تواصل اجتماعي جديد
export const addSocialLink = async (socialLink: Omit<SocialLink, 'id'>): Promise<SocialLink> => {
  const settings = await getSiteSettings();
  const newId = settings.socialLinks.length > 0
    ? Math.max(...settings.socialLinks.map(s => s.id)) + 1
    : 1;

  const newSocialLink: SocialLink = {
    ...socialLink,
    id: newId
  };

  settings.socialLinks.push(newSocialLink);
  await saveSiteSettings(settings);

  return newSocialLink;
};

// تحديث رابط تواصل اجتماعي موجود
export const updateSocialLink = async (updatedSocialLink: SocialLink): Promise<void> => {
  const settings = await getSiteSettings();
  const index = settings.socialLinks.findIndex(s => s.id === updatedSocialLink.id);

  if (index !== -1) {
    settings.socialLinks[index] = updatedSocialLink;
    await saveSiteSettings(settings);
  }
};

// حذف رابط تواصل اجتماعي
export const deleteSocialLink = async (id: number): Promise<void> => {
  const settings = await getSiteSettings();
  settings.socialLinks = settings.socialLinks.filter(s => s.id !== id);
  await saveSiteSettings(settings);
};

// إدارة حالة المتجر
export const getStoreStatus = async (): Promise<'open' | 'closed'> => {
  const settings = await getSiteSettings();
  return settings.storeStatus;
};

export const setStoreStatus = async (status: 'open' | 'closed'): Promise<void> => {
  await updateSiteSettings({ storeStatus: status });
};

export const closeStore = async (closureData: {
  title?: string;
  message?: string;
  startDate?: string;
  endDate?: string;
  allowBrowsing?: boolean;
  showContactInfo?: boolean;
}): Promise<void> => {
  const updateData: Partial<SiteSettings> = {
    storeStatus: 'closed',
    ...closureData
  };

  if (closureData.title) updateData.closureTitle = closureData.title;
  if (closureData.message) updateData.closureMessage = closureData.message;
  if (closureData.startDate) updateData.closureStartDate = closureData.startDate;
  if (closureData.endDate) updateData.closureEndDate = closureData.endDate;
  if (closureData.allowBrowsing !== undefined) updateData.allowBrowsing = closureData.allowBrowsing;
  if (closureData.showContactInfo !== undefined) updateData.showContactInfo = closureData.showContactInfo;

  await updateSiteSettings(updateData);
};

export const openStore = async (): Promise<void> => {
  await updateSiteSettings({
    storeStatus: 'open',
    closureStartDate: undefined,
    closureEndDate: undefined
  });
};

export const isStoreOpen = async (): Promise<boolean> => {
  const settings = await getSiteSettings();

  // إذا كان المتجر مفتوح أساساً
  if (settings.storeStatus === 'open') {
    return true;
  }

  // إذا كان مقفول، تحقق من التواريخ
  if (settings.storeStatus === 'closed') {
    const now = new Date();

    // إذا كان هناك تاريخ انتهاء وقد انتهى، افتح المتجر تلقائياً
    if (settings.closureEndDate) {
      const endDate = new Date(settings.closureEndDate);
      if (now > endDate) {
        await openStore();
        return true;
      }
    }

    return false;
  }

  return true; // افتراضياً مفتوح
};
