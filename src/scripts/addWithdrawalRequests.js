// Importar las funciones necesarias
import { addWithdrawal, getMarketers } from "../services/marketerService.js";

// Función para agregar solicitudes de retiro
function addWithdrawalRequests() {
  // Obtener los comercializadores
  const marketers = getMarketers();

  // Verificar si hay comercializadores
  if (marketers.length === 0) {
    console.error("No hay comercializadores en el sistema");
    return;
  }

  // Agregar solicitud de retiro para el primer comercializador (محمد علي)
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

  // Agregar solicitud de retiro para el segundo comercializador (فاطمة حسن)
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

  // Agregar solicitud de retiro para el tercer comercializador (أحمد محمود)
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

  console.log("تم إضافة طلبات السحب بنجاح");
}

// Ejecutar la función
addWithdrawalRequests();
