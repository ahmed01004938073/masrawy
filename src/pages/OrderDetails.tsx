import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Printer, Edit, Check, X, Clock, AlertTriangle, ZoomIn, Trash2, Archive, XCircle, Phone, Globe, MapPin, User, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageModal from "@/components/ui/image-modal";
import { Order, OrderStatus, OrderSection } from "./Orders";
import { getOrderById, updateOrderStatus, updateOrder, invalidateAllOrderQueries } from "@/services/orderService";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import OrderSummary from "@/components/orders/OrderSummary";
import OrderActions from "@/components/orders/OrderActions";
import PrintableInvoice from "@/components/orders/PrintableInvoice";
import { printInvoice, InvoiceData, CompanySettings } from "@/utils/invoiceTemplate";
import { fixOrderImages } from "@/services/imageFixService";
import { getSiteSettings } from "@/services/siteSettingsService";

// ترجمة حالة الطلب إلى العربية
const translateStatus = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: "قيد الانتظار",
    confirmed: "جاري التجهيز",
    processing: "جاري التجهيز",
    shipped: "قيد الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    suspended: "معلق",
    in_delivery: "جاري التوصيل",
    partially_delivered: "تسليم جزئي",
    delivery_rejected: "رفض الاستلام",
    returned: "مرتجع"
  };
  return statusMap[status] || status;
};

// ترجمة طريقة الدفع إلى العربية
const translatePaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    cash: "الدفع عند الاستلام",
    card: "بطاقة ائتمان",
    bank_transfer: "تحويل بنكي"
  };
  return methodMap[method || "cash"] || method || "الدفع عند الاستلام";
};

// ترجمة حالة الدفع إلى العربية
const translatePaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: "مدفوع",
    unpaid: "غير مدفوع",
    partially_paid: "مدفوع جزئياً"
  };
  return statusMap[status || "unpaid"] || status || "غير مدفوع";
};

// لون حالة الطلب
const getStatusColor = (status: OrderStatus): string => {
  const colorMap: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    suspended: "bg-gray-100 text-gray-800 border-gray-200",
    in_delivery: "bg-orange-100 text-orange-800 border-orange-200",
    partially_delivered: "bg-teal-100 text-teal-800 border-teal-200",
    delivery_rejected: "bg-rose-100 text-rose-800 border-rose-200",
    returned: "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colorMap[status] || "";
};

const OrderDetailsPage = () => {
  const { formatPrice } = usePriceFormatter();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { trackAction } = useAuth();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [originalSection, setOriginalSection] = useState<OrderSection | null>(null); // تخزين القسم الأصلي

  // حالة نافذة تأكيد الحذف
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("معرف الطلب غير صالح");
          return;
        }

        const orderData = await getOrderById(id);
        if (!orderData) {
          setError("الطلب غير موجود");
          return;
        }

        // تخزين القسم الأصلي عند تحميل الصفحة
        if (!originalSection) {
          setOriginalSection(orderData.section);
        }

        // إصلاح صور المنتجات في الطلب إذا لزم الأمر
        if (orderData.items && Array.isArray(orderData.items)) {
          orderData.items = orderData.items.map((item: any) => {
            if (item.image && item.image.startsWith('blob:')) {
              item.image = `https://api.dicebear.com/7.x/shapes/svg?seed=${item.id || 'item'}`;
              console.log(`🔧 تم إصلاح صورة منتج في الطلب: ${item.productName}`);
            }
            return item;
          });
        }

        setOrder(orderData);
      } catch (err) {
        setError("حدث خطأ أثناء جلب بيانات الطلب");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // Fetch shipping fee if 0 and province is available
  useEffect(() => {
    const fetchMissingShipping = async () => {
      if (order && (order.shippingFee === 0 || !order.shippingFee) && order.province) {
        // Import dynamically to avoid circular dependencies if any, or just use the imported one
        const { getShippingFee } = await import("@/services/collectionService");
        try {
          const fee = await getShippingFee(order.province, order.city);
          if (fee > 0) {
            console.log(`Updated displayed shipping fee from 0 to ${fee} for province ${order.province}`);
            setOrder(prev => prev ? { ...prev, shippingFee: fee } : null);
          }
        } catch (e) {
          console.error("Failed to fetch missing shipping fee", e);
        }
      }
    };

    if (order && !loading) {
      fetchMissingShipping();
    }
  }, [order?.id, order?.province, order?.city, loading]); // Depend on ID to avoid infinite loops, but check inside


  // Fetch company settings from API
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const settings = await getSiteSettings();
      return settings;
    },
  });

  // Use fetched settings or defaults
  const companySettings = {
    companyName: siteSettings?.companyName || siteSettings?.displayName || "شركة أفليت للتجارة الإلكترونية",
    companyLogo: siteSettings?.companyLogo || siteSettings?.logo || "/logo.png",
    companyPhone: siteSettings?.companyPhone || siteSettings?.contactPhone || "01XXXXXXXXX",
    companyEmail: siteSettings?.companyEmail || siteSettings?.contactEmail || "info@afleet.com",
    companyAddress: siteSettings?.companyAddress || siteSettings?.contactAddress || "القاهرة، مصر",

  };

  const handlePrintInvoice = () => {
    if (!order) return;

    try {
      // إعداد بيانات الفاتورة
      const invoiceData: InvoiceData = {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerPhone2: order.customerPhone2 || (order as any).alternativePhone,
        customerAddress: order.customerAddress,
        province: order.province,
        city: order.city,
        notes: [order.notes, order.customerNotes].filter(Boolean).join(' - '),
        items: order.items.map(item => ({
          id: item.id,
          name: item.productName || (item as any).name || "منتج",
          quantity: item.quantity,
          price: Number(item.price) || 0,
          total: Number(item.total) || 0,
          color: item.color,
          size: item.size
        })),
        subtotal: order.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0),
        shippingFee: Number(order.shippingFee) || 0,
        total: order.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) + (Number(order.shippingFee) || 0) - (Number(order.discount) || 0),
        paidAmount: Number(order.paid_amount) || 0,
        date: new Date(order.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }),
        page: order.page,

      };

      // إعداد بيانات الشركة
      const companyData: CompanySettings = {
        companyName: companySettings.companyName,
        companyLogo: companySettings.companyLogo,
        companyPhone: companySettings.companyPhone,
        companyEmail: companySettings.companyEmail,
        companyAddress: companySettings.companyAddress,

      };

      // طباعة الفاتورة
      printInvoice(invoiceData, companyData);

      // تتبع الحركة
      trackAction("طباعة فاتورة");

      toast.success("جاري طباعة الفاتورة");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حدث خطأ أثناء طباعة الفاتورة");
    }
  };

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order || !id) return;

    try {
      // تحديث حالة الطلب - هذه الدالة تقوم بتحديث القسم أيضًا
      const updatedOrder = await updateOrderStatus(id, newStatus);

      // تتبع الحركة
      trackAction(`تعديل حالة (${translateStatus(newStatus)})`);

      // تحديث البيانات المحلية
      if (updatedOrder) {
        setOrder(updatedOrder);
      }

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      toast.success(`تم تغيير حالة الطلب إلى ${translateStatus(newStatus)}`);

      // إظهار رسائل إعلامية فقط بدون توجيه تلقائي
      if (newStatus === "confirmed") {
        toast.info("تم تحويل الطلب إلى قسم المخازن للتجهيز");
      } else if (newStatus === "shipped") {
        toast.info("تم تحويل الطلب إلى قسم الشحن");
      } else if (newStatus === "processing") {
        toast.info("تم بدء تجهيز الطلب");
      }
    } catch (err) {
      toast.error("حدث خطأ أثناء تحديث حالة الطلب");
    }
  };

  // وظيفة حذف الطلب وتحويله للأرشيف
  const handleDeleteOrder = async () => {
    if (!order || !id) return;

    if (!deleteReason.trim()) {
      toast.error("يرجى إدخال سبب الحذف");
      return;
    }

    try {
      setIsDeleting(true);

      // تحديث الطلب: تغيير الحالة إلى "ملغي" وتحويله إلى قسم الأرشيف
      // 1. تحديث الملاحظات أولاً (سبب الحذف)
      const orderWithNotes = {
        ...order,
        notes: order.notes
          ? `${order.notes}\n\nسبب الحذف: ${deleteReason}`
          : `سبب الحذف: ${deleteReason}`,
        updatedAt: new Date().toISOString()
      };
      await updateOrder(orderWithNotes);

      // 2. تغيير الحالة إلى "ملغي" باستخدام الخدمة المركزية
      // هذا سيقوم تلقائياً:
      // - تغيير القسم إلى الأرشيف
      // - إرجاع المخزون (لأن الحالة أصبحت cancelled)
      // - إرسال الإشعارات
      await updateOrderStatus(id, "cancelled");

      // تتبع الحركة
      trackAction("حذف طلب للأرشيف");

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      toast.success("تم حذف الطلب وتحويله إلى الأرشيف");

      // إغلاق نافذة الحوار والعودة إلى الصفحة السابقة
      setIsDeleteDialogOpen(false);
      navigate(-1);
    } catch (err) {
      toast.error("حدث خطأ أثناء حذف الطلب");
    } finally {
      setIsDeleting(false);
    }
  };


  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">جاري تحميل بيانات الطلب...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold mt-4">{error || "حدث خطأ غير متوقع"}</h2>
            <Button
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(-1)}
            >
              العودة للخلف
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              طلب #{order.orderNumber}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {translateStatus(order.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                تم الإنشاء في {new Date(order.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* زر تعديل الطلب - يظهر فقط للطلبات التي لم تصل لمرحلة التوصيل */}
            {!["in_delivery", "delivered", "partially_delivered", "delivery_rejected"].includes(order.status) && (
              <Button
                variant="default"
                className="gap-2"
                onClick={() => navigate(`/admin/orders/edit/${order.id}`)}
              >
                <Edit className="h-4 w-4" />
                تعديل الطلب
              </Button>
            )}



            {order.section !== 'orders' && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={handlePrintInvoice}
              >
                <Printer className="h-4 w-4" />
                طباعة الفاتورة
              </Button>
            )}

            <Button
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => navigate(-1)}
            >
              <XCircle className="h-4 w-4" />
              إغلاق
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* معلومات العميل */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* الاسم والهاتف */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">اسم العميل</p>
                      <p className="font-semibold text-gray-800">{order.customerName || "غير محدد"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">رقم الهاتف الأساسي</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{order.customerPhone || "غير محدد"}</p>
                        {order.customerPhone && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 h-auto hover:bg-green-100"
                            onClick={() => {
                              const phoneNumber = '20' + (order.customerPhone || '').replace(/\D/g, '');
                              window.location.href = `tel:${phoneNumber}`;
                            }}
                          >
                            <Phone className="h-4 w-4 text-green-600" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {(order.customerPhone2 || (order as any).alternativePhone) && (
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3 flex-1 min-w-[200px]">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <Phone className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">رقم الهاتف البديل</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-800">{order.customerPhone2 || (order as any).alternativePhone}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="p-1 h-auto hover:bg-emerald-100"
                            onClick={() => {
                              const phoneNumber2 = '20' + (order.customerPhone2 || (order as any).alternativePhone || '').replace(/\D/g, '');
                              window.location.href = `tel:${phoneNumber2}`;
                            }}
                          >
                            <Phone className="h-4 w-4 text-emerald-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* الموقع */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">الموقع</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white rounded-md px-3 py-2 shadow-sm">
                      <p className="text-xs text-gray-500">المحافظة</p>
                      <p className="font-medium">{order.province || "غير محدد"}</p>
                    </div>
                    <div className="bg-white rounded-md px-3 py-2 shadow-sm">
                      <p className="text-xs text-gray-500">المدينة</p>
                      <p className="font-medium">{order.city || "غير محدد"}</p>
                    </div>
                    <div className="bg-white rounded-md px-3 py-2 shadow-sm col-span-2 md:col-span-1">
                      <p className="text-xs text-gray-500">العنوان التفصيلي</p>
                      <p className="font-medium text-sm">{order.customerAddress || "غير محدد"}</p>
                    </div>
                  </div>
                </div>

                {/* اسم الصفحة والملاحظات */}
                <div className="flex flex-wrap gap-4">
                  {order.page && (
                    <div className="flex items-center gap-3 bg-blue-50 rounded-lg px-4 py-3 border border-blue-200 flex-1 min-w-[200px]">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Globe className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs text-blue-600">مصدر الطلب (الصفحة)</p>
                        <p className="font-bold text-blue-800 text-lg">{order.page}</p>
                      </div>
                    </div>
                  )}
                  {(order.customerNotes || order.notes || (order as any).customer_notes) && (
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200 flex-1 min-w-[200px]">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-4 w-4 text-yellow-600" />
                        <span className="font-medium text-yellow-800">ملاحظات العميل</span>
                      </div>
                      <p className="text-gray-700">{order.customerNotes || order.notes || (order as any).customer_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المسوق */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المسوق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* الاسم والمعرف */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-4 py-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">اسم المسوق</p>
                      <p className="font-semibold text-slate-800">{order.marketerName || (order as any).marketer_name || "غير محدد"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-100 rounded-lg px-4 py-3 flex-1 min-w-[200px]">
                    <div className="w-10 h-10 bg-slate-500 rounded-full flex items-center justify-center">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">معرف المسوق</p>
                      <p className="font-semibold text-slate-700 text-sm">{order.marketerId || (order as any).marketer_id || "غير محدد"}</p>
                    </div>
                  </div>
                </div>

                {/* رقم الهاتف والعمولة */}
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-3 bg-emerald-50 rounded-lg px-4 py-3 flex-1 min-w-[200px] border border-emerald-200">
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-emerald-600">رقم الهاتف</p>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-emerald-800">{(order as any).marketerPhone || "غير مسجل"}</p>
                            {(order as any).marketerPhone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-auto bg-green-100 hover:bg-green-200"
                                onClick={() => {
                                  const phoneNumber = '20' + ((order as any).marketerPhone || '').replace(/\D/g, '');
                                  window.location.href = `tel:${phoneNumber}`;
                                }}
                              >
                                <Phone className="h-4 w-4 text-emerald-600" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="p-2 h-auto bg-green-100 hover:bg-green-200 rounded-full"
                          title="إرسال رسالة واتساب للمسوق"
                          onClick={() => {
                            const marketerName = order.marketerName || (order as any).marketer_name || "المسوق";
                            const customerName = order.customerName;
                            const customerPhones = `${order.customerPhone}${order.customerPhone2 ? `, ${order.customerPhone2}` : ''}`;
                            const customerAddress = order.customerAddress;
                            const totalAmount = order.totalAmount;
                            const commission = Number(order.commission || 0);

                            let message = `مرحباً ${marketerName} 👋\n\n`;
                            message += `تحديث بخصوص طلب العميل: ${customerName}\n\n`;
                            message += `📌 بيانات العميل:\n`;
                            message += `الاسم: ${customerName}\n`;
                            message += `الهاتف: ${customerPhones}\n`;
                            message += `العنوان: ${customerAddress}\n\n`;
                            message += `💰 الإجمالي: ${formatPrice(totalAmount)} ج.م\n`;
                            message += `🔸 عمولتك: ${formatPrice(commission)} ج.م\n\n`;

                            const encodedMessage = encodeURIComponent(message);
                            const targetPhone = (order as any).marketerPhone || (order as any).marketer_phone || '';
                            const whatsappUrl = targetPhone
                              ? `whatsapp://send?phone=20${targetPhone.replace(/\D/g, '')}&text=${encodedMessage}`
                              : `https://wa.me/?text=${encodedMessage}`;

                            window.open(whatsappUrl, '_blank');
                          }}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                          </svg>
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-amber-50 rounded-lg px-4 py-3 flex-1 min-w-[200px] border border-amber-200">
                    <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">💰</span>
                    </div>
                    <div>
                      <p className="text-xs text-amber-600">العمولة</p>
                      <p className="font-bold text-amber-700 text-lg">{formatPrice(order.commission)} ج.م</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الطلب */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>تفاصيل الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 cursor-pointer relative group"
                      onClick={() => {
                        setSelectedImage(item.image || "/placeholder.svg");
                        setIsImageModalOpen(true);
                      }}
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.productName || (item as any).name}</h3>
                        {/* إضافة علامة صح للمنتجات المسلمة في حالة التسليم الجزئي */}
                        {order.status === "partially_delivered" && (
                          item.delivered ? (
                            <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              تم التسليم
                            </Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                              <X className="h-3 w-3" />
                              لم يتم التسليم
                            </Badge>
                          )
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {item.color && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            🎨 اللون: {item.color}
                          </span>
                        )}
                        {item.size && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            📏 المقاس: {item.size}
                          </span>
                        )}
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                          💰 السعر: {formatPrice(item.price)} ج.م
                        </span>
                        {item.sku && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200">
                            🆔 كود: {item.sku}
                          </span>
                        )}
                      </div>
                      {/* إضافة سبب الرفض إذا كان موجودًا */}
                      {order.status === "partially_delivered" && !item.delivered && item.rejectionReason && (
                        <div className="text-sm text-red-600 mt-1">
                          سبب الرفض: {item.rejectionReason}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-medium border rounded-full">
                        {item.quantity}
                      </span>
                      <p className="text-sm font-medium mt-1">{formatPrice(item.total)} ج.م</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ملخص الطلب */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummary
                productTotal={order.items.reduce((sum, item) => sum + item.total, 0)}
                shippingFee={order.shippingFee}
                discount={order.discount || 0}
                commission={order.commission}
                paidAmount={order.paid_amount || 0}
                province={order.province}
                items={order.items}
              />

            </CardContent>
          </Card>
        </div>

        {/* إجراءات الطلب */}
        <Card>
          <CardHeader>
            <CardTitle>إجراءات الطلب</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderActions
              order={order}
              originalSection={originalSection || order?.section} // استخدام القسم الأصلي
              onStatusChange={handleStatusChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={selectedImage || "/placeholder.svg"}
        title="صورة المنتج"
      />

      {/* Printable Invoice - Hidden until print */}
      {
        order && (
          <PrintableInvoice
            order={order}
            companyName={companySettings.companyName}
            companyLogo={companySettings.companyLogo}
            companyPhone={companySettings.companyPhone}
            companyEmail={companySettings.companyEmail}
            companyAddress={companySettings.companyAddress}

          />
        )
      }

      {/* نافذة تأكيد حذف الطلب */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl text-red-600">تأكيد حذف الطلب</DialogTitle>
            <DialogDescription>
              أنت على وشك حذف الطلب #{order?.orderNumber} وتحويله إلى الأرشيف. هذا الإجراء لا يمكن التراجع عنه.
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

export default OrderDetailsPage;

