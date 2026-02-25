import { addWithdrawal, getMarketers } from "../services/marketerService";

// الحصول على المسوقين
const marketers = getMarketers();

// إضافة طلبات سحب للمسوقين
export const addWithdrawalRequests = () => {
  // التحقق من وجود المسوقين
  if (marketers.length === 0) {
    console.error("لا يوجد مسوقين في النظام");
    return;
  }

  // إضافة طلب سحب للمسوق الأول (محمد علي)
  const marketer1 = marketers.find(m => m.id === "m1");
  if (marketer1) {
    const withdrawal1 = addWithdrawal({
      marketerId: marketer1.id,
      amount: 1000,
      method: "wallet",
      status: "pending",
      notes: "سحب إلى محفظة فودافون كاش - رقم: 01012345678",
    });
    console.log("تم إضافة طلب سحب للمسوق:", marketer1.name, withdrawal1);
  }

  // إضافة طلب سحب للمسوق الثاني (فاطمة حسن)
  const marketer2 = marketers.find(m => m.id === "m2");
  if (marketer2) {
    const withdrawal2 = addWithdrawal({
      marketerId: marketer2.id,
      amount: 500,
      method: "wallet",
      status: "pending",
      notes: "سحب إلى محفظة فودافون كاش - رقم: 01112345678",
    });
    console.log("تم إضافة طلب سحب للمسوق:", marketer2.name, withdrawal2);
  }

  // إضافة طلب سحب للمسوق الثالث (أحمد محمود)
  const marketer3 = marketers.find(m => m.id === "m3");
  if (marketer3) {
    const withdrawal3 = addWithdrawal({
      marketerId: marketer3.id,
      amount: 300,
      method: "wallet",
      status: "pending",
      notes: "سحب إلى محفظة فودافون كاش - رقم: 01212345678",
    });
    console.log("تم إضافة طلب سحب للمسوق:", marketer3.name, withdrawal3);
  }

  // إضافة طلب سحب للمسوق الرابع (سارة خالد)
  const marketer4 = marketers.find(m => m.id === "m4");
  if (marketer4) {
    const withdrawal4 = addWithdrawal({
      marketerId: marketer4.id,
      amount: 1500,
      method: "wallet",
      status: "pending",
      notes: "سحب إلى محفظة فودافون كاش - رقم: 01512345678",
    });
    console.log("تم إضافة طلب سحب للمسوق:", marketer4.name, withdrawal4);
  }

  // إضافة طلب سحب للمسوق الخامس (خالد عبد الله)
  const marketer5 = marketers.find(m => m.id === "m5");
  if (marketer5) {
    const withdrawal5 = addWithdrawal({
      marketerId: marketer5.id,
      amount: 800,
      method: "wallet",
      status: "pending",
      notes: "سحب إلى محفظة فودافون كاش - رقم: 01612345678",
    });
    console.log("تم إضافة طلب سحب للمسوق:", marketer5.name, withdrawal5);
  }

  console.log("تم إضافة طلبات السحب بنجاح");
};

// تنفيذ الوظيفة
addWithdrawalRequests();
