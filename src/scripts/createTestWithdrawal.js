// استيراد الوظائف المطلوبة
import { addWithdrawal, getMarketers } from '../services/marketerService.js';

// وظيفة لإنشاء طلب سحب تجريبي
function createTestWithdrawal() {
  // الحصول على المسوقين
  const marketers = getMarketers();
  
  // التحقق من وجود مسوقين
  if (marketers.length === 0) {
    console.error("لا يوجد مسوقين في النظام");
    return null;
  }
  
  // اختيار المسوق الثاني (فاطمة حسن)
  const marketer = marketers.find(m => m.id === "m2");
  
  if (!marketer) {
    console.error("لم يتم العثور على المسوق");
    return null;
  }
  
  // إنشاء طلب سحب جديد
  const withdrawal = addWithdrawal({
    marketerId: marketer.id,
    amount: 500,
    method: "wallet",
    status: "pending",
    notes: "سحب إلى محفظة فودافون كاش - رقم: 01112345678",
  });
  
  console.log("تم إنشاء طلب سحب جديد:", withdrawal);
  return withdrawal;
}

// تنفيذ الوظيفة
createTestWithdrawal();
