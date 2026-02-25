// خدمة موحدة للموظفين تعمل على الاستضافة
import { Employee } from "@/types/employeeTypes";

// البيانات الافتراضية للموظفين
const DEFAULT_EMPLOYEES: Employee[] = [
  {
    "id": "emp-1",
    "name": "أحمد محمد",
    "email": "admin",
    "password": "admin123",
    "phone": "01012345678",
    "role": "admin",
    "accessibleSections": [
      "dashboard",
      "products",
      "categories", 
      "orders",
      "warehouse",
      "shipping",
      "delivery",
      "archive",
      "marketers",
      "commissions",
      "shipping-settings",
      "reports",
      "settings",
      "site-settings"
    ],
    "permissions": [
      {
        "section": "dashboard",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "orders", 
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "warehouse",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "shipping",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "delivery",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "collection",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "archive",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "marketers",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "products",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "categories",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "settings",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "employees",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      },
      {
        "section": "reports",
        "actions": ["view", "create", "edit", "delete", "approve", "reject", "export", "import"]
      }
    ],
    "isActive": true,
    "createdAt": "2025-06-01T19:21:31.116Z",
    "lastLogin": "2025-06-02T06:26:21.884Z",
    "updatedAt": "2025-06-02T17:59:51.223Z"
  },
  {
    "id": "emp-2", 
    "name": "محمد علي",
    "email": "sales@afleet.com",
    "password": "sales123",
    "phone": "01112345678",
    "role": "sales",
    "accessibleSections": ["dashboard", "products", "categories", "orders"],
    "permissions": [
      {
        "section": "dashboard",
        "actions": ["view"]
      },
      {
        "section": "orders",
        "actions": ["view", "create", "edit", "export"]
      },
      {
        "section": "products",
        "actions": ["view"]
      },
      {
        "section": "categories",
        "actions": ["view"]
      },
      {
        "section": "marketers",
        "actions": ["view"]
      }
    ],
    "isActive": true,
    "createdAt": "2025-06-01T19:21:31.117Z"
  },
  {
    "id": "emp-3",
    "name": "سارة أحمد", 
    "email": "warehouse@afleet.com",
    "password": "warehouse123",
    "phone": "01212345678",
    "role": "warehouse",
    "accessibleSections": ["dashboard", "warehouse", "products"],
    "permissions": [
      {
        "section": "dashboard",
        "actions": ["view"]
      },
      {
        "section": "warehouse",
        "actions": ["view", "edit", "approve", "reject"]
      },
      {
        "section": "products",
        "actions": ["view", "edit"]
      }
    ],
    "isActive": true,
    "createdAt": "2025-06-01T19:21:31.117Z"
  }
];

// نظام تخزين متعدد المستويات
class UnifiedStorage {
  // محاولة حفظ البيانات
  static setData(key: string, data: any): void {
    const jsonData = JSON.stringify(data);
    
    // محاولة localStorage أولاً
    try {
      localStorage.setItem(key, jsonData);
      console.log(`✅ تم حفظ ${key} في localStorage`);
      return;
    } catch (error) {
      console.warn(`⚠️ فشل localStorage لـ ${key}`);
    }
    
    // محاولة sessionStorage
    try {
      sessionStorage.setItem(key, jsonData);
      console.log(`✅ تم حفظ ${key} في sessionStorage`);
      return;
    } catch (error) {
      console.warn(`⚠️ فشل sessionStorage لـ ${key}`);
    }
    
    // استخدام متغير عام
    if (!window.afleetData) window.afleetData = {};
    (window as any).afleetData[key] = data;
    console.log(`✅ تم حفظ ${key} في المتغير العام`);
  }
  
  // محاولة قراءة البيانات
  static getData(key: string): any | null {
    // محاولة localStorage أولاً
    try {
      const data = localStorage.getItem(key);
      if (data) {
        console.log(`✅ تم قراءة ${key} من localStorage`);
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`⚠️ فشل قراءة ${key} من localStorage`);
    }
    
    // محاولة sessionStorage
    try {
      const data = sessionStorage.getItem(key);
      if (data) {
        console.log(`✅ تم قراءة ${key} من sessionStorage`);
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn(`⚠️ فشل قراءة ${key} من sessionStorage`);
    }
    
    // محاولة المتغير العام
    if (window.afleetData && (window as any).afleetData[key]) {
      console.log(`✅ تم قراءة ${key} من المتغير العام`);
      return (window as any).afleetData[key];
    }
    
    console.log(`❌ لم يتم العثور على ${key} في أي مكان`);
    return null;
  }
}

// تهيئة البيانات
export const initializeUnifiedEmployees = (): void => {
  console.log('🔄 تهيئة نظام الموظفين الموحد...');
  
  // التحقق من وجود بيانات
  let employees = UnifiedStorage.getData('employees');
  
  if (!employees || employees.length === 0) {
    console.log('📥 لا توجد بيانات، استخدام البيانات الافتراضية...');
    employees = DEFAULT_EMPLOYEES;
    UnifiedStorage.setData('employees', employees);
  }
  
  console.log('👥 الموظفين المتاحين:');
  employees.forEach((emp: Employee) => {
    console.log(`   👤 ${emp.name} | 📧 ${emp.email} | 🔑 ${emp.password} | ✅ ${emp.isActive ? 'نشط' : 'غير نشط'}`);
  });
  
  console.log('✅ تم تهيئة نظام الموظفين الموحد');
};

// الحصول على جميع الموظفين
export const getUnifiedEmployees = (): Employee[] => {
  const employees = UnifiedStorage.getData('employees');
  return employees || DEFAULT_EMPLOYEES;
};

// البحث عن موظف بالاسم أو الإيميل
export const findEmployeeByIdentifier = (identifier: string): Employee | null => {
  const employees = getUnifiedEmployees();
  const cleanIdentifier = identifier.toLowerCase().trim();
  
  console.log('🔍 البحث عن موظف:', cleanIdentifier);
  
  // البحث بالإيميل أولاً
  let employee = employees.find(emp => emp.email.toLowerCase() === cleanIdentifier);
  
  // إذا لم يوجد، ابحث بالاسم
  if (!employee) {
    employee = employees.find(emp => emp.name.toLowerCase() === cleanIdentifier);
  }
  
  console.log('🔍 نتيجة البحث:', employee ? `وجد - ${employee.name}` : 'لم يوجد');
  return employee || null;
};

// تسجيل دخول موظف
export const unifiedLogin = (identifier: string, password: string): Employee | null => {
  console.log('🔐 محاولة تسجيل دخول:', { identifier, password });
  
  const employee = findEmployeeByIdentifier(identifier);
  
  if (!employee) {
    console.error('❌ لم يتم العثور على موظف بهذا الاسم أو الإيميل');
    return null;
  }
  
  if (employee.password !== password) {
    console.error('❌ كلمة المرور غير صحيحة');
    console.log('🔍 كلمة المرور المحفوظة:', employee.password);
    console.log('🔍 كلمة المرور المدخلة:', password);
    return null;
  }
  
  if (!employee.isActive) {
    console.error('❌ الحساب غير نشط');
    return null;
  }
  
  console.log('✅ تسجيل دخول ناجح:', employee.name);
  
  // حفظ الموظف الحالي
  UnifiedStorage.setData('current_employee', employee);
  
  return employee;
};

// الحصول على الموظف الحالي
export const getCurrentUnifiedEmployee = (): Employee | null => {
  return UnifiedStorage.getData('current_employee');
};

// تسجيل خروج
export const unifiedLogout = (): void => {
  try {
    localStorage.removeItem('current_employee');
    sessionStorage.removeItem('current_employee');
    if (window.afleetData) {
      delete (window as any).afleetData.current_employee;
    }
    console.log('✅ تم تسجيل الخروج');
  } catch (error) {
    console.warn('⚠️ خطأ في تسجيل الخروج:', error);
  }
};

// التحقق من الصلاحيات
export const hasUnifiedPermission = (employee: Employee | null, section: string, action: string = "view"): boolean => {
  if (!employee) return false;
  
  // المدير لديه جميع الصلاحيات
  if (employee.role === "admin") return true;
  
  // التحقق من الصلاحيات المحددة
  if (employee.permissions) {
    const sectionPermission = employee.permissions.find(p => p.section === section);
    if (sectionPermission) {
      return sectionPermission.actions.includes(action);
    }
  }
  
  // التحقق من الأقسام المتاحة
  if (employee.accessibleSections) {
    return employee.accessibleSections.includes(section);
  }
  
  return false;
};

// دوال للاختبار
(window as any).testUnifiedLogin = (identifier: string, password: string) => {
  console.log('🧪 اختبار تسجيل الدخول الموحد...');
  const result = unifiedLogin(identifier, password);
  console.log('🧪 النتيجة:', result ? `✅ نجح - ${result.name}` : '❌ فشل');
  return result;
};

(window as any).showUnifiedEmployees = () => {
  const employees = getUnifiedEmployees();
  console.log('👥 جميع الموظفين:');
  console.table(employees.map(emp => ({ 
    name: emp.name, 
    email: emp.email, 
    password: emp.password,
    role: emp.role,
    isActive: emp.isActive 
  })));
  return employees;
};

(window as any).forceUnifiedLogin = () => {
  console.log('🔧 فرض تسجيل دخول الأدمن...');
  const admin = DEFAULT_EMPLOYEES[0];
  UnifiedStorage.setData('current_employee', admin);
  console.log('✅ تم فرض تسجيل دخول:', admin.name);
  return admin;
};

console.log('🛠️ دوال الاختبار الموحدة متاحة:');
console.log('- testUnifiedLogin("admin", "admin123")');
console.log('- showUnifiedEmployees()');
console.log('- forceUnifiedLogin()');
