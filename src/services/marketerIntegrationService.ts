// خدمة التكامل التلقائي للمسوقين بين المتجر الإلكتروني ونظام الإدارة

import { addMarketer, getMarketers, getMarketerById } from './marketerService';
import { addNotification } from './orderService';
import { toast } from 'sonner';

// واجهة بيانات المسوق من المتجر الإلكتروني
export interface StoreMarketerData {
  name: string;
  phone: string;
  email: string;
  storeId?: string; // معرف المسوق في المتجر الإلكتروني
  registrationDate?: string;
  profileImage?: string;
  address?: string;
  nationalId?: string;
  bankAccount?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
  };
}

// واجهة استجابة التكامل
export interface IntegrationResponse {
  success: boolean;
  marketer?: any;
  error?: string;
  message: string;
}

// مفاتيح التخزين
const STORAGE_KEYS = {
  INTEGRATION_LOG: 'afleet_integration_log',
  PENDING_MARKETERS: 'afleet_pending_marketers'
};

// سجل عمليات التكامل
interface IntegrationLog {
  id: string;
  timestamp: string;
  action: 'register' | 'update' | 'sync';
  marketerEmail: string;
  marketerName: string;
  status: 'success' | 'failed' | 'pending';
  details: string;
  storeId?: string;
  adminId?: string;
}

// الحصول على سجل التكامل
export const getIntegrationLog = (): IntegrationLog[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.INTEGRATION_LOG);
  return stored ? JSON.parse(stored) : [];
};

// حفظ سجل التكامل
const saveIntegrationLog = (logs: IntegrationLog[]): void => {
  localStorage.setItem(STORAGE_KEYS.INTEGRATION_LOG, JSON.stringify(logs));
};

// إضافة سجل جديد
const addIntegrationLog = (log: Omit<IntegrationLog, 'id' | 'timestamp'>): void => {
  const logs = getIntegrationLog();
  const newLog: IntegrationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    timestamp: new Date().toISOString()
  };
  
  logs.unshift(newLog); // إضافة في المقدمة
  
  // الاحتفاظ بآخر 100 سجل فقط
  if (logs.length > 100) {
    logs.splice(100);
  }
  
  saveIntegrationLog(logs);
};

// التحقق من وجود مسوق بالبريد الإلكتروني
const isMarketerExists = (email: string): boolean => {
  const marketers = getMarketers();
  return marketers.some(marketer => marketer.email.toLowerCase() === email.toLowerCase());
};

// التحقق من وجود مسوق برقم الهاتف
const isMarketerPhoneExists = (phone: string): boolean => {
  const marketers = getMarketers();
  return marketers.some(marketer => marketer.phone === phone);
};

// تنظيف رقم الهاتف
const cleanPhoneNumber = (phone: string): string => {
  // إزالة المسافات والرموز الخاصة
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // تحويل الأرقام العربية للإنجليزية
  cleaned = cleaned.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  
  // إضافة +20 إذا كان الرقم مصري ولا يحتوي على كود الدولة
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    cleaned = '+20' + cleaned;
  } else if (cleaned.startsWith('201') && cleaned.length === 13) {
    cleaned = '+' + cleaned;
  }
  
  return cleaned;
};

// تسجيل مسوق جديد من المتجر الإلكتروني
export const registerMarketerFromStore = async (storeMarketerData: StoreMarketerData): Promise<IntegrationResponse> => {
  try {
    console.log('🔄 بدء تسجيل مسوق جديد من المتجر:', storeMarketerData);

    // التحقق من صحة البيانات
    if (!storeMarketerData.name || !storeMarketerData.email || !storeMarketerData.phone) {
      const error = 'بيانات المسوق غير مكتملة (الاسم، البريد الإلكتروني، رقم الهاتف مطلوبة)';
      
      addIntegrationLog({
        action: 'register',
        marketerEmail: storeMarketerData.email || 'غير محدد',
        marketerName: storeMarketerData.name || 'غير محدد',
        status: 'failed',
        details: error,
        storeId: storeMarketerData.storeId
      });
      
      return {
        success: false,
        error,
        message: 'فشل في التسجيل: بيانات غير مكتملة'
      };
    }

    // تنظيف رقم الهاتف
    const cleanedPhone = cleanPhoneNumber(storeMarketerData.phone);

    // التحقق من عدم وجود مسوق بنفس البريد الإلكتروني
    if (isMarketerExists(storeMarketerData.email)) {
      const error = `مسوق بنفس البريد الإلكتروني موجود بالفعل: ${storeMarketerData.email}`;
      
      addIntegrationLog({
        action: 'register',
        marketerEmail: storeMarketerData.email,
        marketerName: storeMarketerData.name,
        status: 'failed',
        details: error,
        storeId: storeMarketerData.storeId
      });
      
      return {
        success: false,
        error,
        message: 'فشل في التسجيل: البريد الإلكتروني مستخدم بالفعل'
      };
    }

    // التحقق من عدم وجود مسوق بنفس رقم الهاتف
    if (isMarketerPhoneExists(cleanedPhone)) {
      const error = `مسوق بنفس رقم الهاتف موجود بالفعل: ${cleanedPhone}`;
      
      addIntegrationLog({
        action: 'register',
        marketerEmail: storeMarketerData.email,
        marketerName: storeMarketerData.name,
        status: 'failed',
        details: error,
        storeId: storeMarketerData.storeId
      });
      
      return {
        success: false,
        error,
        message: 'فشل في التسجيل: رقم الهاتف مستخدم بالفعل'
      };
    }

    // إنشاء بيانات المسوق للإدارة
    const adminMarketerData = {
      name: storeMarketerData.name.trim(),
      phone: cleanedPhone,
      email: storeMarketerData.email.toLowerCase().trim(),
      status: 'active' as const,
      commissionRate: 10, // نسبة العمولة الافتراضية
      storeId: storeMarketerData.storeId, // ربط مع معرف المتجر
      registrationSource: 'store', // مصدر التسجيل
      additionalInfo: {
        address: storeMarketerData.address,
        nationalId: storeMarketerData.nationalId,
        bankAccount: storeMarketerData.bankAccount,
        socialMedia: storeMarketerData.socialMedia,
        profileImage: storeMarketerData.profileImage
      }
    };

    // إضافة المسوق في نظام الإدارة
    const newMarketer = addMarketer(adminMarketerData);

    // إضافة إشعار للمديرين
    addNotification({
      id: `marketer-reg-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      userId: 'admin', // للمدير العام
      title: 'مسوق جديد',
      message: `تم تسجيل مسوق جديد: ${newMarketer.name} (${newMarketer.email})`,
      type: 'info',
      read: false,
      createdAt: new Date().toISOString()
    });

    // تسجيل العملية في السجل
    addIntegrationLog({
      action: 'register',
      marketerEmail: newMarketer.email,
      marketerName: newMarketer.name,
      status: 'success',
      details: `تم تسجيل المسوق بنجاح. معرف الإدارة: ${newMarketer.id}`,
      storeId: storeMarketerData.storeId,
      adminId: newMarketer.id
    });

    console.log('✅ تم تسجيل المسوق بنجاح:', {
      adminId: newMarketer.id,
      storeId: storeMarketerData.storeId,
      name: newMarketer.name,
      email: newMarketer.email
    });

    // إظهار رسالة نجاح
    toast.success(`تم تسجيل المسوق ${newMarketer.name} بنجاح في نظام الإدارة`);

    return {
      success: true,
      marketer: newMarketer,
      message: `تم تسجيل المسوق ${newMarketer.name} بنجاح`
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
    
    console.error('❌ خطأ في تسجيل المسوق:', error);
    
    addIntegrationLog({
      action: 'register',
      marketerEmail: storeMarketerData.email || 'غير محدد',
      marketerName: storeMarketerData.name || 'غير محدد',
      status: 'failed',
      details: `خطأ في النظام: ${errorMessage}`,
      storeId: storeMarketerData.storeId
    });

    toast.error(`فشل في تسجيل المسوق: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      message: 'حدث خطأ أثناء تسجيل المسوق'
    };
  }
};

// محاكاة استقبال طلب تسجيل من المتجر الإلكتروني
export const simulateStoreRegistration = async (marketerData: StoreMarketerData): Promise<IntegrationResponse> => {
  console.log('🎭 محاكاة تسجيل مسوق من المتجر الإلكتروني...');
  
  // محاكاة تأخير الشبكة
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return registerMarketerFromStore(marketerData);
};

// الحصول على إحصائيات التكامل
export const getIntegrationStats = () => {
  const logs = getIntegrationLog();
  const today = new Date().toDateString();
  
  return {
    total: logs.length,
    successful: logs.filter(log => log.status === 'success').length,
    failed: logs.filter(log => log.status === 'failed').length,
    pending: logs.filter(log => log.status === 'pending').length,
    todayRegistrations: logs.filter(log => 
      log.action === 'register' && 
      log.status === 'success' && 
      new Date(log.timestamp).toDateString() === today
    ).length,
    recentLogs: logs.slice(0, 10) // آخر 10 عمليات
  };
};

