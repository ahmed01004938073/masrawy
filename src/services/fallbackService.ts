import fallbackData from '@/data/fallback-data.json';

// التحقق من دعم localStorage
const isLocalStorageSupported = (): boolean => {
  try {
    const test = 'localStorage-test';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    console.warn('⚠️ localStorage غير مدعوم أو معطل');
    return false;
  }
};

// متغير لتتبع حالة localStorage
const localStorageEnabled = isLocalStorageSupported();

// خدمة التخزين المختلطة (localStorage + JSON fallback)
export class FallbackStorageService {
  private static memoryStorage: { [key: string]: any } = {};

  // قراءة البيانات
  static getItem(key: string): string | null {
    // محاولة قراءة من localStorage أولاً
    if (localStorageEnabled) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) {
          console.log(`✅ تم قراءة ${key} من localStorage`);

          // إصلاح مشكلة blob URLs في المنتجات
          if (key === 'products') {
            try {
              const products = JSON.parse(value);
              const fixedProducts = products.map((product: any) => {
                if (product.thumbnail && product.thumbnail.startsWith('blob:')) {
                  // استبدال blob URLs بصور آمنة
                  product.thumbnail = `https://api.dicebear.com/7.x/shapes/svg?seed=${product.id || 'product'}`;
                  console.log(`🔧 تم إصلاح صورة المنتج: ${product.name}`);
                }
                return product;
              });
              return JSON.stringify(fixedProducts);
            } catch (parseError) {
              console.warn('⚠️ خطأ في تحليل بيانات المنتجات:', parseError);
            }
          }

          return value;
        }
      } catch (error) {
        console.warn(`⚠️ فشل في قراءة ${key} من localStorage:`, error);
      }
    }

    // قراءة من الذاكرة المؤقتة
    if (this.memoryStorage[key]) {
      console.log(`💾 تم قراءة ${key} من الذاكرة المؤقتة`);
      return this.memoryStorage[key];
    }

    // قراءة من البيانات الاحتياطية
    if (key in fallbackData) {
      const value = JSON.stringify((fallbackData as any)[key]);
      console.log(`📄 تم قراءة ${key} من البيانات الاحتياطية`);
      return value;
    }

    console.log(`❌ لم يتم العثور على ${key} في أي مكان`);
    return null;
  }

  // حفظ البيانات
  static setItem(key: string, value: string): void {
    // محاولة حفظ في localStorage أولاً
    if (localStorageEnabled) {
      try {
        localStorage.setItem(key, value);
        console.log(`✅ تم حفظ ${key} في localStorage`);
        return;
      } catch (error) {
        console.warn(`⚠️ فشل في حفظ ${key} في localStorage:`, error);
      }
    }

    // حفظ في الذاكرة المؤقتة كبديل
    this.memoryStorage[key] = value;
    console.log(`💾 تم حفظ ${key} في الذاكرة المؤقتة`);
  }

  // حذف البيانات
  static removeItem(key: string): void {
    if (localStorageEnabled) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`⚠️ فشل في حذف ${key} من localStorage:`, error);
      }
    }

    delete this.memoryStorage[key];
    console.log(`🗑️ تم حذف ${key}`);
  }

  // مسح جميع البيانات
  static clear(): void {
    if (localStorageEnabled) {
      try {
        localStorage.clear();
      } catch (error) {
        console.warn('⚠️ فشل في مسح localStorage:', error);
      }
    }

    this.memoryStorage = {};
    console.log('🗑️ تم مسح جميع البيانات');
  }

  // التحقق من وجود مفتاح
  static hasItem(key: string): boolean {
    return this.getItem(key) !== null;
  }

  // الحصول على حالة التخزين
  static getStorageStatus(): {
    localStorage: boolean;
    memoryStorage: number;
    fallbackData: boolean;
  } {
    return {
      localStorage: localStorageEnabled,
      memoryStorage: Object.keys(this.memoryStorage).length,
      fallbackData: Object.keys(fallbackData).length > 0
    };
  }
}

// دوال مساعدة للتوافق مع الكود الحالي
export const getStorageItem = (key: string): string | null => {
  return FallbackStorageService.getItem(key);
};

export const setStorageItem = (key: string, value: string): void => {
  FallbackStorageService.setItem(key, value);
};

export const removeStorageItem = (key: string): void => {
  FallbackStorageService.removeItem(key);
};

// تهيئة البيانات الأساسية
export const initializeFallbackData = (): void => {
  console.log('🔄 تهيئة نظام التخزين الاحتياطي...');
  
  const status = FallbackStorageService.getStorageStatus();
  console.log('📊 حالة التخزين:', status);

  // تهيئة البيانات الأساسية إذا لم تكن موجودة
  const essentialKeys = ['employees', 'companySettings'];
  
  essentialKeys.forEach(key => {
    if (!FallbackStorageService.hasItem(key)) {
      console.log(`🔧 تهيئة ${key}...`);
      const data = (fallbackData as any)[key];
      if (data) {
        FallbackStorageService.setItem(key, JSON.stringify(data));
      }
    }
  });

  console.log('✅ تم تهيئة نظام التخزين الاحتياطي');
};

// دالة للتطوير - عرض حالة التخزين
(window as any).showStorageStatus = () => {
  const status = FallbackStorageService.getStorageStatus();
  console.log('📊 حالة التخزين:', status);
  console.log('💾 البيانات في الذاكرة:', Object.keys(FallbackStorageService.memoryStorage));
  return status;
};

// دالة للتطوير - فرض استخدام البيانات الاحتياطية
(window as any).useFallbackData = () => {
  console.log('🔧 فرض استخدام البيانات الاحتياطية...');
  Object.keys(fallbackData).forEach(key => {
    const data = (fallbackData as any)[key];
    FallbackStorageService.setItem(key, JSON.stringify(data));
  });
  console.log('✅ تم تحميل البيانات الاحتياطية');
  location.reload();
};
