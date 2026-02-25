import { useState, useEffect } from "react";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wallet as WalletIcon, ArrowDownToLine, History, DollarSign } from "lucide-react";
import { useWallet } from "@/contexts/store/WalletContext";
import { getSiteSettings } from "@/services/siteSettingsService";
import { getSavedWallets, SavedWallet } from "@/services/marketerService";
import { toast } from "sonner";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { useUser } from "@/contexts/store/UserContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Edit } from "lucide-react";

const statusConfig: any = {
  pending: { label: "قيد المراجعة", color: "bg-yellow-500" },
  approved: { label: "مقبول", color: "bg-green-500" }, // Legacy compatibility
  completed: { label: "تم التحويل", color: "bg-green-500" },
  rejected: { label: "مرفوض", color: "bg-red-500" },
  cancelled: { label: "ملغي", color: "bg-gray-500" }
};

const Wallet = () => {
  const { formatPrice } = usePriceFormatter();
  const { balance, withdrawalRequests, requestWithdrawal, cancelWithdrawal, editWithdrawal } = useWallet();
  const { user } = useUser();
  const [walletNumber, setWalletNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [minWithdrawal, setMinWithdrawal] = useState(200);
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>([]);

  // Edit State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null);
  const [newEditAmount, setNewEditAmount] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const walletProviders = [
    { id: "vodafone", name: "فودافون كاش", color: "bg-[#e60000]" },
    { id: "etisalat", name: "اتصالات كاش", color: "bg-[#9ccb3b]" },
    { id: "orange", name: "أورانج كاش", color: "bg-[#ff7900]" },
    { id: "we", name: "وي كاش", color: "bg-[#5c2483]" }
  ];

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await getSiteSettings();
        if (settings && settings.minWithdrawal) {
          setMinWithdrawal(settings.minWithdrawal);
        }
      } catch (error) {
        console.error("Failed to load settings", error);
      }
    };
    loadSettings();
  }, []);

  useEffect(() => {
    const fetchWallets = async () => {
      if (user?.id) {
        try {
          const wallets = await getSavedWallets(user.id);
          setSavedWallets(wallets);
        } catch (error) {
          console.error("Failed to fetch saved wallets", error);
        }
      }
    };
    fetchWallets();
  }, [user?.id]);

  const handleProviderChange = (providerId: string) => {
    setSelectedProvider(providerId);
    const saved = savedWallets.find(w => w.provider === providerId);
    if (saved) {
      setWalletNumber(saved.number);
    } else {
      setWalletNumber("");
    }
  };

  const handleWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();

    const withdrawalAmount = Number(amount);
    if (!walletNumber || !withdrawalAmount || !selectedProvider) {
      return;
    }

    if (withdrawalAmount < minWithdrawal) {
      return;
    }

    requestWithdrawal(withdrawalAmount, walletNumber, selectedProvider);
    setAmount("");
    setWalletNumber("");
    setSelectedProvider("");
  };

  const handleOpenEdit = (request: any) => {
    setEditingWithdrawal(request);
    setNewEditAmount(request.amount.toString());
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingWithdrawal) return;
    const val = Number(newEditAmount);
    if (val < minWithdrawal) return;

    await editWithdrawal(editingWithdrawal.id, val);
    setIsEditDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative">
        {/* Premium Shiny Green Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white pt-10 pb-20 px-4 md:px-8 rounded-b-[2.5rem] shadow-lg mb-[-4rem]">
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group transition-all hover:bg-white/30">
                <WalletIcon className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-4 md:px-6 py-3 rounded-2xl shadow-xl border border-white/50 max-w-full overflow-hidden">
                <p className="text-zinc-900 text-[11px] sm:text-sm md:text-xl font-black whitespace-nowrap font-cairo">إدارة رصيدك وطلبات السحب باحترافية</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-12 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* الرصيد الحالي - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-2xl border-none bg-background/80 backdrop-blur-sm overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent pointer-events-none" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <WalletIcon className="w-5 h-5" />
                  الرصيد المتاح
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-500/10 p-6 rounded-lg text-center border border-green-500/20">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 text-green-600" />
                  <p className="text-4xl font-bold text-green-600 mb-1">{formatPrice(balance)} ج.م</p>
                  <p className="text-sm text-muted-foreground">عمولات الطلبات المتسلمة</p>
                </div>

                <form onSubmit={handleWithdrawal} className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label>نوع المحفظة *</Label>
                    <Select value={selectedProvider} onValueChange={handleProviderChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المحفظة" />
                      </SelectTrigger>
                      <SelectContent>
                        {walletProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${provider.color}`} />
                              {provider.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="walletNumber">رقم المحفظة *</Label>
                    <Input
                      id="walletNumber"
                      value={walletNumber}
                      onChange={(e) => setWalletNumber(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      required
                      maxLength={11}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">المبلغ (جنيه) *</Label>
                    <Input
                      id="amount"
                      type="number"
                      min={minWithdrawal}
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder={`الحد الأدنى ${minWithdrawal}`}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-primary"
                    disabled={!amount || Number(amount) < minWithdrawal || Number(amount) > balance || walletNumber.length < 11 || !selectedProvider}
                  >
                    <ArrowDownToLine className="w-4 h-4 ml-2" />
                    طلب سحب
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* سجل طلبات السحب */}
          <Card className="lg:col-span-2 shadow-xl border-none bg-background/80 backdrop-blur-sm min-h-[600px] flex flex-col">
            <CardHeader className="border-b border-border/50 pb-6">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <History className="w-5 h-5 text-primary" />
                  </div>
                  <span>سجل طلبات السحب</span>
                </div>
                {withdrawalRequests.length > 0 && (
                  <Badge variant="secondary" className="px-3 py-1 font-bold">
                    {withdrawalRequests.length} طلب
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 py-6 overflow-hidden">
              {withdrawalRequests.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">لا توجد طلبات سحب حتى الآن</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Pagination Logic */}
                  {(() => {
                    const sortedRequests = [...withdrawalRequests].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    const lastIndex = currentPage * itemsPerPage;
                    const firstIndex = lastIndex - itemsPerPage;
                    const currentItems = sortedRequests.slice(firstIndex, lastIndex);
                    const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);

                    return (
                      <>
                        <div className="space-y-4 max-h-[1200px] overflow-y-auto pr-2 custom-scrollbar">
                          {currentItems.map((request) => {
                            const status = statusConfig[request.status] || { label: request.status, color: "bg-gray-400" };
                            return (
                              <Card key={request.id} className="border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-md bg-card/50">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-4">
                                    <Badge className={`${status.color} text-white text-[10px] sm:text-xs rounded-full px-3`}>
                                      {status.label}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {(() => {
                                        try {
                                          const date = new Date(request.date);
                                          return isNaN(date.getTime()) ? request.date : date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
                                        } catch (e) { return request.date; }
                                      })()}
                                    </span>
                                  </div>

                                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-2xl border border-border/50">
                                    <div className="grid grid-cols-3 gap-2 sm:gap-6 flex-1 w-full text-center md:text-right">
                                      <div className="flex flex-col items-center md:items-start justify-center">
                                        <div className="text-[10px] text-muted-foreground font-bold mb-1">كود</div>
                                        <div className="font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap">#{request.id}</div>
                                      </div>
                                      <div className="flex flex-col items-center md:items-center justify-center">
                                        <div className="text-[10px] text-muted-foreground font-bold mb-1">المبلغ</div>
                                        <div className="font-black text-primary text-sm sm:text-base whitespace-nowrap">{formatPrice(request.amount)} <small className="text-[10px] font-normal">ج.م</small></div>
                                      </div>
                                      <div className="flex flex-col items-center md:items-end justify-center">
                                        <div className="text-[10px] text-muted-foreground font-bold mb-2">المحفظة</div>
                                        <div className="flex flex-col items-center md:items-end justify-center gap-1">
                                          <div className="font-mono text-[10px] sm:text-xs font-bold whitespace-nowrap block" dir="ltr">{request.walletNumber}</div>
                                          {((request.provider && request.provider !== 'wallet') || (request.method && request.method !== 'wallet')) && (
                                            <div className="text-[10px] text-muted-foreground font-medium block" dir="ltr">
                                              ({request.provider && request.provider !== 'wallet' ? request.provider : request.method})
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {request.status === "pending" && (
                                      <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-none border-border/50">
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 md:flex-none h-9 px-4 flex items-center justify-center gap-1 border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 text-xs rounded-xl transition-colors"
                                          onClick={() => handleOpenEdit(request)}
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                          تعديل
                                        </Button>
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="flex-1 md:flex-none h-9 px-4 flex items-center justify-center gap-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 text-xs rounded-xl transition-colors"
                                          onClick={() => cancelWithdrawal(request.id)}
                                        >
                                          <span className="text-lg leading-none mb-1 mr-1">×</span>
                                          إلغاء
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>

                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-8 border-t border-border/50 pt-6">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              disabled={currentPage === 1}
                              className="rounded-xl h-10 px-4"
                            >
                              السابق
                            </Button>
                            <div className="flex items-center gap-1">
                              {[...Array(totalPages)].map((_, i) => (
                                <Button
                                  key={i + 1}
                                  variant={currentPage === i + 1 ? "default" : "ghost"}
                                  size="sm"
                                  className={`w-10 h-10 rounded-xl font-bold ${currentPage === i + 1 ? 'shadow-lg shadow-primary/20' : ''}`}
                                  onClick={() => setCurrentPage(i + 1)}
                                >
                                  {i + 1}
                                </Button>
                              ))}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              disabled={currentPage === totalPages}
                              className="rounded-xl h-10 px-4"
                            >
                              التالي
                            </Button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* نصائح */}
        <Card className="mt-8 shadow-elegant gradient-card border-none bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-orange-800">معلومات هامة</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid md:grid-cols-2 gap-2 text-sm text-orange-700/80">
              <li>• الحد الأدنى للسحب هو {formatPrice(minWithdrawal)} ج.م</li>
              <li>• يتم مراجعة طلبات السحب خلال 24-48 ساعة</li>
              <li>• يتم إضافة عمولة الطلبات المكتملة تلقائياً</li>
              <li>• تأكد من إدخال رقم المحفظة بشكل صحيح</li>
              <li>• يمكنك متابعة حالة طلبات السحب من هذه الصفحة</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تعديل مبلغ طلب السحب</DialogTitle>
            <DialogDescription>
              يمكنك تعديل مبلغ الطلب طالما لم يتم تنفيذه بعد.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>المبلغ الجديد (جنيه) *</Label>
              <Input
                type="number"
                value={newEditAmount}
                onChange={(e) => setNewEditAmount(e.target.value)}
                placeholder={`الحد الأدنى ${minWithdrawal}`}
                min={minWithdrawal}
              />
              <p className="text-xs text-muted-foreground">
                الرصيد الكلي المتاح حالياً مع هذا الطلب: <span className="font-bold text-green-600">{formatPrice(balance + (editingWithdrawal?.amount || 0))} ج.م</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={Number(newEditAmount) < minWithdrawal || Number(newEditAmount) > (balance + (editingWithdrawal?.amount || 0))}
            >
              حفظ التعديلات
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
