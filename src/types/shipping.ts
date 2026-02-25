// أنواع بيانات الشحن

// نوع بيانات شركة الشحن
export interface ShippingCompany {
  id: string;
  name: string;
  phone: string; // رقم الهاتف العادي
  address: string;
  website?: string; // موقع الشركة (اختياري)
  whatsapp?: string; // رقم الواتساب للطلبات (اختياري)
  email?: string; // البريد الإلكتروني (اختياري)
  isActive?: boolean; // حالة النشاط (اختياري)
  balance?: number;
  deliveredOrders?: number;
  rejectedOrders?: number;
  createdAt: string;
  updatedAt?: string;
  shippingZones?: ShippingZone[];
  coverageAreas?: CoverageArea[];
  returnedProducts?: number;
}

// نوع بيانات منطقة الشحن
export interface ShippingZone {
  id: string;
  name: string;
  price: number;
  createdAt: string;
  updatedAt?: string;
}

// نوع بيانات منطقة التغطية
export interface CoverageArea {
  id: string;
  governorate: string;
  cities: string[];
  createdAt: string;
  updatedAt?: string;
}

// نوع بيانات المدينة
export interface City {
  id: string;
  name: string;
  governorate: string;
}

// نوع بيانات المحافظة مع المدن
export interface Governorate {
  name: string;
  cities: string[];
}
