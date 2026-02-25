// أنواع بيانات الموظفين والصلاحيات

// أقسام النظام
export const SYSTEM_SECTIONS = [
  "dashboard", // لوحة التحكم
  "orders", // الطلبات
  "warehouse", // المخزن
  "shipping", // الشحن
  "delivery", // التوصيل
  "collection", // التحصيل
  "archive", // الأرشيف
  "marketers", // المسوقين
  "products", // المنتجات
  "categories", // الأقسام
  "settings", // الإعدادات
  "employees", // الموظفين
  "reports", // التقارير
] as const;

// إجراءات النظام
export const SYSTEM_ACTIONS = [
  "view", // عرض
  "create", // إنشاء
  "edit", // تعديل
  "delete", // حذف
  "approve", // موافقة
  "reject", // رفض
  "export", // تصدير
  "import", // استيراد
] as const;

// أنواع مشتقة من المصفوفات
export type SystemSection = typeof SYSTEM_SECTIONS[number];
export type SystemAction = typeof SYSTEM_ACTIONS[number];

// أدوار الموظفين
export type EmployeeRole =
  | "admin" // مدير النظام
  | "manager" // مدير
  | "sales" // مبيعات
  | "warehouse" // مخزن
  | "shipping" // شحن
  | "delivery" // توصيل
  | "customer_service" // خدمة عملاء
  | "accountant"; // محاسب

// نوع بيانات الصلاحية
export interface Permission {
  section: SystemSection;
  actions: SystemAction[];
}

// نوع بيانات الموظف
export interface Employee {
  id: string;
  name: string;
  email: string;
  password: string; // سيتم تخزينها بشكل آمن في التطبيق الحقيقي
  phone?: string;
  role: EmployeeRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLogin?: string;
}

// الصلاحيات الافتراضية لكل دور
export const DEFAULT_PERMISSIONS: Record<EmployeeRole, Permission[]> = {
  admin: [
    // المدير لديه جميع الصلاحيات على جميع الأقسام
    ...SYSTEM_SECTIONS.map(section => ({
      section,
      actions: ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
    }))
  ],
  manager: [
    // المدير لديه صلاحيات على معظم الأقسام باستثناء الإعدادات والموظفين
    { section: "dashboard", actions: ["view"] },
    { section: "orders", actions: ["view", "create", "edit", "delete", "approve", "reject", "export"] },
    { section: "warehouse", actions: ["view", "edit", "approve", "reject", "export"] },
    { section: "shipping", actions: ["view", "edit", "approve", "reject", "export"] },
    { section: "delivery", actions: ["view", "edit", "approve", "reject", "export"] },
    { section: "collection", actions: ["view", "edit", "approve", "reject", "export"] },
    { section: "archive", actions: ["view", "export"] },
    { section: "marketers", actions: ["view", "create", "edit", "delete", "export"] },
    { section: "products", actions: ["view", "create", "edit", "delete", "export", "import"] },
    { section: "categories", actions: ["view", "create", "edit", "delete"] },
    { section: "reports", actions: ["view", "export"] }
  ],
  sales: [
    // موظف المبيعات لديه صلاحيات على الطلبات والمنتجات
    { section: "dashboard", actions: ["view"] },
    { section: "orders", actions: ["view", "create", "edit", "export"] },
    { section: "products", actions: ["view"] },
    { section: "categories", actions: ["view"] },
    { section: "marketers", actions: ["view"] }
  ],
  warehouse: [
    // موظف المخزن لديه صلاحيات على المخزن والمنتجات
    { section: "dashboard", actions: ["view"] },
    { section: "warehouse", actions: ["view", "edit", "approve", "reject"] },
    { section: "products", actions: ["view", "edit"] }
  ],
  shipping: [
    // موظف الشحن لديه صلاحيات على الشحن
    { section: "dashboard", actions: ["view"] },
    { section: "shipping", actions: ["view", "edit", "approve", "reject"] }
  ],
  delivery: [
    // موظف التوصيل لديه صلاحيات على التوصيل
    { section: "dashboard", actions: ["view"] },
    { section: "delivery", actions: ["view", "edit", "approve", "reject"] }
  ],
  customer_service: [
    // موظف خدمة العملاء لديه صلاحيات على الطلبات والعملاء
    { section: "dashboard", actions: ["view"] },
    { section: "orders", actions: ["view", "edit"] },
    { section: "archive", actions: ["view"] }
  ],
  accountant: [
    // المحاسب لديه صلاحيات على التحصيل والتقارير
    { section: "dashboard", actions: ["view"] },
    { section: "collection", actions: ["view", "edit", "approve", "reject", "export"] },
    { section: "archive", actions: ["view", "export"] },
    { section: "reports", actions: ["view", "export"] }
  ]
};
