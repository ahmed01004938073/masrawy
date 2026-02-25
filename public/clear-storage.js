// سكريبت تنظيف localStorage
console.log("🧹 بدء تنظيف localStorage...");

// فحص الحجم الحالي
let totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length;
  }
}

console.log(`📊 الحجم الحالي: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// قائمة المفاتيح المهمة
const importantKeys = [
  'categories',
  'products', 
  'employees',
  'marketers',
  'orders',
  'settings',
  'auth'
];

// حذف المفاتيح غير المهمة
let removedCount = 0;
const keysToRemove = [];

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && !importantKeys.some(important => key.includes(important))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  localStorage.removeItem(key);
  removedCount++;
  console.log(`🗑️ تم حذف: ${key}`);
});

// فحص الحجم بعد التنظيف
totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length;
  }
}

console.log(`✅ تم تنظيف ${removedCount} مفتاح`);
console.log(`📊 الحجم بعد التنظيف: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

// إذا كان الحجم لا يزال كبير، اضغط الصور
if (totalSize > 3 * 1024 * 1024) { // أكبر من 3MB
  console.log("🗜️ ضغط الصور الكبيرة...");
  
  // ضغط صور الأقسام
  const categories = localStorage.getItem('categories');
  if (categories) {
    try {
      const categoriesData = JSON.parse(categories);
      const compressedCategories = categoriesData.map(cat => {
        if (cat.imageUrl && cat.imageUrl.startsWith('data:')) {
          // استبدال الصور الكبيرة بصور افتراضية
          cat.imageUrl = `https://placehold.co/300x200/3b82f6/ffffff?text=${encodeURIComponent(cat.name)}`;
          console.log(`🖼️ تم ضغط صورة القسم: ${cat.name}`);
        }
        return cat;
      });
      localStorage.setItem('categories', JSON.stringify(compressedCategories));
    } catch (error) {
      console.error("❌ خطأ في ضغط صور الأقسام:", error);
    }
  }
  
  // ضغط صور المنتجات
  const products = localStorage.getItem('products');
  if (products) {
    try {
      const productsData = JSON.parse(products);
      const compressedProducts = productsData.map(product => {
        if (product.thumbnail && product.thumbnail.startsWith('data:')) {
          // استبدال الصور الكبيرة بصور افتراضية
          product.thumbnail = `https://api.dicebear.com/7.x/shapes/svg?seed=${product.id}`;
          console.log(`🖼️ تم ضغط صورة المنتج: ${product.name}`);
        }
        return product;
      });
      localStorage.setItem('products', JSON.stringify(compressedProducts));
    } catch (error) {
      console.error("❌ خطأ في ضغط صور المنتجات:", error);
    }
  }
}

// فحص نهائي
totalSize = 0;
for (let key in localStorage) {
  if (localStorage.hasOwnProperty(key)) {
    totalSize += localStorage[key].length;
  }
}

console.log(`🎉 التنظيف مكتمل! الحجم النهائي: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

if (totalSize < 4 * 1024 * 1024) {
  console.log("✅ localStorage جاهز للاستخدام!");
} else {
  console.log("⚠️ localStorage لا يزال ممتلئ. قد تحتاج لحذف بيانات إضافية.");
}
