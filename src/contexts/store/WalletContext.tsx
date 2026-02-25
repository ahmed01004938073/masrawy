import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/store/UserContext";
import { getSiteSettings } from "@/services/siteSettingsService";
import {
  addWithdrawal,
  getWithdrawalsByMarketerId,
  getMarketerById,
  getMarketerStats,
  Withdrawal,
  MarketerStats,
  updateWithdrawalStatus,
  updateWithdrawalAmount
} from "@/services/marketerService";

export interface WithdrawalRequest extends Withdrawal {
  walletNumber?: string;
  provider?: string;
  paymentMethod?: string;
  accountDetails?: string;
  requestDate?: string;
  date?: string;
}

interface WalletContextType {
  balance: number;
  processingCommission: number;
  totalEarnedCommission: number;
  withdrawalRequests: WithdrawalRequest[];
  requestWithdrawal: (amount: number, walletNumber: string, provider: string) => Promise<void>;
  cancelWithdrawal: (id: string) => Promise<void>;
  editWithdrawal: (id: string, newAmount: number) => Promise<void>;
  addToBalance: (amount: number) => void;
  refreshWallet: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const [balance, setBalance] = useState(0);
  const [processingCommission, setProcessingCommission] = useState(0);
  const [totalEarnedCommission, setTotalEarnedCommission] = useState(0);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);

  const fetchWalletData = useCallback(async () => {
    if (!user) {
      setBalance(0);
      setWithdrawalRequests([]);
      return;
    }

    try {
      console.log(`💰 [WalletContext] Fetching stats for user: ${user.id}`);
      const stats: MarketerStats = await getMarketerStats(user.id);
      console.log(`💰 [WalletContext] Stats received:`, stats);
      setBalance(stats.available);
      setProcessingCommission(stats.processing);
      setTotalEarnedCommission(stats.totalEarned);

      // 2. Get Withdrawals History
      const result = await getWithdrawalsByMarketerId(user.id);
      const withdrawals = Array.isArray(result) ? result : (result.data || []);

      const mappedWithdrawals: WithdrawalRequest[] = withdrawals.map(w => {
        let walletNumber = w.notes;
        let provider: string = w.method;

        if (w.notes) {
          const match = w.notes.match(/^(.*?)\s*\((.*?)\)$/);
          if (match) {
            walletNumber = match[1].trim();
            provider = match[2].trim();
          }
        }

        return {
          ...w,
          walletNumber: walletNumber,
          provider: provider,
          date: w.createdAt,
          paymentMethod: `${w.method}`,
          accountDetails: w.notes,
          requestDate: w.createdAt
        };
      });

      mappedWithdrawals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWithdrawalRequests(mappedWithdrawals);

    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchWalletData();
    const intervalId = setInterval(fetchWalletData, 10000);
    return () => clearInterval(intervalId);
  }, [fetchWalletData]);

  const requestWithdrawal = useCallback(async (amount: number, walletNumber: string, provider: string) => {
    if (!user || !user.id) {
      toast({
        title: "خطأ",
        description: "يجب تسجيل الدخول أولاً",
        variant: "destructive",
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: "خطأ",
        description: "الرصيد غير كافٍ لإتمام عملية السحب",
        variant: "destructive",
      });
      return;
    }

    const settings = await getSiteSettings();
    const minWithdrawal = settings.minWithdrawal || 50;

    if (amount < minWithdrawal) {
      toast({
        title: "خطأ",
        description: `الحد الأدنى للسحب هو ${minWithdrawal} جنيه`,
        variant: "destructive",
      });
      return;
    }

    try {
      await addWithdrawal({
        marketerId: user.id,
        amount: amount,
        method: "wallet",
        status: "pending",
        notes: `${walletNumber} (${provider})`
      });

      toast({
        title: "تم إرسال طلب السحب",
        description: `تم إرسال طلب سحب بمبلغ ${amount} جنيه، سيتم المراجعة قريباً`,
      });

      await fetchWalletData();

    } catch (error) {
      console.error("Failed to request withdrawal:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إرسال الطلب",
        variant: "destructive",
      });
    }

  }, [balance, user, fetchWalletData]);

  const cancelWithdrawal = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await updateWithdrawalStatus(id, "cancelled");
      toast({
        title: "تم إلغاء الطلب",
        description: "تم إلغاء طلب السحب وإعادة المبلغ إلى رصيدك",
      });
      await fetchWalletData();
    } catch (error) {
      console.error("Failed to cancel withdrawal:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إلغاء الطلب",
        variant: "destructive",
      });
    }
  }, [user, fetchWalletData]);

  const editWithdrawal = useCallback(async (id: string, newAmount: number) => {
    if (!user) return;

    try {
      await updateWithdrawalAmount(id, newAmount);
      toast({
        title: "تم تحديث الطلب",
        description: "تم تعديل مبلغ طلب السحب بنجاح",
      });
      await fetchWalletData();
    } catch (error: any) {
      console.error("Failed to edit withdrawal:", error);
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء تعديل الطلب",
        variant: "destructive",
      });
    }
  }, [user, fetchWalletData]);

  const addToBalance = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        balance,
        processingCommission,
        totalEarnedCommission,
        withdrawalRequests,
        requestWithdrawal,
        cancelWithdrawal,
        editWithdrawal,
        addToBalance,
        refreshWallet: fetchWalletData
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
};
