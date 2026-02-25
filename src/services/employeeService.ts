import { Employee, SystemSection, DEFAULT_ROLES } from "@/types/employeeTypes";
import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";
import { DEFAULT_PERMISSIONS } from "@/types/employee";

// مفاتيح التخزين المحلي (ONLY SessionStorage - NO localStorage)
const STORAGE_KEYS = {
  CURRENT_EMPLOYEE: "current_employee",
};


const getStoredEmployees = async (): Promise<Employee[]> => {
  try {
    const data = await fetchJson(`${API_URL}/employees`);
    return data || [];
  } catch {
    return [];
  }
}

// No longer using saveStoredEmployees loop - using direct REST calls below

// بيانات الموظفين الافتراضية
const defaultEmployees: Employee[] = [
  {
    id: "emp-1",
    name: "أحمد محمد",
    email: "admin@afleet.com",
    password: "admin123",
    phone: "01012345678",
    role: "admin",
    accessibleSections: DEFAULT_ROLES.admin.sections,
    isActive: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp-2",
    name: "محمد علي",
    email: "sales@afleet.com",
    password: "sales123",
    phone: "01112345678",
    role: "sales",
    accessibleSections: DEFAULT_ROLES.sales.sections,
    isActive: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp-3",
    name: "سارة أحمد",
    email: "warehouse@afleet.com",
    password: "warehouse123",
    phone: "01212345678",
    role: "warehouse",
    accessibleSections: DEFAULT_ROLES.warehouse.sections,
    isActive: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp-4",
    name: "خالد محمود",
    email: "shipping@afleet.com",
    password: "shipping123",
    phone: "01312345678",
    role: "shipping",
    accessibleSections: DEFAULT_ROLES.shipping.sections,
    isActive: true,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: "emp-5",
    name: "فاطمة علي",
    email: "delivery@afleet.com",
    password: "delivery123",
    phone: "01412345678",
    role: "delivery",
    accessibleSections: DEFAULT_ROLES.delivery.sections,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

// إعادة تعيين بيانات الموظفين (للتطوير)
export const resetEmployeesData = async (): Promise<void> => {
  console.log('🔄 بدء إعادة تعيين بيانات الموظفين (API)...');
  // Logic updated to only handle defaults individually if needed
  for (const emp of defaultEmployees) {
    await addEmployee(emp);
  }
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_EMPLOYEE);
  console.log("🔄 تم إعادة تعيين بيانات الموظفين");
};

// مسح sessionStorage بالكامل (للتطوير)
export const clearAllData = (): void => {
  console.log('🗑️ مسح جميع بيانات الجلسة...');
  sessionStorage.clear();
  console.log('🗑️ تم مسح جميع البيانات');
  location.reload();
};

// تهيئة بيانات الموظفين
export const initializeEmployees = async (): Promise<void> => {
  console.log('🔄 بدء تهيئة بيانات الموظفين...');

  const storedEmployees = await getStoredEmployees();
  if (!storedEmployees || storedEmployees.length === 0) {
    console.log('📝 حفظ البيانات الافتراضية إلى API...');
    for (const emp of defaultEmployees) {
      await addEmployee(emp);
    }
  } else {
    console.log('🔍 البيانات موجودة في API');
  }
};

// الحصول على جميع الموظفين
export const getEmployees = async (): Promise<Employee[]> => {
  const employees = await getStoredEmployees();
  // Fallback if API returns empty but we expect defaults (handled in init, but safe to check)
  if (!employees || employees.length === 0) {
    return defaultEmployees;
  }
  return employees;
};

// الحصول على موظف بواسطة المعرف
export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
  const employees = await getEmployees();
  return employees.find((employee) => employee.id === id);
};

// الحصول على موظف بواسطة البريد الإلكتروني
export const getEmployeeByEmail = async (email: string): Promise<Employee | undefined> => {
  const employees = await getEmployees();
  return employees.find((employee) => employee.email === email);
};

// الحصول على موظف بواسطة الاسم
export const getEmployeeByName = async (name: string): Promise<Employee | undefined> => {
  const employees = await getEmployees();
  return employees.find((employee) => employee.name.toLowerCase() === name.toLowerCase());
};

// الحصول على موظف بواسطة الاسم أو الإيميل
export const getEmployeeByNameOrEmail = async (identifier: string): Promise<Employee | undefined> => {
  const employees = await getEmployees();
  const lowerIdentifier = identifier.toLowerCase().trim();

  // البحث بالإيميل أولاً
  let employee = employees.find((emp) => emp.email.toLowerCase() === lowerIdentifier);

  // إذا لم يوجد، ابحث بالاسم
  if (!employee) {
    employee = employees.find((emp) => emp.name.toLowerCase() === lowerIdentifier);
  }

  return employee;
};

// إضافة موظف جديد
export const addEmployee = async (employee: Omit<Employee, "id" | "createdAt">): Promise<Employee> => {
  const employees = await getEmployees();

  // التحقق من عدم وجود موظف بنفس البريد الإلكتروني
  const existingEmployee = employees.find((emp) => emp.email === employee.email);
  if (existingEmployee) {
    throw new Error("البريد الإلكتروني مستخدم بالفعل");
  }

  // إنشاء موظف جديد
  const newEmployee: Employee = {
    ...employee,
    id: `emp-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  // إرسال الموظف الجديد فقط للسيرفر
  return await fetchJson(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newEmployee)
  });
};

// تحديث بيانات موظف
export const updateEmployee = async (id: string, data: Partial<Employee>): Promise<Employee | null> => {
  const employees = await getEmployees();
  const index = employees.findIndex((employee) => employee.id === id);

  if (index === -1) {
    return null;
  }

  // التحقق من عدم وجود موظف آخر بنفس البريد الإلكتروني
  if (data.email && data.email !== employees[index].email) {
    const existingEmployee = employees.find((emp) => emp.email === data.email);
    if (existingEmployee) {
      throw new Error("البريد الإلكتروني مستخدم بالفعل");
    }
  }

  // إرسال التعديل للموظف الحالي فقط
  return await fetchJson(`${API_URL}/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, id })
  });
};

// حذف موظف
export const deleteEmployee = async (id: string): Promise<boolean> => {
  const employees = await getEmployees();

  // العثور على الموظف المراد حذفه
  const employeeToDelete = employees.find(emp => emp.id === id);

  if (!employeeToDelete) {
    console.error('❌ لم يتم العثور على الموظف');
    return false;
  }

  // حماية مدير النظام من الحذف
  if (employeeToDelete.role === 'admin' && employeeToDelete.email === 'admin@afleet.com') {
    throw new Error('لا يمكن حذف مدير النظام الرئيسي');
  }

  // التحقق من أنه ليس آخر مدير في النظام
  const adminCount = employees.filter(emp => emp.role === 'admin' && emp.isActive).length;
  if (employeeToDelete.role === 'admin' && adminCount <= 1) {
    throw new Error('لا يمكن حذف آخر مدير في النظام. يجب وجود مدير واحد على الأقل');
  }

  // حذف من السيرفر مباشرة عبر المعرف
  await fetchJson(`${API_URL}/employees/${id}`, {
    method: 'DELETE'
  });
  console.log(`✅ تم حذف الموظف: ${id}`);
  return true;
};

// التحقق من إمكانية حذف موظف
export const canDeleteEmployee = async (id: string): Promise<{ canDelete: boolean; reason?: string }> => {
  const employees = await getEmployees();
  const employeeToCheck = employees.find(emp => emp.id === id);

  if (!employeeToCheck) {
    return { canDelete: false, reason: 'الموظف غير موجود' };
  }

  // حماية مدير النظام الرئيسي
  if (employeeToCheck.role === 'admin' && employeeToCheck.email === 'admin@afleet.com') {
    return { canDelete: false, reason: 'لا يمكن حذف مدير النظام الرئيسي' };
  }

  // التحقق من أنه ليس آخر مدير
  const adminCount = employees.filter(emp => emp.role === 'admin' && emp.isActive).length;
  if (employeeToCheck.role === 'admin' && adminCount <= 1) {
    return { canDelete: false, reason: 'لا يمكن حذف آخر مدير في النظام' };
  }

  return { canDelete: true };
};


// تسجيل دخول موظف (بالاسم أو الإيميل)
export const loginEmployee = async (identifier: string, password: string): Promise<Employee | null> => {
  console.log('🔍 بدء عملية تسجيل الدخول عبر الخادم:', identifier);

  try {
    const res = await fetchJson(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password })
    });

    // AuthContext now handles token storage. We just return the user object.
    const employee = res.user || res;
    console.log('✅ تسجيل دخول ناجح للموظف:', employee.name);
    return employee;
  } catch (error) {
    console.error('❌ خطأ في تسجيل الدخول:', error);
    return null;
  }
};

// تسجيل خروج الموظف الحالي
export const logoutEmployee = (): void => {
  // No-op: handled by AuthContext and Cookies
};

// تحديث وقت آخر نشاط للموظف
import { toast } from "sonner";

// ... existing code ...

export const sendHeartbeat = async (employeeId: string, page?: string, actionType?: string): Promise<void> => {
  try {
    // console.log(`💓 Sending heartbeat for ${employeeId} on ${page}`);
    await fetchJson(`${API_URL}/employees/heartbeat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: employeeId,
        page,
        actionType
      }),
    });
  } catch (error) {
    console.error("Heartbeat failed", error);
  }
};

// الحصول على الموظف الحالي
export const getCurrentEmployee = (): Employee | null => {
  // No-op: handled by AuthContext
  return null;
};

// تعيين الموظف الحالي
export const setCurrentEmployee = (employee: Employee): void => {
  // No-op
};

// التحقق من صلاحيات الموظف (Sync version - relying on passed object, doesn't need API)
export const hasPermission = (
  employee: Employee | null,
  section: string,
  action: string = "view"
): boolean => {
  if (!employee) {
    return false;
  }

  // المدير لديه جميع الصلاحيات
  if (employee.role === "admin") {
    return true;
  }

  // تحويل بعض أسماء الأقسام الخاصة
  const sectionMapping: Record<string, string> = {
    "shipping-settings": "shipping", // إعدادات الشحن تندرج تحت قسم الشحن
    "delivery": "shipping", // التوصيل يندرج تحت قسم الشحن
    "archive": "orders", // الأرشيف يندرج تحت قسم الطلبات
    // يمكن إضافة المزيد من التحويلات هنا
  };

  // استخدام القسم المعدل إذا كان موجودًا في التعيين
  const mappedSection = sectionMapping[section] || section;

  // التحقق من وجود الصلاحيات
  if (employee.permissions) {
    // البحث عن القسم في صلاحيات الموظف
    const sectionPermission = employee.permissions.find(
      (permission) => permission.section === mappedSection
    );

    // التحقق من وجود الإجراء في صلاحيات القسم
    if (sectionPermission) {
      return sectionPermission.actions.includes(action as any);
    }
  }

  // التحقق من القسم في accessibleSections (للتوافق مع الإصدارات القديمة)
  if (employee.accessibleSections) {
    return employee.accessibleSections.includes(mappedSection as SystemSection);
  }

  return false;
};
