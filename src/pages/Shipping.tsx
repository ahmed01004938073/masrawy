import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, Package, Check, X, ArrowLeft, ArrowRight, Send, AlertCircle, Trash2, Archive, AlertTriangle, ExternalLink, MessageCircle, CheckCircle, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Order, OrderStatus, OrderSection } from "@/pages/Orders";
import { getOrders, updateOrderStatus, updateOrder, invalidateAllOrderQueries } from "@/services/orderService";
import { getShippingCompanies, openShippingCompanyWebsite } from "@/services/collectionService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ShippingCompany } from "@/types/shipping";

const ShippingPage = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { trackAction } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deliveryStatus, setDeliveryStatus] = useState<"in_delivery" | "delivered" | "partial" | "returned" | "cancelled">("in_delivery");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [otherCompanyName, setOtherCompanyName] = useState("");
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [copiedOrders, setCopiedOrders] = useState<Set<string>>(new Set()); // تتبع الطلبات المنسوخة
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 20;

  // تحميل شركات الشحن من API
  useEffect(() => {
    const fetchCompanies = async () => {
      const companies = await getShippingCompanies();
      setShippingCompanies(companies);
    };
    fetchCompanies();
  }, []);

  // تحميل حالة الطلبات المنسوخة من sessionStorage عند تحميل الصفحة
  useEffect(() => {
    const savedCopiedOrders = sessionStorage.getItem('copiedOrders');
    if (savedCopiedOrders) {
      try {
        const parsedOrders = JSON.parse(savedCopiedOrders);
        setCopiedOrders(new Set(parsedOrders));
      } catch (error) {
        console.error('خطأ في تحميل الطلبات المنسوخة:', error);
      }
    }
  }, []);

  // حفظ حالة الطلبات المنسوخة في sessionStorage عند التغيير
  useEffect(() => {
    if (copiedOrders.size > 0) {
      sessionStorage.setItem('copiedOrders', JSON.stringify([...copiedOrders]));
    }
  }, [copiedOrders]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // جلب الطلبات من API
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["shipping-orders", currentPage, searchQuery],
    queryFn: async () => {
      // Fetching all orders that might be in shipping section
      // Since backend doesn't support section filter yet, we fetch with status if possible
      // or just fetch paginated and filter. 
      // Most shipping orders have status 'shipped'.
      return getOrders(currentPage, ORDERS_PER_PAGE, searchQuery);
    },
    refetchInterval: 10000,
  });

  const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
  const totalItems = Array.isArray(ordersResponse) ? ordersResponse.length : (ordersResponse?.total || 0);
  const totalPages = Array.isArray(ordersResponse) ? Math.ceil(ordersResponse.length / ORDERS_PER_PAGE) : (ordersResponse?.totalPages || 1);

  // الحصول على الطلبات التي تنتمي إلى قسم الشحن
  const shippingOrders = orders.filter(order => order.section === "shipping");
  const paginatedOrders = shippingOrders;

  // New variables for UI display
  const totalOrders = totalItems;
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + paginatedOrders.length;

  // إعادة تعيين الصفحة الحالية إذا أصبحت خارج النطاق
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // تنظيف الطلبات المنسوخة التي لم تعد موجودة في قسم الشحن
  useEffect(() => {
    if (shippingOrders.length > 0 && copiedOrders.size > 0) {
      const currentOrderIds = new Set(shippingOrders.map(order => order.id));
      const filteredCopiedOrders = new Set([...copiedOrders].filter(id => currentOrderIds.has(id)));

      if (filteredCopiedOrders.size !== copiedOrders.size) {
        setCopiedOrders(filteredCopiedOrders);
        if (filteredCopiedOrders.size === 0) {
          localStorage.removeItem('copiedOrders');
        }
      }
    }
  }, [shippingOrders, copiedOrders]);

  // تحديث حالة الطلب
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // تحديث حالة الطلب في التخزين المحلي
      await updateOrderStatus(orderId, newStatus);

      // تحديث البيانات في واجهة المستخدم
      queryClient.invalidateQueries({ queryKey: ["shipping-orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["warehouse-orders"] });

      toast.success(`تم تحديث حالة الطلب بنجاح`);
    } catch (error) {
      toast.error(`حدث خطأ أثناء تحديث حالة الطلب`);
    }
  };

  // فتح نافذة تحديد شركة الشحن
  const openShippingDialog = (order: Order) => {
    setSelectedOrder(order);
    setShippingCompany("");
    setTrackingNumber("");
    setOtherCompanyName("");
    setIsShippingDialogOpen(true);
  };

  // فتح نافذة تسليم الطلب
  const openDeliveryDialog = (order: Order) => {
    setSelectedOrder(order);
    setDeliveryStatus("in_delivery");
    setDeliveryNotes("");
    setIsDeliveryDialogOpen(true);
  };

  // فتح نافذة حذف الطلب
  const openDeleteDialog = (order: Order) => {
    setSelectedOrder(order);
    setDeleteReason("");
    setIsDeleteDialogOpen(true);
  };

  // معالجة تحديد شركة الشحن
  const handleShippingSubmit = async () => {
    if (!selectedOrder) return;

    try {
      // تحديث بيانات الطلب
      const updatedOrder = {
        ...selectedOrder,
        shippingCompany: shippingCompany === "other" ? otherCompanyName : shippingCompany,
        trackingNumber: trackingNumber,
        shippingDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // تحديث الطلب في التخزين المحلي
      await updateOrder(updatedOrder);

      // تحديث جميع الاستعلامات ذات الصلة
      await queryClient.invalidateQueries({ queryKey: ["shipping-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["orders"] });

      // تتبع الحركة
      trackAction("تحديد شركة شحن");

      toast.success("تم تحديد شركة الشحن بنجاح");

      // إغلاق النافذة
      setIsShippingDialogOpen(false);
    } catch (error) {
      console.error("Error updating shipping:", error);
      toast.error("حدث خطأ أثناء تحديث بيانات الشحن");
    }
  };

  // معالجة تسليم الطلب
  const handleDeliverySubmit = async () => {
    if (!selectedOrder) return;

    // Optimistic Update: Immediately remove the order from the list
    const previousOrders = queryClient.getQueryData<Order[]>(["shipping-orders"]);
    queryClient.setQueryData<Order[]>(["shipping-orders"], (old) => {
      return old ? old.filter(o => o.id !== selectedOrder.id) : [];
    });

    try {
      // تحديث قسم الطلب يدويًا إلى "delivery"
      const updatedOrder = {
        ...selectedOrder,
        status: deliveryStatus as OrderStatus,
        section: "delivery" as OrderSection, // This automatically filters it out of shipping-orders on refetch
        deliveryNotes: deliveryNotes || selectedOrder.deliveryNotes,
        updatedAt: new Date().toISOString()
      };

      // تحديث الطلب في التخزين المحلي
      await updateOrder(updatedOrder);

      // تحديث جميع الاستعلامات ذات الصلة لضمان التزامن
      invalidateAllOrderQueries(queryClient);

      // إذا كانت الحالة "جاري التوصيل"، أظهر رسالة إضافية
      if (deliveryStatus === "in_delivery") {
        toast.success(`تم تحديث حالة الطلب إلى ${getDeliveryStatusText(deliveryStatus)}`);
        toast.info("تم نقل الطلب إلى قسم جاري التوصيل");
        // تتبع الحركة
        trackAction("تحويل لجاري التوصيل");
      } else {
        toast.success(`تم تحديث حالة الطلب إلى ${getDeliveryStatusText(deliveryStatus)}`);
        // تتبع الحركة
        trackAction(`تغيير حالة شحن (${getDeliveryStatusText(deliveryStatus)})`);
      }

      // إغلاق النافذة
      setIsDeliveryDialogOpen(false);
    } catch (error) {
      // Rollback on error
      if (previousOrders) {
        queryClient.setQueryData(["shipping-orders"], previousOrders);
      }
      toast.error(`حدث خطأ أثناء تحديث حالة الطلب`);
      // Refetch to ensure consistency
      invalidateAllOrderQueries(queryClient);
    }
  };

  // معالجة حذف الطلب وتحويله للأرشيف
  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;

    if (!deleteReason.trim()) {
      toast.error("يرجى إدخال سبب الحذف");
      return;
    }

    try {
      setIsDeleting(true);

      // تحديث الطلب: تغيير الحالة إلى "ملغي" وتحويله إلى قسم الأرشيف
      const updatedOrder = {
        ...selectedOrder,
        status: "cancelled" as OrderStatus,
        section: "archive" as OrderSection,
        notes: selectedOrder.notes
          ? `${selectedOrder.notes}\n\nسبب الحذف: ${deleteReason}`
          : `سبب الحذف: ${deleteReason}`,
        updatedAt: new Date().toISOString()
      };

      // تحديث الطلب في التخزين المحلي
      await updateOrder(updatedOrder);

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      // تتبع الحركة
      trackAction("حذف طلب للأرشيف");

      toast.success("تم حذف الطلب وتحويله إلى الأرشيف");

      // إغلاق نافذة الحوار
      setIsDeleteDialogOpen(false);
    } catch (err) {
      toast.error("حدث خطأ أثناء حذف الطلب");
    } finally {
      setIsDeleting(false);
    }
  };

  // فتح موقع شركة الشحن مع نسخ بيانات العميل
  const handleOpenShippingWebsite = async (order: Order) => {
    if (!order.shippingCompany) {
      toast.error("لم يتم تحديد شركة الشحن لهذا الطلب");
      return;
    }

    // تنسيق البيانات للنسخ
    const productName = order.items && order.items.length > 0 ? order.items[0].productName : "منتج غير محدد";
    const quantity = order.items && order.items.length > 0 ? order.items[0].quantity : 1;
    const productPrice = order.totalAmount - (order.shippingFee || 0);

    const customerData = `📦 طلب شحن جديد
👤 العميل: ${order.customerName}
📱 الهاتف: ${order.customerPhone}
📍 العنوان: ${order.customerAddress}
🏙️ المحافظة: ${order.province || ""} - ${order.city || ""}

📋 تفاصيل الطلب:
🛍️ اسم المنتج: ${productName}
📦 عدد القطع: ${quantity} قطعة
💰 المبلغ: ${formatPrice(productPrice)} ج.م
🚚 الشحن: ${formatPrice(order.shippingFee || 0)} ج.م
💳 الإجمالي: ${formatPrice(order.totalAmount)} ج.م

📝 ملاحظات: ${order.notes || "لا توجد"}`;

    try {
      console.log('🔄 بدء عملية النسخ...');
      console.log('📋 البيانات المراد نسخها:', customerData);

      // نسخ البيانات للحافظة
      if (navigator.clipboard && window.isSecureContext) {
        console.log('✅ استخدام Clipboard API الحديث');
        await navigator.clipboard.writeText(customerData);
        console.log('✅ تم النسخ بنجاح باستخدام Clipboard API');
      } else {
        console.log('⚠️ استخدام الطريقة الاحتياطية للنسخ');
        // طريقة احتياطية للنسخ
        const textArea = document.createElement('textarea');
        textArea.value = customerData;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('✅ تم النسخ بنجاح باستخدام execCommand:', success);
      }

      // إضافة الطلب للقائمة المنسوخة
      setCopiedOrders(prev => new Set([...prev, order.id]));

      // فتح موقع الشركة أو الواتساب
      await openShippingCompanyWebsite(order.shippingCompany, {
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress,
        province: order.province || "",
        city: order.city || "",
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        notes: order.notes
      });

      toast.success("تم نسخ بيانات العميل وفتح موقع شركة الشحن");
    } catch (err) {
      toast.error("فشل في نسخ البيانات");
      console.error('خطأ في النسخ:', err);
    }
  };

  // الحصول على نص حالة التسليم
  const getDeliveryStatusText = (status: string): string => {
    switch (status) {
      case "in_delivery": return "جاري التوصيل";
      case "delivered": return "تم التسليم";
      case "partial": return "تسليم جزئي";
      case "returned": return "مرتجع";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  // الحصول على لون حالة الطلب
  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "in_delivery": return "bg-orange-100 text-orange-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // الحصول على نص حالة الطلب
  const getStatusText = (status: OrderStatus): string => {
    switch (status) {
      case "shipped": return "تم الشحن";
      case "in_delivery": return "جاري التوصيل";
      case "delivered": return "تم التسليم";
      case "cancelled": return "ملغي";
      default: return status;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Search Bar */}
        <div className="sticky top-0 z-20 -mx-6 px-6 py-4 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">قسم الشحن</h1>
              <p className="text-gray-500 mt-1">إدارة طلبات الشحن والتوصيل</p>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3 lg:max-w-md w-full">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ابحث بالاسم، رقم الهاتف، أو كود الطلب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              {searchQuery && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSearchQuery("")}
                    className="border-gray-300 hover:bg-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-blue-600 bg-blue-100 px-3 py-1.5 rounded-full whitespace-nowrap">
                    {shippingOrders.length} نتيجة
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* قائمة الطلبات */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-600" />
              طلبات قيد الشحن ({shippingOrders.length})
            </CardTitle>
            {searchQuery && (
              <CardDescription>
                نتائج البحث عن: "{searchQuery}"
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="max-h-[calc(100vh-280px)] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>جاري تحميل البيانات...</span>
                </div>
              </div>
            ) : shippingOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-4">
                  {searchQuery ? (
                    <>
                      <Search className="h-12 w-12 text-gray-300" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-600">لا توجد نتائج</h3>
                        <p className="text-gray-500 mt-1">لا توجد طلبات تطابق البحث "{searchQuery}"</p>
                        <Button
                          variant="outline"
                          onClick={() => setSearchQuery("")}
                          className="mt-3"
                        >
                          مسح البحث
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <Truck className="h-12 w-12 text-gray-300" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-600">لا توجد طلبات</h3>
                        <p className="text-gray-500 mt-1">لا توجد طلبات في قسم الشحن حالياً</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {paginatedOrders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            طلب #{order.orderNumber}
                          </h3>
                          <div className="mt-1 text-sm text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString("ar-EG")}
                          </div>
                        </div>

                        <Badge className={getStatusColor(order.status)}>
                          {getStatusText(order.status)}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* بيانات العميل */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 mb-1">العميل</div>
                            <div className="font-semibold text-gray-900">{order.customerName}</div>
                            <div className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                              <span className="opacity-60">📱</span>
                              <span>{order.customerPhone}</span>
                            </div>
                          </div>
                        </div>

                        {/* العنوان */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs text-gray-500 mb-0.5">العنوان</div>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {order.customerAddress}
                            </p>
                            {(order.province || order.city) && (
                              <p className="text-xs text-gray-500 mt-1">
                                {order.province} - {order.city}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* المبلغ الإجمالي */}
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                          </div>
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">المبلغ الإجمالي</div>
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-gray-900">
                                {Math.round(
                                  (order.totalAmount || (
                                    order.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) +
                                    (Number(order.shippingFee) || 0) -
                                    (Number(order.discount) || 0)
                                  )) - (order.paid_amount || 0)
                                )}
                              </span>
                              <span className="text-sm font-medium text-gray-600">ج.م مطلوب تحصيله</span>
                            </div>
                            {order.paid_amount > 0 && (
                              <div className="text-xs text-green-600 mt-1">
                                (تم خصم {formatPrice(order.paid_amount)} مدفوعة مسبقاً)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          عرض التفاصيل
                        </Button>

                        {/* أيقونة شركة الشحن - تظهر فقط إذا كان هناك موقع أو واتساب */}
                        {order.shippingCompany && (() => {
                          const company = shippingCompanies.find(c => c.id === order.shippingCompany);
                          // إظهار الزر فقط إذا كان هناك موقع أو واتساب
                          if (!company || (!company.website && !company.whatsapp && !company.phone)) return null;

                          return (
                            <Button
                              variant="outline"
                              size="sm"
                              className={
                                copiedOrders.has(order.id)
                                  ? "bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
                                  : "bg-blue-50 hover:bg-blue-100 border-blue-200"
                              }
                              onClick={() => handleOpenShippingWebsite(order)}
                              title={
                                copiedOrders.has(order.id)
                                  ? `تم نسخ البيانات - ${company.name}`
                                  : `فتح رابط ${company.name}`
                              }
                            >
                              {copiedOrders.has(order.id) ? (
                                <CheckCircle className="ml-2 h-4 w-4 text-yellow-600" />
                              ) : company.website ? (
                                <ExternalLink className="ml-2 h-4 w-4 text-blue-600" />
                              ) : (
                                <MessageCircle className="ml-2 h-4 w-4 text-green-600" />
                              )}
                              {company.name}
                              {copiedOrders.has(order.id) && (
                                <span className="mr-2 text-yellow-600">✓</span>
                              )}
                            </Button>
                          );
                        })()}

                        {order.status === "shipped" && !order.shippingCompany && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => openShippingDialog(order)}
                          >
                            <Truck className="ml-2 h-4 w-4" />
                            تحديد شركة الشحن
                          </Button>
                        )}

                        {order.status === "shipped" && order.shippingCompany && (
                          <Button
                            variant="default"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => openDeliveryDialog(order)}
                          >
                            <Send className="ml-2 h-4 w-4" />
                            تحويل إلى جاري التوصيل
                          </Button>
                        )}

                        {/* زر حذف الطلب */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(order)}
                        >
                          <Trash2 className="ml-2 h-4 w-4" />
                          حذف الطلب
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalOrders > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* Order count info */}
                  <div className="text-sm text-gray-600">
                    عرض {startIndex + 1}-{Math.min(endIndex, totalOrders)} من {totalOrders} طلب
                  </div>

                  {/* Page navigation */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-3"
                      >
                        السابق
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => {
                          // Show first page, last page, current page, and pages around current
                          const showPage =
                            pageNum === 1 ||
                            pageNum === totalPages ||
                            Math.abs(pageNum - currentPage) <= 1;

                          if (!showPage) {
                            // Show ellipsis
                            if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                              return <span key={pageNum} className="px-2 text-gray-400">...</span>;
                            }
                            return null;
                          }

                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3"
                      >
                        التالي
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نافذة تحديد شركة الشحن */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تحديد شركة الشحن</DialogTitle>
            <DialogDescription>
              حدد شركة الشحن ورقم التتبع للطلب #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="shipping-company">شركة الشحن</Label>
              <Select
                value={shippingCompany}
                onValueChange={(val) => {
                  console.log("Selected company:", val);
                  setShippingCompany(val);
                }}
              >
                <SelectTrigger id="shipping-company">
                  <SelectValue placeholder="اختر شركة الشحن" />
                </SelectTrigger>
                <SelectContent>
                  {shippingCompanies.length > 0 ? (
                    <>
                      {shippingCompanies.map((company) => (
                        <SelectItem key={company.id} value={String(company.id)}>
                          {company.name}
                        </SelectItem>
                      ))}
                      <SelectItem value="other">شركة أخرى</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="other">شركة أخرى</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {shippingCompany === "other" && (
              <div className="grid gap-2">
                <Label htmlFor="other-company">اسم الشركة</Label>
                <Input
                  id="other-company"
                  value={otherCompanyName}
                  onChange={(e) => setOtherCompanyName(e.target.value)}
                  placeholder="أدخل اسم شركة الشحن"
                />
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="tracking-number">رقم التتبع</Label>
              <Input
                id="tracking-number"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="أدخل رقم التتبع (اختياري)"
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>ملاحظة</AlertTitle>
              <AlertDescription>
                بعد تحديد شركة الشحن، يمكنك تحويل الطلب إلى قسم "جاري التوصيل"
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShippingDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleShippingSubmit}
              disabled={!shippingCompany || (shippingCompany === "other" && !otherCompanyName)}
            >
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تحويل الطلب إلى جاري التوصيل */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>تحويل الطلب إلى جاري التوصيل</DialogTitle>
            <DialogDescription>
              تأكيد تحويل الطلب #{selectedOrder?.orderNumber} إلى قسم جاري التوصيل
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="delivery-notes">ملاحظات إضافية</Label>
              <Textarea
                id="delivery-notes"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="أدخل أي ملاحظات إضافية (اختياري)"
              />
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">معلومات الشحن</AlertTitle>
              <AlertDescription className="text-blue-700">
                شركة الشحن: {selectedOrder?.shippingCompany && (
                  shippingCompanies.find(c => c.id === selectedOrder.shippingCompany)?.name || selectedOrder.shippingCompany
                )}
                {selectedOrder?.trackingNumber && (
                  <div>رقم التتبع: {selectedOrder.trackingNumber}</div>
                )}
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeliveryDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleDeliverySubmit}
              className="bg-green-600 hover:bg-green-700"
            >
              تأكيد التحويل
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد حذف الطلب */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">تأكيد حذف الطلب</DialogTitle>
            <DialogDescription>
              أنت على وشك حذف الطلب #{selectedOrder?.orderNumber} وتحويله إلى الأرشيف. هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 ml-2" />
                <div>
                  <h4 className="font-medium text-amber-800">تنبيه هام</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    سيتم تغيير حالة الطلب إلى "ملغي" وتحويله إلى قسم أرشيف الطلبات.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-reason" className="text-base">سبب الحذف <span className="text-red-500">*</span></Label>
              <Textarea
                id="delete-reason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="يرجى كتابة سبب حذف الطلب..."
                className="min-h-[100px]"
              />
              {!deleteReason.trim() && (
                <p className="text-sm text-red-500">سبب الحذف مطلوب</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={isDeleting || !deleteReason.trim()}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full ml-1"></span>
                  جاري الحذف...
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  تأكيد الحذف والأرشفة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};

export default ShippingPage;

