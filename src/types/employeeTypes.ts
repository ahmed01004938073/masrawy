// أنواع بيانات الموظفين والصلاحيات

// أقسام النظام (مطابقة للقائمة الجانبية)
export const SYSTEM_SECTIONS = [
  "dashboard", // لوحة التحكم
  "products", // المنتجات
  "categories", // الأقسام
  "orders", // الطلبات
  "warehouse", // المخزن
  "shipping", // الشحن
  "delivery", // جاري التوصيل
  "archive", // أرشيف الطلبات
  "marketers", // المسوقين
  "commissions", // العمولات
  "shipping-settings", // إعدادات الشحن
  "reports", // التقارير
  "settings", // الإعدادات
  "site-settings", // إعدادات الموقع
] as const;

// أنواع مشتقة من المصفوفات
export type SystemSection = typeof SYSTEM_SECTIONS[number];

// نوع بيانات الموظف
export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string; // سيتم تخزينها بشكل آمن في التطبيق الحقيقي
  phone?: string;
  role: string; // دور مخصص (اسم وصفي)
  accessibleSections: SystemSection[]; // الأقسام التي يمكن للموظف الوصول إليها
  isActive: boolean;
  status?: 'active' | 'inactive'; // Added for compatibility
  createdAt: string;
  updatedAt?: string;
  lastActive?: string;
  firstLoginToday?: string;
  lastPage?: string;
  lastActionType?: string;
  lastActionTime?: string;
  isOnline?: boolean;
  isActiveWorker?: boolean;
  avatar?: string; // صورة الموظف (URL)
  permissions?: { section: string; actions: string[] }[]; // صلاحيات دقيقة
}

// الأدوار الافتراضية مع الأقسام المتاحة لكل دور
export const DEFAULT_ROLES: Record<string, { name: string, sections: SystemSection[] }> = {
  admin: {
    name: "مدير النظام",
    sections: [...SYSTEM_SECTIONS] // جميع الأقسام
  },
  sales: {
    name: "مبيعات",
    sections: ["dashboard", "products", "categories", "orders"]
  },
  warehouse: {
    name: "مخزن",
    sections: ["dashboard", "warehouse", "products"]
  },
  shipping: {
    name: "شحن",
    sections: ["dashboard", "shipping", "shipping-settings"]
  },
  delivery: {
    name: "توصيل",
    sections: ["dashboard", "delivery"]
  },
  customer_service: {
    name: "خدمة عملاء",
    sections: ["dashboard", "orders", "archive"]
  },
  accountant: {
    name: "محاسب",
    sections: ["dashboard", "archive", "reports"]
  },
  marketer: {
    name: "مسوق",
    sections: ["dashboard", "marketers", "commissions"]
  }
};
