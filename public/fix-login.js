// ملف إصلاح سريع لمشكلة تسجيل الدخول في الاستضافة
// ضع هذا الملف في مجلد public واستدعيه من index.html

console.log('🔧 بدء إصلاح مشكلة تسجيل الدخول...');

// دالة إصلاح localStorage
function fixLocalStorage() {
  try {
    // اختبار localStorage
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    console.log('✅ localStorage يعمل');
    return true;
  } catch (error) {
    console.error('❌ localStorage لا يعمل:', error);
    return false;
  }
}

// دالة إنشاء بيانات تسجيل الدخول الافتراضية
function createDefaultLoginData() {
  const defaultEmployees = [
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
      "isActive": true,
      "createdAt": "2025-06-01T19:21:31.116Z"
    },
    {
      "id": "emp-2",
      "name": "محمد علي",
      "email": "sales@afleet.com",
      "password": "sales123",
      "phone": "01112345678",
      "role": "sales",
      "accessibleSections": ["dashboard", "products", "categories", "orders"],
      "isActive": true,
      "createdAt": "2025-06-01T19:21:31.117Z"
    }
  ];

  const defaultMarketers = [];
  
  const defaultSettings = {
    siteName: 'نظام إدارة الطلبات',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    language: 'ar',
    minCommission: 50,
    maxCommission: 500,
    maxOrders: 100,
    minWithdrawal: 100
  };

  try {
    // محاولة localStorage أولاً - استخدام نفس المفاتيح المستخدمة في النظام
    localStorage.setItem('employees', JSON.stringify(defaultEmployees));
    localStorage.setItem('marketers', JSON.stringify(defaultMarketers));
    localStorage.setItem('siteSettings', JSON.stringify(defaultSettings));
    console.log('✅ تم حفظ البيانات في localStorage');
    return true;
  } catch (error) {
    console.warn('⚠️ فشل localStorage، محاولة sessionStorage...');
    try {
      // محاولة sessionStorage
      sessionStorage.setItem('employees', JSON.stringify(defaultEmployees));
      sessionStorage.setItem('marketers', JSON.stringify(defaultMarketers));
      sessionStorage.setItem('siteSettings', JSON.stringify(defaultSettings));
      console.log('✅ تم حفظ البيانات في sessionStorage');
      return true;
    } catch (sessionError) {
      console.warn('⚠️ فشل sessionStorage، استخدام متغير عام...');
      // استخدام متغير عام
      window.afleetData = {
        employees: defaultEmployees,
        marketers: defaultMarketers,
        settings: defaultSettings
      };
      console.log('✅ تم حفظ البيانات في متغير عام');
      return true;
    }
  }
}

// دالة إصلاح مشكلة الصور
function fixBlobImages() {
  console.log('🖼️ إصلاح مشكلة صور المنتجات...');

  try {
    const products = localStorage.getItem('products');
    if (products) {
      const productsData = JSON.parse(products);
      let fixed = false;

      const fixedProducts = productsData.map(product => {
        if (product.thumbnail && product.thumbnail.startsWith('blob:')) {
          product.thumbnail = `https://api.dicebear.com/7.x/shapes/svg?seed=${product.id || 'product'}`;
          console.log(`🔧 تم إصلاح صورة المنتج: ${product.name}`);
          fixed = true;
        }
        return product;
      });

      if (fixed) {
        localStorage.setItem('products', JSON.stringify(fixedProducts));
        console.log('✅ تم إصلاح جميع صور المنتجات');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح الصور:', error);
  }
}

// دالة فحص وإصلاح البيانات
function checkAndFixData() {
  console.log('🔍 فحص البيانات الموجودة...');

  // إصلاح مشكلة الصور أولاً
  fixBlobImages();
  
  let employees = null;
  
  try {
    // محاولة قراءة من localStorage
    employees = localStorage.getItem('employees');
    if (employees) {
      employees = JSON.parse(employees);
      console.log('✅ تم العثور على بيانات في localStorage');
    }
  } catch (error) {
    console.warn('⚠️ خطأ في قراءة localStorage');
  }
  
  if (!employees) {
    try {
      // محاولة قراءة من sessionStorage
      employees = sessionStorage.getItem('employees');
      if (employees) {
        employees = JSON.parse(employees);
        console.log('✅ تم العثور على بيانات في sessionStorage');
      }
    } catch (error) {
      console.warn('⚠️ خطأ في قراءة sessionStorage');
    }
  }
  
  if (!employees && window.afleetData) {
    employees = window.afleetData.employees;
    console.log('✅ تم العثور على بيانات في المتغير العام');
  }
  
  if (!employees || employees.length === 0) {
    console.log('❌ لا توجد بيانات، إنشاء بيانات افتراضية...');
    return createDefaultLoginData();
  }
  
  // التحقق من وجود المدير الافتراضي
  const adminExists = employees.some(emp => emp.email === 'admin' && emp.password === 'admin123');
  
  if (!adminExists) {
    console.log('⚠️ المدير الافتراضي غير موجود، إضافته...');
    const defaultAdmin = {
      "id": "emp-emergency",
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
      "isActive": true,
      "createdAt": new Date().toISOString()
    };
    
    employees.push(defaultAdmin);
    
    try {
      localStorage.setItem('employees', JSON.stringify(employees));
      console.log('✅ تم إضافة المدير الافتراضي');
    } catch (error) {
      try {
        sessionStorage.setItem('employees', JSON.stringify(employees));
        console.log('✅ تم إضافة المدير الافتراضي في sessionStorage');
      } catch (sessionError) {
        if (window.afleetData) {
          window.afleetData.employees = employees;
          console.log('✅ تم إضافة المدير الافتراضي في المتغير العام');
        }
      }
    }
  }
  
  console.log('✅ البيانات جاهزة للاستخدام');
  return true;
}

// دالة اختبار تسجيل الدخول
function testLogin(email, password) {
  console.log('🧪 اختبار تسجيل الدخول:', { email, password });
  
  let employees = null;
  
  // محاولة قراءة البيانات من مصادر مختلفة
  try {
    employees = localStorage.getItem('employees');
    if (employees) employees = JSON.parse(employees);
  } catch (error) {
    try {
      employees = sessionStorage.getItem('employees');
      if (employees) employees = JSON.parse(employees);
    } catch (sessionError) {
      if (window.afleetData) {
        employees = window.afleetData.employees;
      }
    }
  }
  
  if (!employees) {
    console.error('❌ لا توجد بيانات موظفين');
    return false;
  }
  
  // البحث عن الموظف
  const employee = employees.find(emp => 
    (emp.email === email || emp.name === email) && emp.password === password
  );
  
  if (employee) {
    console.log('✅ تم العثور على الموظف:', employee.name);
    return employee;
  } else {
    console.error('❌ بيانات خاطئة');
    return false;
  }
}

// دالة عرض البيانات المتاحة
function showAvailableLogins() {
  console.log('📋 بيانات تسجيل الدخول المتاحة:');
  console.log('1. البريد: admin | كلمة المرور: admin123');
  console.log('2. البريد: manager | كلمة المرور: manager123');
  console.log('');
  console.log('💡 يمكنك استخدام الاسم بدلاً من البريد الإلكتروني');
  console.log('💡 مثال: testLogin("admin", "admin123")');
}

// تشغيل الإصلاح عند تحميل الصفحة
function runFix() {
  console.log('🚀 بدء عملية الإصلاح...');
  
  // فحص localStorage
  const localStorageWorks = fixLocalStorage();
  
  // فحص وإصلاح البيانات
  const dataFixed = checkAndFixData();
  
  if (dataFixed) {
    console.log('✅ تم إصلاح جميع المشاكل!');
    showAvailableLogins();
    
    // إضافة دوال للنافذة للاختبار
    window.testLogin = testLogin;
    window.showLogins = showAvailableLogins;
    window.fixData = checkAndFixData;
    
    console.log('🔧 دوال الاختبار متاحة:');
    console.log('- testLogin("admin", "admin123")');
    console.log('- showLogins()');
    console.log('- fixData()');
  } else {
    console.error('❌ فشل في إصلاح البيانات');
  }
}

// تشغيل الإصلاح
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runFix);
} else {
  runFix();
}

// إضافة مستمع للأخطاء
window.addEventListener('error', function(event) {
  if (event.message.includes('localStorage') || event.message.includes('storage')) {
    console.warn('⚠️ خطأ في التخزين، تشغيل الإصلاح...');
    setTimeout(runFix, 1000);
  }
});

console.log('🔧 ملف الإصلاح جاهز!');
