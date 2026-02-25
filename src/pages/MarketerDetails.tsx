import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, User, DollarSign, ShoppingBag, Clock, Edit, Percent, Save, X, Check, Plus } from "lucide-react";
import { Marketer } from "@/services/marketerService";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getMarketerById,
  updateMarketer,
  addCommission
} from "@/services/marketerService";
import {
  WithdrawalRequest,
  getWithdrawalRequestsByMarketerId,
  addWithdrawalRequest
} from "@/services/withdrawalService";
import { getOrders } from "@/services/orderService";
import { Order, OrderStatus } from "./Orders";

// استيراد الخدمات المطلوبة من marketerService

import { usePriceFormatter } from "@/hooks/usePriceFormatter";

const MarketerDetailsPage = () => {
  const { formatPrice } = usePriceFormatter();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [marketer, setMarketer] = useState<Marketer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommissionDialogOpen, setIsCommissionDialogOpen] = useState(false);
  const [isWithdrawalDialogOpen, setIsWithdrawalDialogOpen] = useState(false);
  const [editedMarketer, setEditedMarketer] = useState<Marketer | null>(null);
  const [newCommissionAmount, setNewCommissionAmount] = useState<number>(0);
  const [commissionAdjustmentType, setCommissionAdjustmentType] = useState<"add" | "subtract" | "set">("set");
  const [commissionNote, setCommissionNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [withdrawalData, setWithdrawalData] = useState({
    amount: 0,
    paymentMethod: "تحويل بنكي",
    accountDetails: "",
  });

  // استخدام useQuery لجلب بيانات المسوق وتحديثها تلقائيًا
  const { data: marketerData, isLoading: isMarketerLoading, refetch: refetchMarketer } = useQuery({
    queryKey: ["marketer", id],
    queryFn: () => {
      const foundMarketer = getMarketerById(id || "");
      if (!foundMarketer) {
        throw new Error("لم يتم العثور على المسوق");
      }
      return foundMarketer;
    },
    refetchInterval: 30000, // تحديث البيانات كل 30 ثانية
    refetchOnWindowFocus: true, // تحديث البيانات عند التركيز على النافذة
  });

  // استخدام useQuery لجلب طلبات السحب وتحديثها تلقائيًا
  const { data: withdrawalRequestsData, isLoading: isWithdrawalsLoading } = useQuery({
    queryKey: ["marketer-withdrawals", id],
    queryFn: () => {
      if (!id) return [];
      return getWithdrawalRequestsByMarketerId(id);
    },
    refetchInterval: 30000, // تحديث البيانات كل 30 ثانية
    refetchOnWindowFocus: true, // تحديث البيانات عند التركيز على النافذة
    enabled: !!marketerData, // تفعيل الاستعلام فقط عند وجود بيانات المسوق
  });

  // جلب طلبات المسوق
  const { data: marketerOrders, isLoading: isOrdersLoading } = useQuery({
    queryKey: ["marketer-orders", id],
    queryFn: async () => {
      if (!id) return [];
      const fetchedOrders = await getOrders();
      const orders = Array.isArray(fetchedOrders) ? fetchedOrders : (fetchedOrders?.data || []);
      // تصفية الطلبات الخاصة بالمسوق الحالي
      return orders.filter(order => order.marketerId === id);
    },
    refetchInterval: 30000,
  });

  // تحديث حالة المكون عند تغير البيانات
  useEffect(() => {
    if (marketerData) {
      console.log("تم تحديث بيانات المسوق:", marketerData);
      setMarketer(marketerData);
      setEditedMarketer(marketerData);
      setNewCommissionAmount(0);
    }
  }, [marketerData]);

  useEffect(() => {
    if (withdrawalRequestsData) {
      setWithdrawalRequests(withdrawalRequestsData);
    }
  }, [withdrawalRequestsData]);

  // التعامل مع حالة عدم وجود المسوق
  useEffect(() => {
    if (!isMarketerLoading && !marketerData) {
      toast.error("لم يتم العثور على المسوق");
      navigate("/admin/marketers");
    }
  }, [isMarketerLoading, marketerData, navigate]);

  // تحديث حالة التحميل
  useEffect(() => {
    setIsLoading(isMarketerLoading || isWithdrawalsLoading || isOrdersLoading);
  }, [isMarketerLoading, isWithdrawalsLoading, isOrdersLoading]);

  // فتح نافذة تعديل بيانات المسوق
  const handleOpenEditDialog = () => {
    setEditedMarketer(marketer);
    setIsEditDialogOpen(true);
  };

  // تغيير بيانات المسوق
  const handleMarketerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editedMarketer) {
      setEditedMarketer({
        ...editedMarketer,
        [name]: value,
      });
    }
  };

  // حفظ بيانات المسوق
  const handleSaveMarketer = async () => {
    if (!editedMarketer) return;

    setIsSubmitting(true);
    try {
      // تحديث بيانات المسوق باستخدام الخدمة
      // تحديث تاريخ التحديث
      editedMarketer.updatedAt = new Date().toISOString();

      // استدعاء خدمة تحديث المسوق
      const updatedMarketer = await updateMarketer(editedMarketer);

      // تحديث البيانات في الواجهة
      setMarketer(updatedMarketer);
      toast.success("تم تحديث بيانات المسوق بنجاح");
      setIsEditDialogOpen(false);

      // تحديث البيانات من الخادم
      refetchMarketer();
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث بيانات المسوق");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح نافذة تعديل العمولة
  const handleOpenCommissionDialog = () => {
    setNewCommissionAmount(0);
    setCommissionAdjustmentType("set");
    setCommissionNote("");
    setIsCommissionDialogOpen(true);
  };

  // فتح نافذة طلب سحب جديد
  const handleOpenWithdrawalDialog = () => {
    if (!marketer) return;

    setWithdrawalData({
      amount: Math.min(1000, marketer.pendingCommission),
      paymentMethod: "تحويل بنكي",
      accountDetails: "",
    });

    setIsWithdrawalDialogOpen(true);
  };

  // تغيير بيانات طلب السحب
  const handleWithdrawalDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWithdrawalData(prev => ({
      ...prev,
      [name]: name === "amount" ? Math.min(Number(value), marketer?.pendingCommission || 0) : value,
    }));
  };

  // إنشاء طلب سحب جديد
  const handleCreateWithdrawalRequest = async () => {
    if (!marketer) return;

    if (withdrawalData.amount <= 0) {
      toast.error("يجب أن يكون المبلغ أكبر من صفر");
      return;
    }

    if (withdrawalData.amount > marketer.pendingCommission) {
      toast.error("المبلغ المطلوب أكبر من العمولة المتاحة");
      return;
    }

    if (!withdrawalData.accountDetails.trim()) {
      toast.error("يجب إدخال تفاصيل الحساب");
      return;
    }

    setIsSubmitting(true);

    try {
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // إنشاء طلب سحب جديد
      await addWithdrawalRequest(
        marketer.id,
        marketer.name,
        withdrawalData.amount,
        withdrawalData.paymentMethod,
        withdrawalData.accountDetails
      );

      toast.success("تم إنشاء طلب السحب بنجاح");
      setIsWithdrawalDialogOpen(false);

      // تحديث البيانات من الخادم
      await refetchMarketer();
    } catch (error) {
      toast.error("حدث خطأ أثناء إنشاء طلب السحب");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // حفظ تعديل العمولة
  const handleSaveCommission = async () => {
    if (!marketer) return;

    setIsSubmitting(true);
    try {
      // حساب المبلغ للتعديل
      let adjAmount = newCommissionAmount;
      let status: "pending" | "paid" = "pending";

      if (commissionAdjustmentType === "subtract") {
        adjAmount = -newCommissionAmount;
      } else if (commissionAdjustmentType === "set") {
        // 'set' is slightly complex with our commission-based approach. 
        // We'll calculate the difference.
        adjAmount = newCommissionAmount - marketer.pendingCommission;
      }

      // إضافة سجل عمولة (تعديل يدوي)
      // This will automatically trigger syncMarketerStats on the backend
      await addCommission({
        marketerId: marketer.id,
        orderId: `manual_adj_${Date.now()}`,
        orderNumber: "تعديل يدوي",
        amount: adjAmount,
        status: status,
      }, false); // don't increment order count for manual adjustment

      // لا نقوم بتحديث المسوق يدوياً هنا، بل نعتمد على الـ refetch

      // عرض رسالة نجاح مناسبة حسب نوع التعديل
      let successMessage = "";
      switch (commissionAdjustmentType) {
        case "add":
          successMessage = `تم إضافة ${newCommissionAmount} ج.م إلى عمولة المسوق`;
          break;
        case "subtract":
          successMessage = `تم خصم ${newCommissionAmount} ج.م من عمولة المسوق`;
          break;
        case "set":
          successMessage = `تم تعيين عمولة المسوق إلى ${newCommissionAmount} ج.م`;
          break;
      }

      toast.success(successMessage);
      setIsCommissionDialogOpen(false);

      // تحديث البيانات من الخادم
      await refetchMarketer();

      // إضافة ملاحظة تغيير العمولة إلى سجل المسوق (يمكن تنفيذها لاحقًا)
      if (commissionNote.trim()) {
        // يمكن إضافة كود لحفظ ملاحظة تغيير العمولة
        console.log("ملاحظة تغيير العمولة:", commissionNote);
      }
    } catch (error) {
      toast.error("حدث خطأ أثناء تعديل عمولة المسوق");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // العودة إلى صفحة المسوقين
  const handleGoBack = () => {
    navigate("/admin/marketers");
  };

  const handleViewOrder = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  // تنسيق الحالة
  const getStatusBadgeColor = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "confirmed": return "bg-blue-100 text-blue-800";
      case "processing": return "bg-purple-100 text-purple-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "in_delivery": return "bg-orange-100 text-orange-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "partially_delivered": return "bg-teal-100 text-teal-800";
      case "delivery_rejected": return "bg-pink-100 text-pink-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "suspended": return "bg-gray-100 text-gray-800";
      case "returned": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const translateStatus = (status: OrderStatus) => {
    switch (status) {
      case "pending": return "قيد الانتظار";
      case "confirmed": return "تم التأكيد";
      case "processing": return "قيد التجهيز";
      case "shipped": return "تم الشحن";
      case "in_delivery": return "جاري التوصيل";
      case "delivered": return "تم التسليم";
      case "partially_delivered": return "تم التسليم جزئياً";
      case "delivery_rejected": return "تم رفض التسليم";
      case "cancelled": return "ملغي";
      case "suspended": return "معلق";
      default: return status;
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    if (!dateString) return "غير متوفر";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "تاريخ غير صالح";
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!marketer) {
    return (
      <DashboardLayout>
        <div className="text-center py-10">
          <h2 className="text-2xl font-bold mb-2">لم يتم العثور على المسوق</h2>
          <p className="text-muted-foreground mb-4">
            لم نتمكن من العثور على المسوق المطلوب
          </p>
          <Button onClick={handleGoBack}>
            <ArrowLeft className="ml-2 h-4 w-4" />
            العودة إلى قائمة المسوقين
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              تفاصيل المسوق
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditDialog}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              تعديل البيانات
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenCommissionDialog}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              تعديل العمولة
            </Button>
            <Badge
              variant={marketer.status === "active" ? "default" : "secondary"}
              className={
                marketer.status === "active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : "bg-gray-100 text-gray-800 hover:bg-gray-100"
              }
            >
              {marketer.status === "active" ? "نشط" : "غير نشط"}
            </Badge>
          </div>
        </div>

        {/* بطاقة معلومات المسوق */}
        {/* بطاقة معلومات المسوق - New Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* العمود الأول: الملف الشخصي */}
          <Card className="md:col-span-1 border-t-4 border-t-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                الملف الشخصي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3">
                  <span className="text-2xl font-bold text-primary">
                    {marketer.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-bold">{marketer.name}</h2>
                <Badge
                  variant={marketer.status === "active" ? "default" : "secondary"}
                  className={`mt-2 ${marketer.status === "active"
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                >
                  {marketer.status === "active" ? "حساب نشط" : "حساب غير نشط"}
                </Badge>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">رقم الهاتف</p>
                    <p className="font-medium text-sm dir-ltr text-right">{marketer.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <span className="h-4 w-4 flex items-center justify-center text-muted-foreground font-serif">@</span>
                  </div>
                  <div className="text-right w-full overflow-hidden">
                    <p className="text-xs text-muted-foreground">البريد الإلكتروني</p>
                    <p className="font-medium text-sm truncate" title={marketer.email || ""}>
                      {marketer.email || "غير متوفر"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-muted p-2 rounded-full">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">تاريخ الانضمام</p>
                    <p className="font-medium text-sm">
                      {new Date(marketer.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* العمود الثاني والثالث: الإحصائيات المالية */}
          <div className="md:col-span-2 space-y-6">
            <Card className="h-full border-t-4 border-t-green-500 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  الأداء المالي والإحصائيات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* كارت إجمالي العمولات */}
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex flex-col justify-between hover:bg-green-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <span className="text-xs font-medium text-green-800 bg-green-200 px-2 py-1 rounded-full">الإجمالي</span>
                    </div>
                    <div>
                      <p className="text-sm text-green-700 mb-1">إجمالي العمولات</p>
                      <h3 className="text-2xl font-bold text-green-900">{formatPrice(marketer.totalCommission)} ج.م</h3>
                    </div>
                  </div>

                  {/* كارت العمولات المعلقة */}
                  <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col justify-between hover:bg-amber-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <span className="text-xs font-medium text-amber-800 bg-amber-200 px-2 py-1 rounded-full">رصيد متاح</span>
                    </div>
                    <div>
                      <p className="text-sm text-amber-700 mb-1">العمولات المعلقة (الحالية)</p>
                      <h3 className="text-2xl font-bold text-amber-900">{formatPrice(marketer.pendingCommission)} ج.م</h3>
                    </div>
                  </div>

                  {/* كارت العمولات المسحوبة */}
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between hover:bg-blue-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Check className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="text-xs font-medium text-blue-800 bg-blue-200 px-2 py-1 rounded-full">تم صرفه</span>
                    </div>
                    <div>
                      <p className="text-sm text-blue-700 mb-1">إجمالي مبالغ تم سحبها</p>
                      <h3 className="text-2xl font-bold text-blue-900">{formatPrice(marketer.withdrawnCommission)} ج.م</h3>
                    </div>
                  </div>

                  {/* كارت عدد الطلبات */}
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col justify-between hover:bg-purple-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        <ShoppingBag className="h-5 w-5 text-purple-600" />
                      </div>
                      <span className="text-xs font-medium text-purple-800 bg-purple-200 px-2 py-1 rounded-full">النشاط</span>
                    </div>
                    <div>
                      <p className="text-sm text-purple-700 mb-1">عدد الطلبات الناجحة</p>
                      <h3 className="text-2xl font-bold text-purple-900">{marketer.ordersCount} طلب</h3>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* تبويبات المعلومات */}
        <Tabs defaultValue="commissions" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="commissions">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                العمولات
              </div>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <div className="flex items-center gap-1">
                <ShoppingBag className="h-4 w-4" />
                الطلبات
              </div>
            </TabsTrigger>
            <TabsTrigger value="withdrawals">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                سجل السحب
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="commissions">
            <Card>
              <CardHeader>
                <CardTitle>العمولات</CardTitle>
                <CardDescription>
                  سجل العمولات الخاصة بالمسوق
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-10 text-muted-foreground">
                  سيتم إضافة سجل العمولات هنا
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>الطلبات ({marketerOrders?.length || 0})</CardTitle>
                <CardDescription>
                  قائمة الطلبات التي تمت من خلال المسوق
                </CardDescription>
              </CardHeader>
              <CardContent>
                {marketerOrders && marketerOrders.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الطلب</TableHead>
                          <TableHead className="text-center">العميل</TableHead>
                          <TableHead className="text-center">المبلغ</TableHead>
                          <TableHead className="text-center">العمولة</TableHead>
                          <TableHead className="text-center">التاريخ</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marketerOrders.map((order) => (
                          <TableRow key={order.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-right">{order.orderNumber}</TableCell>
                            <TableCell className="text-center">{order.customerName}</TableCell>
                            <TableCell className="text-center">{formatPrice(order.totalAmount)} ج.م</TableCell>
                            <TableCell className="text-center font-bold text-green-600">{formatPrice(Math.floor(order.commission))} ج.م</TableCell>
                            <TableCell className="text-center">{new Date(order.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={`${getStatusBadgeColor(order.status)} border-none`}>
                                {translateStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewOrder(order.id)}
                              >
                                عرض
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <ShoppingBag className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
                    <p>لا توجد طلبات لهذا المسوق حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>سجل السحب</CardTitle>
                  <CardDescription>
                    سجل عمليات سحب العمولات
                  </CardDescription>
                </div>
                {marketer.pendingCommission > 0 && (
                  <Button
                    onClick={handleOpenWithdrawalDialog}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    طلب سحب جديد
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {withdrawalRequests.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الطلب</TableHead>
                          <TableHead className="text-center">المبلغ</TableHead>
                          <TableHead className="text-center">طريقة الدفع</TableHead>
                          <TableHead className="text-center">تاريخ الطلب</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {withdrawalRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell className="font-medium text-right">{request.id}</TableCell>
                            <TableCell className="font-medium text-center">{formatPrice(request.amount)} ج.م</TableCell>
                            <TableCell className="text-center">{request.paymentMethod}</TableCell>
                            <TableCell className="text-center">{formatDate(request.requestDate)}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  request.status === "approved"
                                    ? "default"
                                    : request.status === "rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  request.status === "approved"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : request.status === "rejected"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                }
                              >
                                {request.status === "approved"
                                  ? "تمت الموافقة"
                                  : request.status === "rejected"
                                    ? "مرفوض"
                                    : "قيد الانتظار"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <DollarSign className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
                    <p>لا توجد طلبات سحب حتى الآن</p>
                    {marketer.pendingCommission > 0 && (
                      <Button
                        onClick={handleOpenWithdrawalDialog}
                        variant="outline"
                        className="mt-4"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        إنشاء طلب سحب
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* نافذة تعديل بيانات المسوق */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تعديل بيانات المسوق</DialogTitle>
              <DialogDescription>
                قم بتعديل بيانات المسوق. اضغط على زر "حفظ التغييرات" عند الانتهاء.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم المسوق</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedMarketer?.name || ""}
                  onChange={handleMarketerChange}
                  placeholder="أدخل اسم المسوق"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editedMarketer?.phone || ""}
                  onChange={handleMarketerChange}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editedMarketer?.email || ""}
                  onChange={handleMarketerChange}
                  placeholder="أدخل البريد الإلكتروني"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">الحالة</Label>
                <select
                  id="status"
                  name="status"
                  value={editedMarketer?.status || "active"}
                  onChange={(e) => {
                    if (editedMarketer) {
                      setEditedMarketer({
                        ...editedMarketer,
                        status: e.target.value as "active" | "inactive",
                      });
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveMarketer} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة تعديل العمولة */}
        <Dialog open={isCommissionDialogOpen} onOpenChange={setIsCommissionDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تعديل عمولة المسوق</DialogTitle>
              <DialogDescription>
                قم بتعديل عمولة المسوق {marketer?.name}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="commissionAdjustmentType">نوع التعديل</Label>
                <select
                  id="commissionAdjustmentType"
                  value={commissionAdjustmentType}
                  onChange={(e) => setCommissionAdjustmentType(e.target.value as "add" | "subtract" | "set")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="set">تعيين مبلغ محدد</option>
                  <option value="add">إضافة مبلغ</option>
                  <option value="subtract">خصم مبلغ</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commissionAmount">
                  {commissionAdjustmentType === "set" ? "المبلغ الجديد" :
                    commissionAdjustmentType === "add" ? "المبلغ المضاف" : "المبلغ المخصوم"}
                </Label>
                <div className="flex items-center">
                  <Input
                    id="commissionAmount"
                    type="number"
                    min="0"
                    step="1"
                    value={newCommissionAmount}
                    onChange={(e) => setNewCommissionAmount(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="mr-2 text-lg">ج.م</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  العمولة الحالية: {marketer?.pendingCommission} ج.م
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="commissionNote">ملاحظات (اختياري)</Label>
                <Input
                  id="commissionNote"
                  value={commissionNote}
                  onChange={(e) => setCommissionNote(e.target.value)}
                  placeholder="سبب تعديل العمولة"
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  {commissionAdjustmentType === "set" ?
                    `سيتم تعيين عمولة المسوق إلى ${newCommissionAmount} ج.م` :
                    commissionAdjustmentType === "add" ?
                      `سيتم إضافة ${newCommissionAmount} ج.م ليصبح الإجمالي ${marketer?.pendingCommission + newCommissionAmount} ج.م` :
                      `سيتم خصم ${newCommissionAmount} ج.م ليصبح الإجمالي ${Math.max(0, (marketer?.pendingCommission || 0) - newCommissionAmount)} ج.م`}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCommissionDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveCommission} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ التغييرات
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة طلب سحب جديد */}
        <Dialog open={isWithdrawalDialogOpen} onOpenChange={setIsWithdrawalDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>طلب سحب جديد</DialogTitle>
              <DialogDescription>
                إنشاء طلب سحب جديد للعمولات المتاحة
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ المطلوب سحبه</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    max={marketer.pendingCommission}
                    value={withdrawalData.amount}
                    onChange={handleWithdrawalDataChange}
                    className="flex-1"
                  />
                  <span className="mr-2 text-lg">ج.م</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  العمولة المتاحة: {marketer.pendingCommission} ج.م
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={withdrawalData.paymentMethod}
                  onChange={handleWithdrawalDataChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="فودافون كاش">فودافون كاش</option>
                  <option value="أورانج كاش">أورانج كاش</option>
                  <option value="اتصالات كاش">اتصالات كاش</option>
                  <option value="وي كاش">وي كاش</option>
                </select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="accountDetails">تفاصيل الحساب</Label>
                <Input
                  id="accountDetails"
                  name="accountDetails"
                  value={withdrawalData.accountDetails}
                  onChange={handleWithdrawalDataChange}
                  placeholder={
                    withdrawalData.paymentMethod === "تحويل بنكي"
                      ? "اسم البنك - رقم الحساب"
                      : "رقم الهاتف"
                  }
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <p className="text-sm text-amber-800">
                  سيتم إرسال طلب سحب بمبلغ {withdrawalData.amount} ج.م وسيتم مراجعته من قبل الإدارة.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsWithdrawalDialogOpen(false)}>
                إلغاء
              </Button>
              <Button
                onClick={handleCreateWithdrawalRequest}
                disabled={isSubmitting || withdrawalData.amount <= 0 || withdrawalData.amount > marketer.pendingCommission || !withdrawalData.accountDetails.trim()}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <Check className="ml-2 h-4 w-4" />
                    إنشاء طلب السحب
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MarketerDetailsPage;
