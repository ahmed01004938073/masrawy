
import { sendNotification } from "./notificationService";
import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";

// Helper to generate an 8-character short ID
const generateShortId = (prefix: string = "") => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix ? `${prefix}${result}` : result;
};

export interface Marketer {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  totalCommission: number;
  pendingCommission: number;
  withdrawnCommission: number;
  ordersCount: number;
  createdAt: string;
  updatedAt?: string;
  commissionRate?: number; // نسبة العمولة (بالنسبة المئوية)
  password?: string; // For store login
  city?: string;
  pages?: string[]; // Social media pages
  alternativePhone?: string;
}

// نوع بيانات العمولة
export interface Commission {
  id: string;
  marketerId: string;
  orderId: string;
  orderNumber: string;
  amount: number;
  status: "pending" | "approved" | "paid" | "cancelled" | "processing";
  createdAt: string;
  updatedAt: string;
}

// نوع بيانات عملية السحب
export interface Withdrawal {
  id: string;
  marketerId: string;
  amount: number;
  method: "bank" | "cash" | "wallet";
  status: "pending" | "completed" | "cancelled" | "rejected";
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface MarketerStats {
  totalEarned: number;
  processing: number;
  withdrawn: number;
  available: number;
}

export interface SavedWallet {
  id: number;
  marketerId: string;
  provider: string;
  number: string;
  createdAt: string;
  updatedAt: string;
}



const getStoredMarketers = async (): Promise<Marketer[]> => {
  try {
    return await fetchJson(`${API_URL}/marketers`);
  } catch {
    return [];
  }
};

export const saveStoredMarketers = async (marketer: Marketer) => {
  await fetchJson(`${API_URL}/marketers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marketer)
  });
};

export const registerMarketer = async (marketer: Marketer) => {
  await fetchJson(`${API_URL}/marketers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(marketer)
  });
};

const getStoredCommissions = async (marketerId?: string): Promise<Commission[]> => {
  try {
    const url = marketerId ? `${API_URL}/marketers/commissions?marketerId=${marketerId}` : `${API_URL}/marketers/commissions`;
    return await fetchJson(url);
  } catch {
    return [];
  }
}

const saveStoredCommission = async (commission: Commission) => {
  await fetchJson(`${API_URL}/marketers/commissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commission)
  });
};

const getStoredWithdrawals = async (marketerId?: string): Promise<Withdrawal[]> => {
  try {
    const url = marketerId ? `${API_URL}/marketers/withdrawals?marketerId=${marketerId}` : `${API_URL}/marketers/withdrawals`;
    return await fetchJson(url);
  } catch {
    return [];
  }
}

const saveStoredWithdrawal = async (withdrawal: Withdrawal) => {
  await fetchJson(`${API_URL}/marketers/withdrawals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withdrawal)
  });
};


// بيانات تجريبية للمسوقين - سيتم استخدامها إذا كانت قاعدة البيانات فارغة
const mockMarketers: Marketer[] = [
  {
    id: "m1",
    name: "محمد علي",
    phone: "01012345678",
    email: "mohamed@example.com",
    status: "active",
    totalCommission: 5200,
    pendingCommission: 1200,
    withdrawnCommission: 4000,
    ordersCount: 42,
    createdAt: "2023-01-15T10:30:00Z",
    updatedAt: "2023-05-20T14:30:00Z",
    commissionRate: 12,
  },
  {
    id: "m2",
    name: "فاطمة حسن",
    phone: "01112345678",
    email: "fatma@example.com",
    status: "active",
    totalCommission: 3800,
    pendingCommission: 800,
    withdrawnCommission: 3000,
    ordersCount: 31,
    createdAt: "2023-02-20T14:45:00Z",
    updatedAt: "2023-05-15T09:30:00Z",
    commissionRate: 10,
  }
];

// تهيئة البيانات
export const initializeMarketerData = async (): Promise<void> => {
  // No longer needed to seed via KV, database handles defaults if needed
};

// الحصول على جميع المسوقين
export const getMarketers = async (page?: number, limit?: number, search?: string): Promise<Marketer[] | { data: Marketer[], total: number, page: number, totalPages: number }> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (search) params.append('search', search);

    const url = `${API_URL}/marketers?${params.toString()}`;
    const data = await fetchJson(url);

    if (data.data && Array.isArray(data.data)) {
      return data;
    }
    return data;
  } catch (error) {
    console.error("Failed to fetch marketers:", error);
    return [];
  }
};

// الحصول على مسوق محدد
export const getMarketerById = async (id: string): Promise<Marketer | null> => {
  const result = await getMarketers();
  const marketers = Array.isArray(result) ? result : result.data;
  return marketers.find((marketer) => marketer.id === id) || null;
};

// إضافة مسوق جديد
// إضافة مسوق جديد (للمشرفين)
export const addMarketer = async (marketer: Omit<Marketer, "id" | "createdAt" | "updatedAt" | "totalCommission" | "pendingCommission" | "withdrawnCommission" | "ordersCount">): Promise<Marketer> => {
  const now = new Date().toISOString();
  const newMarketer: Marketer = {
    id: generateShortId("m"),
    createdAt: now,
    updatedAt: now,
    totalCommission: 0,
    pendingCommission: 0,
    withdrawnCommission: 0,
    ordersCount: 0,
    commissionRate: 10,
    ...marketer,
  };

  await saveStoredMarketers(newMarketer);
  return newMarketer;
};

// تسجيل مسوق جديد (عام)
export const signUpMarketer = async (marketer: Omit<Marketer, "id" | "createdAt" | "updatedAt" | "totalCommission" | "pendingCommission" | "withdrawnCommission" | "ordersCount">): Promise<Marketer> => {
  const now = new Date().toISOString();
  // Ensure we set status to 'active' or 'pending' if needed, though caller sets it usually
  const newMarketer: Marketer = {
    id: generateShortId("m"),
    createdAt: now,
    updatedAt: now,
    totalCommission: 0,
    pendingCommission: 0,
    withdrawnCommission: 0,
    ordersCount: 0,
    commissionRate: 10,
    ...marketer,
  };

  await registerMarketer(newMarketer);
  return newMarketer;
};

// تحديث مسوق
export const updateMarketer = async (updatedMarketer: Marketer): Promise<Marketer> => {
  if (!updatedMarketer.updatedAt) {
    updatedMarketer.updatedAt = new Date().toISOString();
  }
  await saveStoredMarketers(updatedMarketer);
  return updatedMarketer;
};

// تحديث الملف الشخصي للمسوق (بواسطة المسوق نفسه)
export const updateMarketerProfile = async (userData: Partial<Marketer>): Promise<Marketer> => {
  return await fetchJson(`${API_URL}/marketers/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
};

// حذف مسوق
export const deleteMarketer = async (id: string): Promise<void> => {
  await fetchJson(`${API_URL}/marketers/${id}`, { method: 'DELETE' });
};

// الحصول على جميع العمولات
export const getCommissions = async (page?: number, limit?: number, marketerId?: string): Promise<Commission[] | { data: Commission[], total: number, page: number, totalPages: number }> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (marketerId) params.append('marketerId', marketerId);

    return await fetchJson(`${API_URL}/marketers/commissions?${params.toString()}`);
  } catch {
    return [];
  }
};

// الحصول على عمولات مسوق محدد
export const getCommissionsByMarketerId = async (marketerId: string, page?: number, limit?: number): Promise<Commission[] | { data: Commission[], total: number, page: number, totalPages: number }> => {
  return await getCommissions(page, limit, marketerId);
};

// إضافة عمولة جديدة
export const addCommission = async (
  commission: Omit<Commission, "id" | "createdAt" | "updatedAt">,
  incrementOrderCount: boolean = true
): Promise<Commission> => {
  if (!commission.marketerId) {
    console.error("Attempted to add commission without marketerId:", commission);
    throw new Error("معرف المسوق غير محدد");
  }
  if (commission.amount === undefined || isNaN(Number(commission.amount))) {
    throw new Error("قيمة العمولة غير صحيحة");
  }

  const now = new Date().toISOString();
  const newCommission: Commission = {
    id: generateShortId("c"), // cA7X9B2C3
    createdAt: now,
    updatedAt: now,
    ...commission,
    amount: Number(commission.amount)
  };

  await saveStoredCommission(newCommission);
  return newCommission;
};

// تحديث حالة العمولة
export const updateCommissionStatus = async (id: string, status: Commission["status"]): Promise<Commission> => {
  const result = await getCommissions();
  const commissions = Array.isArray(result) ? result : result.data;
  const commission = commissions.find((c) => c.id === id);

  if (commission) {
    const updated = {
      ...commission,
      status,
      updatedAt: new Date().toISOString(),
    };

    await saveStoredCommission(updated);
    await updateMarketerStats(commission.marketerId);

    return updated;
  }
  throw new Error("العمولة غير موجودة");
};

// الحصول على مزيد من الوظائف بنفس النمط...
// لتوفير الوقت في هذا المثال، سأقوم بتحويل بقية الوظائف الأساسية

export const getWithdrawals = async (page?: number, limit?: number, marketerId?: string): Promise<Withdrawal[] | { data: Withdrawal[], total: number, page: number, totalPages: number }> => {
  try {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());
    if (marketerId) params.append('marketerId', marketerId);
    return await fetchJson(`${API_URL}/marketers/withdrawals?${params.toString()}`);
  } catch {
    return [];
  }
};

// الحصول على عمليات سحب مسوق محدد
export const getWithdrawalsByMarketerId = async (marketerId: string, page?: number, limit?: number): Promise<Withdrawal[] | { data: Withdrawal[], total: number, page: number, totalPages: number }> => {
  return await getWithdrawals(page, limit, marketerId);
};

export const addWithdrawal = async (withdrawal: Omit<Withdrawal, "id" | "createdAt" | "updatedAt">): Promise<Withdrawal> => {
  if (!withdrawal.marketerId) {
    console.error("Attempted to add withdrawal without marketerId:", withdrawal);
    throw new Error("معرف المسوق غير محدد");
  }

  const now = new Date();
  now.setHours(now.getHours() + 2); // Correction for timezone delay
  const isoDate = now.toISOString();

  const newWithdrawal: Withdrawal = {
    id: generateShortId("w"), // wA7X9B2C3
    createdAt: isoDate,
    updatedAt: isoDate,
    ...withdrawal,
    amount: Number(withdrawal.amount)
  };

  await saveStoredWithdrawal(newWithdrawal);
  await updateMarketerStats(withdrawal.marketerId);

  return newWithdrawal;
};

// تحديث مبلغ طلب سحب معلق
export const updateWithdrawalAmount = async (id: string, newAmount: number): Promise<Withdrawal> => {
  const result = await getWithdrawals();
  const withdrawals = Array.isArray(result) ? result : result.data;
  const withdrawal = withdrawals.find(w => w.id === id);

  if (!withdrawal) throw new Error("طلب السحب غير موجود");
  if (withdrawal.status !== 'pending') throw new Error("لا يمكن تعديل طلب غير معلق");

  const updated: Withdrawal = {
    ...withdrawal,
    amount: newAmount,
    updatedAt: new Date().toISOString(),
  };

  await saveStoredWithdrawal(updated);
  await updateMarketerStats(withdrawal.marketerId);

  return updated;
};

// --- Saved Wallets ---
export const getSavedWallets = async (marketerId: string): Promise<SavedWallet[]> => {
  return await fetchJson(`${API_URL}/marketers/wallets/${marketerId}`);
};

export const saveWallet = async (marketerId: string, provider: string, number: string): Promise<void> => {
  try {
    await fetchJson(`${API_URL}/marketers/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marketerId, provider, number })
    });
  } catch (error: any) {
    console.error("saveWallet service error:", error);
    throw error;
  }
};

export const updateWithdrawalStatus = async (id: string, status: Withdrawal["status"]): Promise<Withdrawal> => {
  const result = await getWithdrawals();
  const withdrawals = Array.isArray(result) ? result : result.data;
  const withdrawal = withdrawals.find((w) => w.id === id);

  if (withdrawal) {
    const oldStatus = withdrawal.status;

    const updated = {
      ...withdrawal,
      status,
      updatedAt: new Date().toISOString(),
    };

    await saveStoredWithdrawal(updated);
    await updateMarketerStats(withdrawal.marketerId);

    if (oldStatus === "pending" && status === "completed") {
      // Notify Marketer
      await sendNotification(
        withdrawal.marketerId,
        "💰 تم قبول طلب السحب",
        `تم الموافقة على طلب سحب مبلغ ${withdrawal.amount} ج.م بنجاح.`,
        "success",
        "/wallet"
      );
    } else if (oldStatus === "pending" && (status === "rejected" || status === "cancelled")) {
      // Notify Marketer
      await sendNotification(
        withdrawal.marketerId,
        "❌ تم رفض طلب السحب",
        `للأسف تم رفض طلب السحب الخاص بك لمبلغ ${withdrawal.amount} ج.م.`,
        "error",
        "/wallet"
      );
    }
    return updated;
  }
  throw new Error("عملية السحب غير موجودة");
};


import { getOrders, getOrderById } from "./orderService";

// الحصول على إحصائيات المسوق المجمعة من الخادم (عالي الأداء)
export const getMarketerStats = async (marketerId: string): Promise<MarketerStats> => {
  return await fetchJson(`${API_URL}/marketers/stats?marketerId=${marketerId}`);
};

// تحديث إحصائيات المسوق (استدعاء الخادم ليقوم بالحساب والحفظ)
export const updateMarketerStats = async (marketerId: string): Promise<void> => {
  await fetchJson(`${API_URL}/marketers/stats/${marketerId}/update`, {
    method: 'POST'
  });
};

export const addOrderCommission = async (
  marketerId: string,
  orderId: string,
  orderNumber: string,
  amount: number,
  isPartialDelivery: boolean = false,
  customStatus: "pending" | "processing" = "pending"
): Promise<Commission | null> => {
  if (!marketerId || !orderId || amount === undefined || amount < 0) return null;

  const marketer = await getMarketerById(marketerId);
  if (!marketer) return null;

  const allCommissionsResult = await getCommissionsByMarketerId(marketerId);
  const allCommissions = Array.isArray(allCommissionsResult) ? allCommissionsResult : allCommissionsResult.data;
  const existing = allCommissions.find(c => c.orderId === orderId && (c.status === "pending" || c.status === "approved" || c.status === "processing"));

  if (existing) {
    console.log(`Commission already exists for order ${orderId}, updating amount instead of adding new.`);
    // Update existing commission instead of adding new one to prevent duplication
    const updated = {
      ...existing,
      amount: Number(amount),
      status: customStatus,
      updatedAt: new Date().toISOString()
    };
    await saveStoredCommission(updated);
    await updateMarketerStats(marketerId);
    return updated;
  }

  // Add new commission
  const newComm = await addCommission({
    marketerId,
    orderId,
    orderNumber,
    amount,
    status: customStatus
  }, false);

  await updateMarketerStats(marketerId);
  return newComm;
};

// تحويل عمولة من "قيد التنفيذ" إلى "متسلمة/جاهزة للسحب" عند تسليم الطلب
export const markCommissionAsDelivered = async (orderId: string): Promise<void> => {
  const result = await getCommissions();
  const commissions = Array.isArray(result) ? result : result.data;
  const comm = commissions.find(c => c.orderId === orderId);

  if (comm && comm.status === "processing") {
    await updateCommissionStatus(comm.id, "pending");
    console.log(`✅ Commission for order ${orderId} marked as delivered/ready.`);
  }
};

// Function to fix existing commissions
export const fixCommissionsBasedOnOrderStatus = async (): Promise<void> => {
  return; // 🛑 Disabled to prevent stale data conflicts
};

// --- Cart Persistence ---
export const getStoredCart = async (userId: string): Promise<any[]> => {
  try {
    return await fetchJson(`${API_URL}/marketers/cart/${userId}`);
  } catch {
    return [];
  }
};

export const saveStoredCart = async (userId: string, items: any[]) => {
  try {
    await fetchJson(`${API_URL}/marketers/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items })
    });
  } catch (e) {
    console.error("Failed to save cart remotely", e);
  }
};

// --- Favorites Persistence ---
export const getStoredFavorites = async (userId: string): Promise<number[]> => {
  try {
    const data = await fetchJson(`${API_URL}/favorites?userId=${userId}`);
    return data.map((f: any) => f.productId);
  } catch {
    return [];
  }
};

export const saveStoredFavorites = async (userId: string, items: number[]) => {
  try {
    await fetchJson(`${API_URL}/favorites/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, productIds: items })
    });
  } catch (e) {
    console.error("Failed to save favorites remotely", e);
  }
};
