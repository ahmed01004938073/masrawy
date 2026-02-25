import {
  getWithdrawals,
  updateWithdrawalStatus,
  getMarketers,
  addWithdrawal,
  Withdrawal
} from "./marketerService";
import { sendNotification } from "./notificationService";

// نموذج بيانات طلب السحب
export interface WithdrawalRequest {
  id: string;
  marketerId: string;
  marketerName: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "cancelled";
  requestDate: string;
  processDate?: string;
  notes?: string;
  paymentMethod: string;
  accountDetails: string;
}

export const initializeWithdrawalData = async (): Promise<void> => {
  // No-op
};

// الحصول على جميع طلبات السحب
export const getWithdrawalRequests = async (page?: number, limit?: number, status?: string, search?: string): Promise<WithdrawalRequest[] | { data: WithdrawalRequest[], total: number, page: number, totalPages: number }> => {
  const result = await getWithdrawals(page, limit);
  const withdrawals = Array.isArray(result) ? result : result.data;
  const marketersResult = await getMarketers();
  const marketers = Array.isArray(marketersResult) ? marketersResult : marketersResult.data;

  const mappedData = withdrawals.map(w => {
    const marketer = marketers.find(m => m.id === w.marketerId);
    return {
      id: w.id,
      marketerId: w.marketerId,
      marketerName: marketer ? marketer.name : "Unknown",
      amount: w.amount,
      status: w.status === "completed" ? "approved" : (w.status as any),
      requestDate: w.createdAt,
      processDate: w.updatedAt,
      notes: "",
      paymentMethod: w.method === "wallet" ? "محفظة إلكترونية" : w.method === "bank" ? "حساب بنكي" : w.method,
      accountDetails: w.notes
    };
  });

  if (Array.isArray(result)) {
    return mappedData;
  }

  return {
    data: mappedData,
    total: result.total,
    page: result.page,
    totalPages: result.totalPages
  };
};

// الحصول على طلبات السحب لمسوق معين
export const getWithdrawalRequestsByMarketerId = async (marketerId: string): Promise<WithdrawalRequest[]> => {
  const result = await getWithdrawalRequests();
  const allRequests = Array.isArray(result) ? result : result.data;
  return allRequests.filter(req => req.marketerId === marketerId);
};

// الحصول على طلب سحب معين
export const getWithdrawalRequestById = async (id: string): Promise<WithdrawalRequest | null> => {
  const result = await getWithdrawalRequests();
  const allRequests = Array.isArray(result) ? result : result.data;
  return allRequests.find(req => req.id === id) || null;
};

// إضافة طلب سحب جديد
export const addWithdrawalRequest = async (
  marketerId: string,
  marketerName: string,
  amount: number,
  paymentMethod: string,
  accountDetails: string
): Promise<WithdrawalRequest> => {
  // This function might be deprecated or used for testing, we map it to addWithdrawal
  const methodMap: Record<string, "wallet" | "bank" | "cash"> = {
    "محفظة إلكترونية": "wallet",
    "فودافون كاش": "wallet",
    "اتصالات كاش": "wallet",
    "أورانج كاش": "wallet",
    "وي كاش": "wallet",
    "حساب بنكي": "bank"
  };

  const method = methodMap[paymentMethod] || "wallet";

  const newWithdrawal = await addWithdrawal({
    marketerId,
    amount,
    method,
    status: "pending",
    notes: accountDetails
  });

  return {
    id: newWithdrawal.id,
    marketerId,
    marketerName,
    amount,
    status: "pending",
    requestDate: newWithdrawal.createdAt,
    paymentMethod,
    accountDetails
  };
};

export const generateTestWithdrawals = async (): Promise<number> => {
  // Simplified for compatibility
  return 0;
};

// تحديث حالة طلب سحب
export const updateWithdrawalRequestStatus = async (
  id: string,
  status: "approved" | "rejected",
  notes?: string
): Promise<WithdrawalRequest | null> => {
  // Map "approved" to "completed" for marketerService
  const mappedStatus = status === "approved" ? "completed" : "rejected";

  try {
    const updatedWithdrawal = await updateWithdrawalStatus(id, mappedStatus);

    // Add notification for the marketer
    const marketerId = updatedWithdrawal?.marketerId;
    if (marketerId) {
      if (status === "approved") {
        await sendNotification(
          marketerId,
          "تم تحويل العمولة اليك 💸",
          "تمت الموافقة على طلب السحب الخاص بك وتم تحويل المبلغ بنجاح",
          "success",
          "/wallet"
        );
      } else if (status === "rejected") {
        await sendNotification(
          marketerId,
          "تم رفض طلب السحب ❌",
          `للأسف تم رفض طلب السحب الخاص بك. السبب: ${notes || "غير محدد"}`,
          "error",
          "/wallet"
        );
      }
    }

    const result = await getWithdrawalRequests();
    const requests = Array.isArray(result) ? result : result.data;
    return requests.find(r => r.id === id) || null;
  } catch (e) {
    console.error(e);
    return null;
  }
};

// الحصول على إحصائيات طلبات السحب
export const getWithdrawalStats = async () => {
  const result = await getWithdrawalRequests();
  const requests = Array.isArray(result) ? result : result.data;

  const pendingRequests = requests.filter(request => request.status === "pending");
  const approvedRequests = requests.filter(request => request.status === "approved");
  const rejectedRequests = requests.filter(request => request.status === "rejected");

  return {
    total: requests.length,
    pending: pendingRequests.length,
    approved: approvedRequests.length,
    rejected: rejectedRequests.length,
    pendingAmount: pendingRequests.reduce((sum, request) => sum + request.amount, 0),
    approvedAmount: approvedRequests.reduce((sum, request) => sum + request.amount, 0),
    rejectedAmount: rejectedRequests.reduce((sum, request) => sum + request.amount, 0),
    uniqueMarketers: new Set(requests.map(request => request.marketerId)).size,
  };
};

