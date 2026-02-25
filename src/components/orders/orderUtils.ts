
import { OrderStatus } from "@/pages/Orders";

// Helper function to translate status to Arabic
export const translateStatus = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "قيد الانتظار";
    case "confirmed":
      return "تم التأكيد";
    case "processing":
      return "قيد التجهيز";
    case "shipped":
      return "تم الشحن";
    case "delivered":
      return "تم التسليم";
    case "cancelled":
      return "ملغي";
    case "suspended":
      return "معلق";
    default:
      return status;
  }
};

// Helper function to get status badge color
export const getStatusBadgeColor = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "confirmed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "processing":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "suspended":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

// Helper function to translate payment method to Arabic
export const translatePaymentMethod = (method: string) => {
  switch (method) {
    case "cash":
      return "الدفع عند الاستلام";
    case "card":
      return "بطاقة ائتمان";
    case "bank_transfer":
      return "تحويل بنكي";
    default:
      return method;
  }
};

// Shipping rates by province
export const shippingRates: Record<string, number> = {
  "القاهرة": 50,
  "الإسكندرية": 75,
  "الجيزة": 60,
  "الشرقية": 80,
  "القليوبية": 70,
  "الدقهلية": 85,
  "البحيرة": 90,
  "المنيا": 100,
  "أسيوط": 110,
  "سوهاج": 120,
  "أسوان": 130,
  "الأقصر": 125,
  "بورسعيد": 90,
  "الإسماعيلية": 95,
  "السويس": 85,
  "كفر الشيخ": 90
};

// Calculate commission based on product type and total price
export const calculateCommission = (item: { productId: string; price: number }, quantity: number = 1): number => {
  // يمكن تحديد العمولة حسب المنتج من خلال معرف المنتج
  const commissionRates: { [key: string]: number } = {
    // أمثلة لمعدلات العمولة المختلفة حسب المنتج (نسبة مئوية)
    'default': 0.05,  // 5% عمولة افتراضية
    'premium': 0.08,  // 8% عمولة أعلى للمنتجات المميزة
    'economy': 0.03   // 3% عمولة أقل للمنتجات الاقتصادية
  };

  // يمكن تحديد نوع المنتج من خلال معرف المنتج
  const productType = item.productId.startsWith('premium') ? 'premium' :
                      item.productId.startsWith('economy') ? 'economy' : 'default';

  // حساب العمولة كنسبة مئوية من السعر الإجمالي
  return item.price * commissionRates[productType];
};
