// خدمات التحصيل والمتابعة — النسخة الجديدة (SQL Backend)
import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";

export interface Payment {
  id: string;
  companyId: string;
  amount: number;
  paymentMethod: string;
  receiptNumber?: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface ReturnedProduct {
  id: string;
  companyId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  reason: string;
  status: string;
  date: string;
  createdAt: string;
}

// تهيئة بيانات التحصيل والمتابعة
export const initializeCollectionData = async (): Promise<void> => {
  await getShippingCompanies();
};

// ==========================================
// SHIPPING COMPANIES
// ==========================================

export const getShippingCompanies = async (): Promise<any[]> => {
  try {
    const data = await fetchJson(`${API_URL}/shipping/companies`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const getShippingCompanyById = async (id: string) => {
  const companies = await getShippingCompanies();
  return companies.find((c: any) => c.id === id);
};

export const addShippingCompany = async (company: any) => {
  return await fetchJson(`${API_URL}/shipping/companies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company)
  });
};

export const updateShippingCompany = async (id: string, data: any) => {
  return await fetchJson(`${API_URL}/shipping/companies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const deleteShippingCompany = async (id: string) => {
  await fetchJson(`${API_URL}/shipping/companies/${id}`, { method: 'DELETE' });
  return true;
};

// ==========================================
// SHIPPING AREAS (zones per governorate)
// ==========================================

export const getShippingAreas = async (): Promise<any[]> => {
  try {
    const data = await fetchJson(`${API_URL}/shipping/areas`);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};

export const addShippingArea = async (area: any) => {
  return await fetchJson(`${API_URL}/shipping/areas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(area)
  });
};

export const updateShippingArea = async (id: string, data: any) => {
  return await fetchJson(`${API_URL}/shipping/areas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
};

export const deleteShippingArea = async (id: string) => {
  await fetchJson(`${API_URL}/shipping/areas/${id}`, { method: 'DELETE' });
  return true;
};

// ==========================================
// GOVERNORATES & CITIES (local defaults)
// ==========================================

const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة",
  "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية",
  "الوادي الجديد", "السويس", "اسوان", "اسيوط", "بني سويف", "بورسعيد",
  "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر",
  "قنا", "شمال سيناء", "سوهاج"
];

const CITIES_MAP: Record<string, string[]> = {
  "القاهرة": ["مدينة نصر", "المعادي", "مصر الجديدة", "وسط البلد", "المقطم", "الزمالك", "شبرا", "حلوان", "عين شمس", "المرج", "السلام", "التجمع الخامس", "مدينة الشروق", "مدينة بدر", "مدينة بدر", "مدينة العبور"],
  "الجيزة": ["الدقي", "المهندسين", "العجوزة", "الهرم", "فيصل", "6 أكتوبر", "الشيخ زايد", "حدائق الأهرام", "أوسيم", "كرداسة"],
  "الإسكندرية": ["المنتزه", "شرق الإسكندرية", "وسط الإسكندرية", "الجمرك", "العامرية", "العجمي", "برج العرب", "سموحة", "سيدي جابر", "أبو قير"],
  "الدقهلية": ["المنصورة", "طلخا", "ميت غمر", "دكرنس", "أجا", "السنبلاوين", "شربين", "المطرية", "بلقاس"],
  "الشرقية": ["الزقازيق", "العاشر من رمضان", "بلبيس", "المحمودية", "أبو كبير", "الحسينية"],
  "الغربية": ["طنطا", "المحلة الكبرى", "كفر الزيات", "زفتى", "السنطة", "قطور"],
  "المنوفية": ["شبين الكوم", "منوف", "أشمون", "الباجور", "قويسنا", "بركة السبع"],
  "القليوبية": ["بنها", "قليوب", "شبرا الخيمة", "القناطر الخيرية", "الخانكة", "طوخ"],
  "الإسماعيلية": ["الإسماعيلية", "فايد", "القنطرة شرق", "التل الكبير"],
  "السويس": ["السويس", "الأربعين", "عتاقة", "الجناين"],
  "بورسعيد": ["بورسعيد", "بورفؤاد", "العرب", "الضواحي"],
  "دمياط": ["دمياط", "دمياط الجديدة", "رأس البر", "فارسكور", "كفر سعد"],
  "الفيوم": ["الفيوم", "طامية", "سنورس", "إطسا", "إبشواي"],
  "بني سويف": ["بني سويف", "الواسطى", "ناصر", "إهناسيا", "ببا"],
  "المنيا": ["المنيا", "العدوة", "مغاغة", "بني مزار", "سمالوط", "أبو قرقاص"],
  "اسيوط": ["أسيوط", "ديروط", "منفلوط", "القوصية", "أبنوب"],
  "سوهاج": ["سوهاج", "أخميم", "البلينا", "المراغة", "جرجا", "طهطا"],
  "قنا": ["قنا", "أبو تشت", "نجع حمادي", "دشنا", "الوقف", "قفط"],
  "الأقصر": ["الأقصر", "الزينية", "البياضية", "أرمنت", "إسنا"],
  "اسوان": ["أسوان", "دراو", "كوم أمبو", "إدفو", "أبو سمبل السياحية"],
  "البحر الأحمر": ["الغردقة", "رأس غارب", "سفاجا", "القصير", "مرسى علم"],
  "البحيرة": ["دمنهور", "كفر الدوار", "رشيد", "إدكو", "المحمودية", "وادي النطرون"],
  "كفر الشيخ": ["كفر الشيخ", "دسوق", "فوه", "مطوبس", "بيلا", "بلطيم"],
  "مطروح": ["مرسى مطروح", "الحمام", "العلمين", "الضبعة", "سيوة"],
  "شمال سيناء": ["العريش", "الشيخ زويد", "رفح", "بئر العبد"],
  "جنوب سيناء": ["الطور", "شرم الشيخ", "دهب", "نويبع", "طابا", "سانت كاترين"],
  "الوادي الجديد": ["الخارجة", "الفرافرة", "موط"],
};

export const getAvailableGovernorates = async (): Promise<string[]> => {
  return GOVERNORATES;
};

export const getCitiesByGovernorate = async (governorate: string): Promise<string[]> => {
  return CITIES_MAP[governorate] || [];
};

export const updateCitiesForGovernorate = async (_governorate: string, _cities: string[]) => {
  // Cities are now locally defined; this is a no-op kept for API compatibility
};

// ==========================================
// STORE HELPERS
// ==========================================

export const getStoreShippingLocations = async (): Promise<Array<{ name: string; cities: string[] }>> => {
  const areas = await getShippingAreas();
  const governorateMap = new Map<string, Set<string>>();

  areas.forEach((area: any) => {
    if (!governorateMap.has(area.governorate)) {
      governorateMap.set(area.governorate, new Set());
    }
    const citySet = governorateMap.get(area.governorate);
    if (citySet && area.cities) {
      area.cities.forEach((city: string) => citySet.add(city));
    }
  });

  const locations: Array<{ name: string; cities: string[] }> = [];
  governorateMap.forEach((citySet, govName) => {
    locations.push({ name: govName, cities: Array.from(citySet) });
  });

  return locations;
};

export const getShippingFee = async (governorate: string, city?: string): Promise<number> => {
  try {
    const params = new URLSearchParams({ governorate });
    if (city) params.set('city', city);
    const data = await fetchJson(`${API_URL}/shipping/fee?${params.toString()}`);
    return data?.fee ?? 50;
  } catch {
    return 50;
  }
};

// ==========================================
// PAYMENTS (still KV for now — separate concern)
// ==========================================

const STORAGE_KEYS = {
  PAYMENTS: 'payments',
  RETURNED_PRODUCTS: 'returned_products',
};

export const getPayments = async (): Promise<Payment[]> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/${STORAGE_KEYS.PAYMENTS}`);
    return data || [];
  } catch { return []; }
};

export const getPaymentsByCompanyId = async (companyId: string): Promise<Payment[]> => {
  const payments = await getPayments();
  return payments.filter((p) => p.companyId === companyId);
};

export const addPayment = async (paymentData: Omit<Payment, 'id' | 'createdAt' | 'date'> & { date?: string }) => {
  const payments = await getPayments();
  const newPayment: Payment = {
    id: `pay-${Date.now()}`,
    createdAt: new Date().toISOString(),
    date: paymentData.date || new Date().toISOString(),
    ...paymentData
  };
  payments.push(newPayment);
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.PAYMENTS, value: payments })
  });
  return newPayment;
};

export const getReturnedProducts = async (): Promise<ReturnedProduct[]> => {
  try {
    const data = await fetchJson(`${API_URL}/kv/${STORAGE_KEYS.RETURNED_PRODUCTS}`);
    return data || [];
  } catch { return []; }
};

export const getReturnedProductsByCompanyId = async (companyId: string): Promise<ReturnedProduct[]> => {
  const products = await getReturnedProducts();
  return products.filter((p) => p.companyId === companyId);
};

export const addReturnedProduct = async (productData: Omit<ReturnedProduct, 'id' | 'createdAt' | 'date'> & { date?: string }) => {
  const products = await getReturnedProducts();
  const newProduct: ReturnedProduct = {
    id: `ret-${Date.now()}`,
    createdAt: new Date().toISOString(),
    date: productData.date || new Date().toISOString(),
    ...productData
  };
  products.push(newProduct);
  await fetchJson(`${API_URL}/kv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: STORAGE_KEYS.RETURNED_PRODUCTS, value: products })
  });
  return newProduct;
};

// ==========================================
// COPY / OPEN HELPERS
// ==========================================

export const copyCustomerDataToClipboard = (customerData: {
  name: string;
  phone: string;
  address: string;
  province: string;
  city: string;
  orderNumber: string;
  totalAmount: number;
  notes?: string;
}): void => {
  const formattedData = `📦 رقم الطلب: ${customerData.orderNumber}
👤 اسم العميل: ${customerData.name}
📱 رقم الهاتف: ${customerData.phone}
📍 العنوان: ${customerData.address}
🏙️ المحافظة: ${customerData.province}
🌆 المدينة: ${customerData.city}
💰 قيمة الطلب: ${customerData.totalAmount} ج.م
📝 ملاحظات: ${customerData.notes || 'لا توجد ملاحظات'}`.trim();

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(formattedData).catch(() => { });
  }
};

export const openShippingCompanyWebsite = async (companyId: string, customerData: {
  name: string; phone: string; address: string; province: string; city: string;
  orderNumber: string; totalAmount: number; notes?: string;
}): Promise<void> => {
  const companies = await getShippingCompanies();
  const company = companies.find((c: any) => c.id === companyId);
  if (!company) return;

  copyCustomerDataToClipboard(customerData);

  if (company.website && company.website.trim() !== "") {
    let url = company.website.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
    window.open(url, '_blank');
    return;
  }

  const whatsappNumber = company.whatsapp || company.phone;
  if (whatsappNumber && whatsappNumber.trim() !== "") {
    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('20') ? cleanPhone
      : cleanPhone.startsWith('01') ? '20' + cleanPhone.substring(1)
        : '20' + cleanPhone;
    const message = `📦 طلب شحن جديد\n👤 العميل: ${customerData.name}\n📱 الهاتف: ${customerData.phone}\n📍 العنوان: ${customerData.address}\n🏙️ المحافظة: ${customerData.province} - ${customerData.city}\n💰 القيمة: ${customerData.totalAmount} ج.م\n📝 ملاحظات: ${customerData.notes || 'لا توجد'}`;
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
  }
};

// Legacy stubs for compatibility (zones nested inside companies)
export const addShippingZone = async (_companyId: string, _zone: any) => null;
export const updateShippingZone = async (_companyId: string, _zoneId: string, _data: any) => null;
export const deleteShippingZone = async (_companyId: string, _zoneId: string) => false;
export const exportShippingZones = async (_companyId: string) => [];
export const importShippingZones = async (_companyId: string, _zones: any[]) => null;
export const copyShippingZones = async (_sourceId: string, _targetId: string) => null;
export const bulkUpdateZonePrices = async (_companyId: string, _updates: any[]) => null;
export const addCoverageArea = async (_companyId: string, _area: any) => null;
export const updateCoverageArea = async (_companyId: string, _areaId: string, _data: any) => null;
export const deleteCoverageArea = async (_companyId: string, _areaId: string) => false;
