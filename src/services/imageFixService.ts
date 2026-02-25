// خدمة إصلاح الصور الشاملة لجميع الأقسام

// دالة إصلاح صورة واحدة
const fixSingleImage = (imageUrl: string, fallbackSeed: string = 'default'): string => {
  if (!imageUrl || imageUrl.startsWith('blob:')) {
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${fallbackSeed}`;
  }
  return imageUrl;
};

// إصلاح صور المنتجات
export const fixProductImages = (): void => {
  try {
    console.log('🔧 إصلاح صور المنتجات...');

    const products = localStorage.getItem('products');
    if (products) {
      const productsData = JSON.parse(products);
      let fixed = false;

      const fixedProducts = productsData.map((product: any) => {
        if (product.thumbnail && product.thumbnail.startsWith('blob:')) {
          product.thumbnail = fixSingleImage(product.thumbnail, product.id || product.name || 'product');
          console.log(`✅ إصلاح صورة منتج: ${product.name}`);
          fixed = true;
        }

        // إصلاح صور إضافية إن وجدت
        if (product.images && Array.isArray(product.images)) {
          product.images = product.images.map((img: string, index: number) => {
            if (img.startsWith('blob:')) {
              fixed = true;
              return fixSingleImage(img, `${product.id || product.name}-${index}`);
            }
            return img;
          });
        }

        return product;
      });

      if (fixed) {
        localStorage.setItem('products', JSON.stringify(fixedProducts));
        console.log('✅ تم إصلاح صور المنتجات');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح صور المنتجات:', error);
  }
};

// إصلاح صور الطلبات
export const fixOrderImages = (): void => {
  try {
    console.log('🔧 إصلاح صور الطلبات...');

    const orders = localStorage.getItem('orders');
    if (orders) {
      const ordersData = JSON.parse(orders);
      let fixed = false;

      const fixedOrders = ordersData.map((order: any) => {
        if (order.items && Array.isArray(order.items)) {
          order.items = order.items.map((item: any) => {
            if (item.thumbnail && item.thumbnail.startsWith('blob:')) {
              item.thumbnail = fixSingleImage(item.thumbnail, item.id || item.name || 'order-item');
              console.log(`✅ إصلاح صورة منتج في طلب: ${item.name}`);
              fixed = true;
            }

            // إصلاح صور إضافية في العنصر
            if (item.images && Array.isArray(item.images)) {
              item.images = item.images.map((img: string, index: number) => {
                if (img.startsWith('blob:')) {
                  fixed = true;
                  return fixSingleImage(img, `${item.id || item.name}-${index}`);
                }
                return img;
              });
            }

            return item;
          });
        }
        return order;
      });

      if (fixed) {
        localStorage.setItem('orders', JSON.stringify(fixedOrders));
        console.log('✅ تم إصلاح صور الطلبات');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح صور الطلبات:', error);
  }
};

// إصلاح صور المسوقين
export const fixMarketerImages = (): void => {
  try {
    console.log('🔧 إصلاح صور المسوقين...');

    const marketers = localStorage.getItem('marketers');
    if (marketers) {
      const marketersData = JSON.parse(marketers);
      let fixed = false;

      const fixedMarketers = marketersData.map((marketer: any) => {
        if (marketer.avatar && marketer.avatar.startsWith('blob:')) {
          marketer.avatar = fixSingleImage(marketer.avatar, marketer.id || marketer.name || 'marketer');
          console.log(`✅ إصلاح صورة مسوق: ${marketer.name}`);
          fixed = true;
        }

        if (marketer.photo && marketer.photo.startsWith('blob:')) {
          marketer.photo = fixSingleImage(marketer.photo, marketer.id || marketer.name || 'marketer');
          fixed = true;
        }

        return marketer;
      });

      if (fixed) {
        localStorage.setItem('marketers', JSON.stringify(fixedMarketers));
        console.log('✅ تم إصلاح صور المسوقين');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح صور المسوقين:', error);
  }
};

// إصلاح صور الموظفين
export const fixEmployeeImages = (): void => {
  try {
    console.log('🔧 إصلاح صور الموظفين...');

    const employees = localStorage.getItem('employees');
    if (employees) {
      const employeesData = JSON.parse(employees);
      let fixed = false;

      const fixedEmployees = employeesData.map((employee: any) => {
        if (employee.avatar && employee.avatar.startsWith('blob:')) {
          employee.avatar = fixSingleImage(employee.avatar, employee.id || employee.name || 'employee');
          console.log(`✅ إصلاح صورة موظف: ${employee.name}`);
          fixed = true;
        }

        if (employee.photo && employee.photo.startsWith('blob:')) {
          employee.photo = fixSingleImage(employee.photo, employee.id || employee.name || 'employee');
          fixed = true;
        }

        return employee;
      });

      if (fixed) {
        localStorage.setItem('employees', JSON.stringify(fixedEmployees));
        console.log('✅ تم إصلاح صور الموظفين');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح صور الموظفين:', error);
  }
};

// إصلاح صور الأقسام
export const fixCategoryImages = (): void => {
  try {
    console.log('🔧 إصلاح صور الأقسام...');

    const categories = localStorage.getItem('categories');
    if (categories) {
      const categoriesData = JSON.parse(categories);
      let fixed = false;

      const fixedCategories = categoriesData.map((category: any) => {
        if (category.image && category.image.startsWith('blob:')) {
          category.image = fixSingleImage(category.image, category.id || category.name || 'category');
          console.log(`✅ إصلاح صورة قسم: ${category.name}`);
          fixed = true;
        }

        if (category.thumbnail && category.thumbnail.startsWith('blob:')) {
          category.thumbnail = fixSingleImage(category.thumbnail, category.id || category.name || 'category');
          fixed = true;
        }

        return category;
      });

      if (fixed) {
        localStorage.setItem('categories', JSON.stringify(fixedCategories));
        console.log('✅ تم إصلاح صور الأقسام');
      }
    }
  } catch (error) {
    console.warn('⚠️ خطأ في إصلاح صور الأقسام:', error);
  }
};

// إصلاح شامل لجميع الصور
export const fixAllImages = (): void => {
  console.log('🖼️ بدء الإصلاح الشامل لجميع الصور...');

  fixProductImages();
  fixOrderImages();
  fixMarketerImages();
  fixEmployeeImages();
  fixCategoryImages();

  console.log('✅ تم الإصلاح الشامل لجميع الصور');
};

// إصلاح تلقائي عند تحميل الصفحة
export const autoFixImages = (): void => {
  // تشغيل الإصلاح بعد تحميل الصفحة
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      fixAllImages();
    }, 1000);
  }
};

// إضافة دوال للنافذة للاختبار
if (typeof window !== 'undefined') {
  (window as any).fixAllImages = fixAllImages;
  (window as any).fixProductImages = fixProductImages;
  (window as any).fixOrderImages = fixOrderImages;
  (window as any).fixMarketerImages = fixMarketerImages;
  (window as any).fixEmployeeImages = fixEmployeeImages;
  (window as any).fixCategoryImages = fixCategoryImages;

  console.log('🛠️ دوال إصلاح الصور متاحة:');
  console.log('- fixAllImages() - إصلاح شامل');
  console.log('- fixProductImages() - إصلاح صور المنتجات');
  console.log('- fixOrderImages() - إصلاح صور الطلبات');
  console.log('- fixMarketerImages() - إصلاح صور المسوقين');
}

// إصلاح فوري عند تحميل الملف
console.log('🚀 بدء الإصلاح الفوري للصور...');
fixAllImages();

// إصلاح دوري كل 5 ثواني
// setInterval(() => {
//   fixAllImages();
// }, 5000);

// إصلاح عند تغيير localStorage
const originalSetItem = localStorage.setItem;
localStorage.setItem = function (key: string, value: string) {
  originalSetItem.call(this, key, value);

  // إصلاح فوري بعد حفظ البيانات
  setTimeout(() => {
    if (['products', 'orders', 'marketers', 'categories', 'employees'].includes(key)) {
      console.log(`🔧 إصلاح تلقائي بعد تحديث ${key}`);
      fixAllImages();
    }
  }, 100);
};

console.log('✅ تم تفعيل الإصلاح التلقائي الشامل');
