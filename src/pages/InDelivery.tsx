import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProducts, increaseStock } from "@/services/productService";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Order, OrderStatus, OrderItem } from "./Orders";
import { getOrdersBySection, getOrdersBySections, updateOrderStatus, updateOrder, invalidateAllOrderQueries, OrderSection } from "@/services/orderService";
import { sendNotification, getNotifications, markNotificationAsRead } from "@/services/notificationService";
import { getMarketerById, getMarketers, getCommissions, addOrderCommission } from "@/services/marketerService";
import { getShippingCompanies } from "@/services/collectionService";
import { ShippingCompany } from "@/types/shipping";
import { Search, Truck, Package, CheckCircle, XCircle, AlertTriangle, Edit, ShoppingBag, Info, ArrowUpDown, ChevronDown, ChevronUp, Filter, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import * as XLSX from "xlsx";

// أسباب رفض الاستلام
const rejectionReasons = [
  "العميل غير موجود",
  "المنتج غير مطابق للمواصفات",
  "تغيير رأي العميل",
  "مشكلة في الدفع",
  "عدم توفر المبلغ المطلوب",
  "أخرى"
];

// أسباب إلغاء الطلب
const cancellationReasons = [
  "العميل لايرد على اتصال المندوب",
  "المقاس غير مناسب",
  "هاتف العميل مغلق باستمرار",
  "العميل طلب الغاء الاوردر",
  "أخرى"
];

import { usePriceFormatter } from "@/hooks/usePriceFormatter";

const InDeliveryPage = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDeliveryDialogOpen, setIsDeliveryDialogOpen] = useState(false);
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isPartialDeliveryDialogOpen, setIsPartialDeliveryDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [deliveredItems, setDeliveredItems] = useState<Record<string, boolean>>({});
  const [deliveredQuantities, setDeliveredQuantities] = useState<Record<string, number>>({});
  const [rejectionItemReasons, setRejectionItemReasons] = useState<Record<string, string>>({});
  const [deliveryStatus, setDeliveryStatus] = useState<"delivered" | "partial" | "rejected">("delivered");
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"createdAt" | "orderNumber" | "customerName" | "updatedAt">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  // إضافة متغير حالة لتصفية الطلبات حسب الحالة
  const [statusFilter, setStatusFilter] = useState<"all" | "in_delivery" | "delivered" | "partially_delivered" | "delivery_rejected">("all");

  // إضافة حالة لمربعات الاختيار
  const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
  const [isConfirmCollectionDialogOpen, setIsConfirmCollectionDialogOpen] = useState(false);
  // إضافة متغير حالة لتصفية الطلبات حسب شركة الشحن
  const [shippingCompanyFilter, setShippingCompanyFilter] = useState<string>("all");

  // تحميل شركات الشحن من API
  const [productDetailsMap, setProductDetailsMap] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchCompanies = async () => {
      const companies = await getShippingCompanies();
      setShippingCompanies(companies);
    };
    fetchCompanies();
  }, []);

  // عدد الطلبات في الصفحة الواحدة
  const ordersPerPage = 20;

  // جلب الطلبات في مرحلة التوصيل مع البارامترات الجديدة
  const { data: ordersResponse, isLoading } = useQuery({
    queryKey: ["delivery-orders", currentPage, searchTerm, shippingCompanyFilter, statusFilter],
    queryFn: () => getOrdersBySections(["delivery", "collection"], currentPage, ordersPerPage, searchTerm, statusFilter, shippingCompanyFilter),
    refetchInterval: 10000,
  });

  const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
  const totalOrders = Array.isArray(ordersResponse) ? ordersResponse.length : (ordersResponse?.total || 0);
  const totalPages = Array.isArray(ordersResponse) ? Math.ceil(ordersResponse.length / ordersPerPage) : (ordersResponse?.totalPages || 1);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, shippingCompanyFilter, statusFilter]);

  // حساب إحصائيات الطلبات وشركات الشحن
  const calculateStats = () => {
    // استخدام الطلبات بعد التصفية والبحث للحساب
    const dataToCalculate = sortedOrders;

    // إجمالي المستحقات (المبلغ الصافي بعد خصم سعر الشحن والمدفوع مقدماً)
    const totalAmount = dataToCalculate.reduce((sum, order) => {
      const collectibleAmount = Math.max(
        0,
        Number(order.totalAmount || 0)
        - Number(order.shippingFee || 0)
        - Number(order.paid_amount || 0)
      );
      return sum + collectibleAmount;
    }, 0);

    // إجمالي الطلبات الملغاة
    const cancelledOrders = dataToCalculate.filter(order => order.status === "delivery_rejected").length;

    // إجمالي الطلبات المتسلمة بالكامل
    const fullyDeliveredOrders = dataToCalculate.filter(order => order.status === "delivered").length;

    // إجمالي الطلبات المتسلمة جزئياً
    const partiallyDeliveredOrders = dataToCalculate.filter(order => order.status === "partially_delivered").length;

    // إجمالي الطلبات المتسلمة (كامل + جزئي)
    const deliveredOrders = fullyDeliveredOrders + partiallyDeliveredOrders;

    // إحصائيات شركات الشحن
    const uniqueCompanyIds = [...new Set(dataToCalculate.map(order => order.shippingCompany).filter(Boolean))];

    const shippingCompanyStats = uniqueCompanyIds.map(companyId => {
      const companyOrders = dataToCalculate.filter(order => order.shippingCompany === companyId);
      const company = shippingCompanies.find(c => c.id === companyId);

      return {
        id: companyId,
        name: company ? company.name : companyId,
        totalOrders: companyOrders.length,
        fullyDeliveredOrders: companyOrders.filter(order => order.status === "delivered").length,
        partiallyDeliveredOrders: companyOrders.filter(order => order.status === "partially_delivered").length,
        cancelledOrders: companyOrders.filter(order => order.status === "delivery_rejected").length,
        pendingOrders: companyOrders.filter(order =>
          order.status !== "delivered" && order.status !== "partially_delivered" && order.status !== "delivery_rejected"
        ).length,
        // المستحقات الصافية = إجمالي الطلب - رسوم الشحن - المدفوع مقدماً
        totalAmount: companyOrders.reduce((sum, order) => {
          const collectibleAmount = Math.max(
            0,
            Number(order.totalAmount || 0)
            - Number(order.shippingFee || 0)
            - Number(order.paid_amount || 0)
          );
          return sum + collectibleAmount;
        }, 0)
      };
    }).filter(company => company.totalOrders > 0);

    return {
      totalAmount,
      cancelledOrders,
      fullyDeliveredOrders,
      partiallyDeliveredOrders,
      deliveredOrders,
      totalOrders: totalOrders, // Use server-side total
      shippingCompanyStats
    };
  };

  // تصفية الطلبات حسب البحث (الفلاتر الأخرى تمت في السيرفر)
  const filteredOrders = orders.filter((order) => {
    // إذا كان البحث فارغًا، أظهر جميع الطلبات المرجعة من السيرفر
    if (!searchTerm.trim()) return true;

    const searchLower = searchTerm.toLowerCase().trim();

    // البحث في رقم الطلب
    if (order.orderNumber.toLowerCase().includes(searchLower)) return true;

    // البحث في اسم العميل
    if (order.customerName && order.customerName.toLowerCase().includes(searchLower)) return true;

    // البحث في رقم هاتف العميل (بدون الحاجة إلى تحويله إلى lowercase لأنه أرقام)
    // إزالة كود مصر (+20 أو 0020) من رقم الهاتف المدخل للبحث
    const searchPhoneNormalized = searchTerm.trim().replace(/^(\+20|0020|20|0)/, "");

    // إزالة كود مصر من رقم هاتف العميل المخزن للمقارنة
    const customerPhoneNormalized = order.customerPhone ? order.customerPhone.replace(/^(\+20|0020|20|0)/, "") : "";
    const customerPhone2Normalized = order.customerPhone2 ? order.customerPhone2.replace(/^(\+20|0020|20|0)/, "") : "";

    // البحث في رقم هاتف العميل بعد إزالة كود مصر
    if (customerPhoneNormalized && customerPhoneNormalized.includes(searchPhoneNormalized)) return true;

    // البحث في رقم هاتف العميل البديل بعد إزالة كود مصر
    if (customerPhone2Normalized && customerPhone2Normalized.includes(searchPhoneNormalized)) return true;

    // البحث في اسم المسوق
    if (order.marketerName && order.marketerName.toLowerCase().includes(searchLower)) return true;

    // البحث في عنوان العميل
    if (order.customerAddress && order.customerAddress.toLowerCase().includes(searchLower)) return true;

    return false;
  });

  // ترتيب الطلبات
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let comparison = 0;

    switch (sortField) {
      case "updatedAt":
        // ترتيب حسب تاريخ التحديث (الأحدث أولاً)
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        if (comparison === 0) comparison = b.id.localeCompare(a.id);
        break;
      case "createdAt":
        // ترتيب حسب تاريخ الإنشاء (الأحدث أولاً)
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (comparison === 0) comparison = b.id.localeCompare(a.id);
        break;
      case "orderNumber":
        // ترتيب حسب رقم الطلب
        comparison = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case "customerName":
        // ترتيب حسب اسم العميل
        comparison = (a.customerName || "").localeCompare(b.customerName || "");
        break;
      default:
        // الترتيب الافتراضي حسب تاريخ التحديث (الأحدث أولاً)
        comparison = new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }

    // تطبيق اتجاه الترتيب (تصاعدي أو تنازلي)
    // ملاحظة: نحن نعكس المنطق هنا لضمان أن الطلبات الأحدث تظهر دائمًا في الأعلى عند الترتيب حسب التاريخ
    if (sortField === "createdAt" || sortField === "updatedAt") {
      // للتاريخ، نريد دائمًا الأحدث في الأعلى بغض النظر عن اتجاه الترتيب
      return sortDirection === "asc" ? -comparison : comparison;
    } else {
      // لباقي الحقول، نتبع اتجاه الترتيب المحدد
      return sortDirection === "asc" ? comparison : -comparison;
    }
  });

  // Use result of sorting and filtering
  const paginatedOrders = sortedOrders;

  // الإحصائيات (تعتمد على الطلبات المصفاة والمرتبة)
  const stats = calculateStats();
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + sortedOrders.length;

  // تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // تغيير حقل الترتيب
  const handleSortChange = (field: "createdAt" | "orderNumber" | "customerName" | "updatedAt") => {
    if (field === sortField) {
      // إذا كان نفس الحقل، قم بتبديل اتجاه الترتيب
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // إذا كان حقل مختلف، قم بتعيين الحقل الجديد واتجاه الترتيب الافتراضي
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // تصدير الطلبات إلى ملف Excel
  const exportToExcel = () => {
    if (filteredOrders.length === 0) {
      toast.error("لا توجد طلبات للتصدير");
      return;
    }

    // تحويل حالة الطلب إلى نص عربي
    const getStatusText = (status: string) => {
      switch (status) {
        case "delivered": return "تم التسليم";
        case "partially_delivered": return "تسليم جزئي";
        case "delivery_rejected": return "مرفوض";
        case "in_delivery": return "قيد التوصيل";
        case "shipped": return "تم الشحن";
        default: return status;
      }
    };

    // إنشاء بيانات Excel
    const headers = [
      "رقم الطلب",
      "اسم العميل",
      "رقم هاتف العميل",
      "عنوان العميل",
      "المحافظة",
      "شركة الشحن",
      "رقم التتبع",
      "تاريخ الشحن",
      "تاريخ التحديث",
      "المنتجات",
      "العدد",
      "المقاس",
      "الألوان",
      "إجمالي المبلغ",
      "رسوم الشحن",
      "العمولة",
      "حالة الطلب",
      "اسم المسوق",
      "ملاحظات"
    ];

    const rows = filteredOrders.map(order => {
      // جمع بيانات المنتجات
      const productNames = order.items.map(item => item.productName || "").join(" | ");
      const quantities = order.items.map(item => item.quantity).join(" | ");
      const sizes = order.items.map(item => item.size || "-").join(" | ");
      const colors = order.items.map(item => item.color || "-").join(" | ");

      // الحصول على اسم شركة الشحن
      const shippingCompanyName = shippingCompanies.find(c => c.id === order.shippingCompany)?.name || order.shippingCompany || "-";

      return {
        "رقم الطلب": order.orderNumber,
        "اسم العميل": order.customerName || "-",
        "رقم هاتف العميل": order.customerPhone || "-",
        "عنوان العميل": order.customerAddress || "-",
        "المحافظة": order.province || order.city || "-",
        "شركة الشحن": shippingCompanyName,
        "رقم التتبع": order.trackingNumber || "-",
        "تاريخ الشحن": order.shippingDate ? new Date(order.shippingDate).toLocaleDateString("ar-EG") : "-",
        "تاريخ التحديث": order.updatedAt ? new Date(order.updatedAt).toLocaleDateString("ar-EG") : "-",
        "المنتجات": productNames,
        "العدد": quantities,
        "المقاس": sizes,
        "الألوان": colors,
        "إجمالي المبلغ": order.totalAmount?.toFixed(2) || "0",
        "رسوم الشحن": order.shippingFee?.toFixed(2) || "0",
        "العمولة": order.commission ? Math.floor(order.commission).toString() : "0",
        "حالة الطلب": getStatusText(order.status),
        "اسم المسوق": order.marketerName || "-",
        "ملاحظات": order.notes || "-"
      };
    });

    // إنشاء ورقة عمل Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "الطلبات");

    // تعيين عرض الأعمدة
    const colWidths = headers.map(() => ({ wch: 20 }));
    worksheet["!cols"] = colWidths;

    // اسم الملف
    const companyName = shippingCompanyFilter === "all"
      ? "جميع_الشركات"
      : shippingCompanies.find(c => c.id === shippingCompanyFilter)?.name || shippingCompanyFilter;
    const fileName = `طلبات_${companyName}_${new Date().toLocaleDateString("ar-EG").replace(/\//g, "-")}.xlsx`;

    // تحميل الملف
    XLSX.writeFile(workbook, fileName);

    toast.success(`تم تصدير ${filteredOrders.length} طلب بنجاح`);
  };

  // فتح نافذة تأكيد التسليم الكامل
  const handleOpenDeliveryDialog = (order: Order) => {
    // التحقق مما إذا كان الطلب قد تم تسليمه بالفعل
    if (order.status === "delivered") {
      toast.warning("تم تسليم هذا الطلب بالفعل ولا يمكن تغيير حالته مرة أخرى");
      return;
    }

    // التحقق مما إذا كان الطلب قد تم تسليمه جزئيًا أو رفضه
    if (order.status === "partially_delivered" || order.status === "delivery_rejected") {
      toast.warning("تم تحديث حالة هذا الطلب بالفعل ولا يمكن تغييرها");
      return;
    }

    setSelectedOrder(order);
    setDeliveryStatus("delivered");

    // تهيئة حالة العناصر المسلمة (كلها مسلمة افتراضيًا)
    const initialDeliveredItems: Record<string, boolean> = {};
    order.items.forEach(item => {
      initialDeliveredItems[item.id] = true;
    });
    setDeliveredItems(initialDeliveredItems);

    setIsDeliveryDialogOpen(true);
  };

  // فتح نافذة التسليم الجزئي
  const handleOpenPartialDeliveryDialog = (order: Order) => {
    // التحقق مما إذا كان الطلب قد تم تسليمه جزئيًا بالفعل
    if (order.status === "partially_delivered") {
      toast.warning("تم تسليم هذا الطلب جزئيًا بالفعل ولا يمكن تغيير حالته مرة أخرى");
      return;
    }

    // التحقق مما إذا كان الطلب قد تم تسليمه بالكامل أو رفضه
    if (order.status === "delivered" || order.status === "delivery_rejected") {
      toast.warning("تم تحديث حالة هذا الطلب بالفعل ولا يمكن تغييرها");
      return;
    }

    setSelectedOrder(order);
    setDeliveryStatus("partial");

    // تهيئة حالة العناصر المسلمة (كلها مسلمة افتراضيًا)
    const initialDeliveredItems: Record<string, boolean> = {};
    const initialRejectionReasons: Record<string, string> = {};
    const initialDeliveredQuantities: Record<string, number> = {};

    order.items.forEach(item => {
      initialDeliveredItems[item.id] = true;
      initialRejectionReasons[item.id] = "";
      initialDeliveredQuantities[item.id] = item.quantity; // الكمية الكاملة افتراضياً
    });

    setDeliveredItems(initialDeliveredItems);
    setRejectionItemReasons(initialRejectionReasons);
    setDeliveredQuantities(initialDeliveredQuantities);

    // تحميل المنتجات لتحسين العرض إذا كانت الأسماء مفقودة أو عبارة عن أرقام
    getProducts().then(result => {
      const products = Array.isArray(result) ? result : result.data;
      const map: Record<string, any> = {};
      products.forEach(p => {
        // تخزين المنتج بمعرفه وأيضاً باسمه (للاحتياط)
        map[p.id] = p;
        map[p.name] = p; // فقط في حال كان الاسم فريداً
      });
      setProductDetailsMap(map);
    });

    setIsPartialDeliveryDialogOpen(true);
  };

  // فتح نافذة إلغاء الطلب
  const handleOpenCancelDialog = (order: Order) => {
    // التحقق مما إذا كان الطلب قد تم رفضه بالفعل
    if (order.status === "delivery_rejected") {
      toast.warning("تم رفض استلام هذا الطلب بالفعل ولا يمكن تغيير حالته مرة أخرى");
      return;
    }

    // التحقق مما إذا كان الطلب قد تم تسليمه بالكامل أو جزئيًا
    if (order.status === "delivered" || order.status === "partially_delivered") {
      toast.warning("تم تحديث حالة هذا الطلب بالفعل ولا يمكن تغييرها");
      return;
    }

    setSelectedOrder(order);
    setCancelReason("");
    setIsCancelDialogOpen(true);
  };

  // تعيين الإشعارات السابقة المتعلقة بالطلب كمقروءة
  const markOrderNotificationsAsRead = async (orderId: string, marketerId: string | undefined) => {
    if (!marketerId) return;

    try {
      // الحصول على إشعارات المسوق
      const notifications = await getNotifications(marketerId);

      // تصفية الإشعارات المتعلقة بالطلب
      const orderNotifications = notifications.filter(notification =>
        notification.message.includes(`الطلب رقم ${orderId}`) ||
        notification.message.includes(`طلب رقم ${orderId}`)
      );

      // تعيين الإشعارات كمقروءة
      for (const notification of orderNotifications) {
        await markNotificationAsRead(marketerId, notification.id);
      }

      // تحديث استعلامات الإشعارات
      await queryClient.invalidateQueries({ queryKey: ["marketer-notifications", marketerId] });

      console.log(`تم تعيين ${orderNotifications.length} إشعار متعلق بالطلب كمقروء`);
    } catch (error) {
      console.error("حدث خطأ أثناء تعيين الإشعارات كمقروءة:", error);
    }
  };

  // تأكيد تسليم الطلب (كامل)
  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);

      // 1. Prepare updated order object
      const updatedOrder = {
        ...selectedOrder,
        status: "delivered" as OrderStatus,
        section: "collection" as OrderSection, // Move to collection for accounting
        updatedAt: new Date().toISOString()
      };

      // 2. Calculate commission
      const orderTotal = updatedOrder.items.reduce((sum, item) => sum + item.total, 0);
      let commissionAmount = updatedOrder.commission || Math.round(orderTotal * 0.1);
      updatedOrder.commission = commissionAmount;

      // 3. Sequential Async operations
      // Clear relevant notifications
      if (updatedOrder.marketerId) {
        await markOrderNotificationsAsRead(updatedOrder.orderNumber.toString(), updatedOrder.marketerId);
      }

      // Add commission - Handled by backend in centralized saveOrder logic
      /*
      if (updatedOrder.marketerId && commissionAmount > 0) {
        await addOrderCommission(
          updatedOrder.marketerId,
          updatedOrder.id,
          updatedOrder.orderNumber.toString(),
          commissionAmount,
          false // Full delivery
        );
      }
      */

      // Centralized update - This also sends notification via orderService trigger
      await updateOrder(updatedOrder);

      // 4. Invalidate and Close
      invalidateAllOrderQueries(queryClient);

      toast.success("تم تأكيد تسليم الطلب بنجاح ✅");
      if (commissionAmount > 0) {
        toast.info(`تم إضافة عمولة ${commissionAmount.toFixed(2)} ج.م للمسوق`);
      }

      setIsDeliveryDialogOpen(false);
    } catch (error) {
      console.error("Error in delivery confirmation:", error);
      toast.error("حدث خطأ أثناء تأكيد التسليم. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUpdating(false);
    }
  };

  // تأكيد التسليم الجزئي
  const handleConfirmPartialDelivery = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);

      // 1. Prepare updated items and calculate commission
      const updatedItems = selectedOrder.items.map(item => {
        const originalQuantity = item.quantity;
        const deliveredQty = deliveredQuantities[item.id] || 0;
        const rejectedQty = originalQuantity - deliveredQty;

        return {
          ...item,
          delivered: deliveredQty > 0,
          deliveredQuantity: deliveredQty,
          rejectedQuantity: rejectedQty,
          deliveredTotal: deliveredQty * item.price,
          rejectionReason: rejectedQty > 0 ? rejectionItemReasons[item.id] : undefined
        };
      });

      let calculatedCommission = 0;
      updatedItems.forEach(item => {
        const deliveredQty = item.deliveredQuantity || 0;
        const itemCommission = (item.commission && item.commission > 0)
          ? item.commission
          : Math.round(item.price * 0.1);

        if (deliveredQty > 0) {
          calculatedCommission += itemCommission * deliveredQty;
        }
      });

      let calculatedTotal = selectedOrder.shippingFee || 0;
      updatedItems.forEach(item => {
        calculatedTotal += (item.deliveredTotal || 0);
      });

      const updatedOrder = {
        ...selectedOrder,
        items: updatedItems,
        status: "partially_delivered" as OrderStatus,
        section: "collection" as OrderSection,
        commission: Math.round(calculatedCommission),
        updatedAt: new Date().toISOString()
      };

      const commissionAmount = updatedOrder.commission;

      // 2. Sequential Async operations
      if (updatedOrder.marketerId) {
        await markOrderNotificationsAsRead(updatedOrder.orderNumber.toString(), updatedOrder.marketerId);
      }

      // Add commission - Handled by backend in centralized saveOrder logic
      /*
      if (updatedOrder.marketerId && commissionAmount > 0) {
        await addOrderCommission(
          updatedOrder.marketerId,
          updatedOrder.id,
          updatedOrder.orderNumber.toString(),
          commissionAmount,
          true // Partial delivery
        );
      }
      */

      // Update Order (triggers notification)
      await updateOrder(updatedOrder);

      // Restore stock for rejected parts
      for (const item of updatedItems) {
        if (item.rejectedQuantity && item.rejectedQuantity > 0) {
          await increaseStock(item.productId || item.id, item.rejectedQuantity, item.color, item.size, item.productName);
        }
      }

      // 3. Invalidate and Close
      invalidateAllOrderQueries(queryClient);

      toast.success("تم تأكيد التسليم الجزئي بنجاح ✅");
      if (commissionAmount > 0) {
        toast.info(`تم إضافة عمولة ${commissionAmount.toFixed(2)} ج.م للمسوق`);
      }
      setIsPartialDeliveryDialogOpen(false);
    } catch (error) {
      console.error("Error in partial delivery confirmation:", error);
      toast.error("حدث خطأ أثناء تأكيد التسليم الجزئي");
    } finally {
      setIsUpdating(false);
    }
  };

  // إلغاء الطلب (رفض الاستلام)
  const handleCancelOrder = async () => {
    if (!selectedOrder) return;

    try {
      // 1. Prepare updated order object
      const updatedOrder = {
        ...selectedOrder,
        status: "delivery_rejected" as OrderStatus,
        section: "collection" as OrderSection, // Stay in collection for final record
        cancellationReason: cancelReason,
        cancellationDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        commission: 0 // No commission for rejected orders
      };

      // 2. Sequential Async operations
      if (updatedOrder.marketerId) {
        await markOrderNotificationsAsRead(updatedOrder.orderNumber.toString(), updatedOrder.marketerId);
      }

      // Restore STOCK for all items
      console.log('Restoring stock for rejected order items...');
      for (const item of updatedOrder.items) {
        await increaseStock(
          item.productId || item.id,
          item.quantity,
          item.color,
          item.size,
          item.productName
        );
      }

      // Update Order - This triggers notification AND stock restoration on backend
      await updateOrder(updatedOrder);

      // 3. Invalidate and Close
      invalidateAllOrderQueries(queryClient);

      toast.success("تم تسجيل رفض استلام الطلب بنجاح ✅");
      setIsCancelDialogOpen(false);
    } catch (error) {
      console.error("Error in rejecting delivery:", error);
      toast.error("حدث خطأ أثناء تسجيل رفض الاستلام");
    } finally {
      setIsUpdating(false);
    }
  };

  // تغيير حالة عنصر (مسلم/غير مسلم)
  const handleItemDeliveryChange = (itemId: string, delivered: boolean) => {
    setDeliveredItems(prev => ({
      ...prev,
      [itemId]: delivered
    }));
    // إذا تم إلغاء التسليم، نعين الكمية إلى 0
    if (!delivered) {
      setDeliveredQuantities(prev => ({
        ...prev,
        [itemId]: 0
      }));
    } else {
      // إذا تم تفعيل التسليم، نعين الكمية إلى الكمية الأصلية
      const item = selectedOrder?.items.find(i => i.id === itemId);
      if (item) {
        setDeliveredQuantities(prev => ({
          ...prev,
          [itemId]: item.quantity
        }));
      }
    }
  };

  // تغيير الكمية المسلمة لعنصر
  const handleDeliveredQuantityChange = (itemId: string, quantity: number) => {
    const item = selectedOrder?.items.find(i => i.id === itemId);
    if (!item) return;

    // التأكد من أن الكمية بين 0 والكمية الأصلية
    const validQuantity = Math.max(0, Math.min(quantity, item.quantity));

    setDeliveredQuantities(prev => ({
      ...prev,
      [itemId]: validQuantity
    }));

    // تحديث حالة التسليم بناءً على الكمية
    setDeliveredItems(prev => ({
      ...prev,
      [itemId]: validQuantity > 0
    }));
  };

  // تغيير سبب رفض عنصر
  const handleItemRejectionReasonChange = (itemId: string, reason: string) => {
    setRejectionItemReasons(prev => ({
      ...prev,
      [itemId]: reason
    }));
  };

  // تحديد/إلغاء تحديد طلب
  const handleOrderSelection = (orderId: string, checked: boolean) => {
    setSelectedOrders(prev => ({
      ...prev,
      [orderId]: checked
    }));
  };

  // تحديد/إلغاء تحديد جميع الطلبات
  const handleSelectAllOrders = (checked: boolean) => {
    const newSelectedOrders: Record<string, boolean> = {};
    paginatedOrders.forEach(order => {
      newSelectedOrders[order.id] = checked;
    });
    setSelectedOrders(newSelectedOrders);
  };

  // تأكيد التحصيل للطلبات المحددة
  const handleConfirmCollection = async () => {
    try {
      setIsUpdating(true);

      // الحصول على الطلبات المحددة
      const ordersToCollect = paginatedOrders.filter(order => selectedOrders[order.id]);

      if (ordersToCollect.length === 0) {
        toast.error("لم يتم تحديد أي طلب للتحصيل");
        setIsUpdating(false);
        return;
      }

      // تجميع الطلبات حسب شركة الشحن
      const ordersByCompany: Record<string, { orders: Order[], totalAmount: number }> = {};

      ordersToCollect.forEach(order => {
        if (!order.shippingCompany) return;

        if (!ordersByCompany[order.shippingCompany]) {
          ordersByCompany[order.shippingCompany] = {
            orders: [],
            totalAmount: 0
          };
        }

        ordersByCompany[order.shippingCompany].orders.push(order);
        // خصم سعر المنتجات فقط (بدون سعر الشحن) من مستحقات شركة الشحن
        const productsTotalAmount = Math.max(0, Number(order.totalAmount || 0) - Number(order.shippingFee || 0));
        ordersByCompany[order.shippingCompany].totalAmount += productsTotalAmount;
      });

      // تحديث مستحقات كل شركة شحن
      const { getShippingCompanies, updateShippingCompany } = await import("@/services/collectionService");
      const companies = await getShippingCompanies();

      for (const companyId in ordersByCompany) {
        const company = companies.find((c: any) => c.id === companyId);

        if (company) {
          const { totalAmount } = ordersByCompany[companyId];

          // تحديث رصيد الشركة (خصم المستحقات)
          await updateShippingCompany(companyId, {
            balance: (company.balance || 0) - totalAmount,
            updatedAt: new Date().toISOString()
          });

          console.log(`تم خصم ${totalAmount} ج.م من مستحقات شركة ${company.name}`);
        }
      }

      // تحديث قسم الطلبات المحددة إلى "archive" (الأرشيف)
      for (const order of ordersToCollect) {
        const updatedOrder: Order = {
          ...order,
          section: "archive" as const,
          updatedAt: new Date().toISOString()
        };
        await updateOrder(updatedOrder);
        console.log(`تم تحويل الطلب ${order.orderNumber} إلى الأرشيف بعد التحصيل`);
      }

      // تحديث استعلامات قسم جاري التوصيل والأرشيف
      await queryClient.invalidateQueries({ queryKey: ["delivery-orders"] });
      await queryClient.invalidateQueries({ queryKey: ["archive-orders"] });
      await queryClient.refetchQueries({ queryKey: ["delivery-orders"] });

      // إعادة تعيين الطلبات المحددة
      setSelectedOrders({});
      setIsConfirmCollectionDialogOpen(false);

      toast.success(`تم تأكيد تحصيل ${ordersToCollect.length} طلب بنجاح`);
      toast.info(`تم نقل الطلبات المحصلة إلى الأرشيف`);
    } catch (error: any) {
      console.error("حدث خطأ أثناء تأكيد التحصيل:", error);
      toast.error(`حدث خطأ أثناء تأكيد التحصيل: ${error.message || "خطأ غير معروف"}`);
    } finally {

      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">قسم جاري التوصيل</h1>
            <p className="text-muted-foreground">
              إدارة الطلبات التي في مرحلة التوصيل
            </p>
          </div>
        </div>

        {/* المربعات التفاعلية للإحصائيات */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-900 to-blue-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100 flex items-center">
                <Truck className="mr-2 h-4 w-4" />
                إجمالي المستحقات (بدون الشحن)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{formatPrice(stats.totalAmount)} ج.م</div>
              <p className="text-xs text-blue-200 mt-1 flex items-center">
                <Package className="mr-1 h-3 w-3" />
                من {stats.totalOrders} طلب
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900 to-green-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-100 flex items-center">
                <CheckCircle className="mr-2 h-4 w-4" />
                تسليم كامل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.fullyDeliveredOrders}
              </div>
              <p className="text-xs text-green-200 mt-1 flex items-center">
                <Package className="mr-1 h-3 w-3" />
                من إجمالي {stats.totalOrders} طلب
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900 to-yellow-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-yellow-100 flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                تسليم جزئي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.partiallyDeliveredOrders}
              </div>
              <p className="text-xs text-yellow-200 mt-1 flex items-center">
                <Package className="mr-1 h-3 w-3" />
                من إجمالي {stats.totalOrders} طلب
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-900 to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-100 flex items-center">
                <XCircle className="mr-2 h-4 w-4" />
                الطلبات الملغاة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.cancelledOrders}
              </div>
              <p className="text-xs text-red-200 mt-1 flex items-center">
                <AlertTriangle className="mr-1 h-3 w-3" />
                من إجمالي {stats.totalOrders} طلب
              </p>
            </CardContent>
          </Card>
        </div>

        {/* جدول شركات الشحن */}
        <Card>
          <CardHeader>
            <CardTitle>شركات الشحن</CardTitle>
            <CardDescription>
              عدد الطلبات المشحونة لكل شركة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-blue-600 text-white">
                  <TableRow>
                    <TableHead className="text-center text-white">اسم الشركة</TableHead>
                    <TableHead className="text-center text-white">إجمالي الطلبات</TableHead>
                    <TableHead className="text-center text-white">تسليم كامل</TableHead>
                    <TableHead className="text-center text-white">تسليم جزئي</TableHead>
                    <TableHead className="text-center text-white">الطلبات الملغاة</TableHead>
                    <TableHead className="text-center text-white">قيد التوصيل</TableHead>
                    <TableHead className="text-center text-white">إجمالي المستحقات (بدون الشحن)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.shippingCompanyStats.length > 0 ? (
                    stats.shippingCompanyStats.map((company, index) => (
                      <TableRow key={company.id} className={index % 2 === 0 ? "bg-white" : "bg-blue-50"}>
                        <TableCell className="font-medium text-center">{company.name}</TableCell>
                        <TableCell className="text-center">{company.totalOrders}</TableCell>
                        <TableCell className="text-center text-green-600">{company.fullyDeliveredOrders}</TableCell>
                        <TableCell className="text-center text-yellow-600">{company.partiallyDeliveredOrders}</TableCell>
                        <TableCell className="text-center text-red-600">{company.cancelledOrders}</TableCell>
                        <TableCell className="text-center text-amber-600">{company.pendingOrders}</TableCell>
                        <TableCell className="font-medium text-center">{formatPrice(company.totalAmount)} ج.م</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                        لا توجد بيانات لشركات الشحن
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            {searchTerm.trim() && (
              <div className="text-sm text-muted-foreground">
                نتائج البحث: <span className="font-medium text-primary">{filteredOrders.length}</span> طلب
                {filteredOrders.length > 0 && searchTerm.trim() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs mr-2"
                    onClick={() => setSearchTerm("")}
                  >
                    مسح البحث
                  </Button>
                )}
              </div>
            )}

            {/* زر تأكيد التحصيل */}
            {Object.values(selectedOrders).some(selected => selected) && (
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setIsConfirmCollectionDialogOpen(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                تأكيد التحصيل ({Object.values(selectedOrders).filter(selected => selected).length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث باسم العميل أو رقم الهاتف (بدون كود مصر)..."
                className="pl-10 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* قائمة تصفية الطلبات حسب الحالة */}
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-40 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="تصفية حسب الحالة" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الطلبات</SelectItem>
                <SelectItem value="in_delivery">جاري التوصيل</SelectItem>
                <SelectItem value="delivered">تم التسليم</SelectItem>
                <SelectItem value="partially_delivered">تسليم جزئي</SelectItem>
                <SelectItem value="delivery_rejected">رفض الاستلام</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle>الطلبات قيد التوصيل</CardTitle>
                <CardDescription>
                  {filteredOrders.length} طلب
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                {/* قائمة شركات الشحن */}
                <Select value={shippingCompanyFilter} onValueChange={setShippingCompanyFilter}>
                  <SelectTrigger className="w-48 h-9 rounded-md bg-white border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="اختر شركة الشحن" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الشركات</SelectItem>
                    {shippingCompanies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* زر تصدير Excel */}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                  onClick={exportToExcel}
                >
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  تصدير Excel
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-10">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">لا توجد طلبات</h3>
                <p className="text-muted-foreground">
                  لا توجد طلبات في مرحلة التوصيل حاليًا
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12 text-center">
                        <Checkbox
                          checked={paginatedOrders.length > 0 && paginatedOrders.every(order => selectedOrders[order.id])}
                          onCheckedChange={handleSelectAllOrders}
                          aria-label="تحديد جميع الطلبات"
                        />
                      </TableHead>
                      <TableHead className="w-24 text-center">
                        <button
                          className="flex flex-col items-center w-full hover:bg-gray-50 py-1 rounded-md transition-colors"
                          onClick={() => handleSortChange("orderNumber")}
                        >
                          <div className="flex items-center gap-1">
                            <span>رقم</span>
                            {sortField === "orderNumber" && (
                              sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                          <span>الطلب</span>
                        </button>
                      </TableHead>
                      <TableHead className="w-64 text-center">
                        <button
                          className="flex flex-col items-center w-full hover:bg-gray-50 py-1 rounded-md transition-colors"
                          onClick={() => handleSortChange("customerName")}
                        >
                          <div className="flex items-center gap-1">
                            <span>بيانات</span>
                            {sortField === "customerName" && (
                              sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                          <span>العميل</span>
                        </button>
                      </TableHead>
                      <TableHead className="w-28 text-center">
                        <div className="flex flex-col items-center">
                          <span>المحافظة</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-32 text-center">
                        <div className="flex flex-col items-center">
                          <span>شركة</span>
                          <span>الشحن</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-32 text-center">
                        <button
                          className="flex flex-col items-center w-full hover:bg-gray-50 py-1 rounded-md transition-colors"
                          onClick={() => handleSortChange("updatedAt")}
                        >
                          <div className="flex items-center gap-1">
                            <span>تاريخ</span>
                            {sortField === "updatedAt" && (
                              sortDirection === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            )}
                          </div>
                          <span>التحديث</span>
                        </button>
                      </TableHead>
                      <TableHead className="w-28 text-center">
                        <div className="flex flex-col items-center">
                          <span>الإجمالي</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-auto text-center">
                        <div className="flex flex-col items-center">
                          <span>الإجراءات</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={selectedOrders[order.id] || false}
                            onCheckedChange={(checked) => handleOrderSelection(order.id, checked === true)}
                            aria-label={`تحديد الطلب ${order.orderNumber}`}
                          />
                        </TableCell>
                        <TableCell
                          className="font-medium cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="font-bold text-primary-700 text-base mb-1 border-b pb-1">
                              {order.customerName || "بدون اسم"}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-gray-500">📱</span>
                              <span className="text-sm">{order.customerPhone}</span>
                            </div>
                            {order.customerAddress && (
                              <div className="flex items-start gap-1 mt-1">
                                <span className="text-gray-500 mt-0.5">📍</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={order.customerAddress}>
                                  {order.customerAddress}
                                </span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{order.province}</TableCell>
                        <TableCell>
                          {order.shippingCompany ? (
                            <Badge variant="outline" className="bg-blue-50 font-medium">
                              {shippingCompanies.find(c => c.id === order.shippingCompany)?.name || order.shippingCompany}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                          {order.trackingNumber && (
                            <div className="text-xs text-muted-foreground mt-1">
                              رقم التتبع: {order.trackingNumber}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {new Date(order.shippingDate || order.updatedAt).toLocaleDateString("ar-EG")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.shippingDate || order.updatedAt).toLocaleTimeString("ar-EG", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-green-700">
                            {Math.round((order.totalAmount || 0) - (order.paid_amount || 0))} ج.م
                          </div>
                          {order.paid_amount > 0 && (
                            <div className="text-[10px] text-green-600 font-bold">
                              (مخصوم {order.paid_amount} مدفوع)
                            </div>
                          )}
                          {order.commission && (
                            <div className="text-xs text-blue-600 mt-1">
                              العمولة: {Math.floor(order.commission)} ج.م
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {order.status === "in_delivery" ? (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleOpenDeliveryDialog(order)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  تم التسليم
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenPartialDeliveryDialog(order)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  تسليم جزئي
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOpenCancelDialog(order)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  إلغاء
                                </Button>
                              </>
                            ) : (
                              <Badge className={
                                order.status === "delivered" ? "bg-green-100 text-green-800" :
                                  order.status === "partially_delivered" ? "bg-yellow-100 text-yellow-800" :
                                    order.status === "delivery_rejected" ? "bg-red-100 text-red-800" :
                                      "bg-gray-100 text-gray-800"
                              }>
                                {order.status === "delivered" && "تم التسليم"}
                                {order.status === "partially_delivered" && "تسليم جزئي"}
                                {order.status === "delivery_rejected" && "تم رفض الاستلام"}
                                {!["delivered", "partially_delivered", "delivery_rejected"].includes(order.status) && order.status}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* نظام الصفحات */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {/* عرض أرقام الصفحات */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          // حساب أرقام الصفحات التي سيتم عرضها
                          let pageNum;
                          if (totalPages <= 5) {
                            // إذا كان إجمالي الصفحات 5 أو أقل، اعرض جميع الصفحات
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            // إذا كانت الصفحة الحالية في البداية
                            if (i < 4) {
                              pageNum = i + 1;
                            } else {
                              return (
                                <PaginationItem key="ellipsis-end">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                          } else if (currentPage >= totalPages - 2) {
                            // إذا كانت الصفحة الحالية في النهاية
                            if (i === 0) {
                              return (
                                <PaginationItem key="ellipsis-start">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            } else {
                              pageNum = totalPages - (4 - i);
                            }
                          } else {
                            // إذا كانت الصفحة الحالية في المنتصف
                            if (i === 0) {
                              return (
                                <PaginationItem key="ellipsis-start">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            } else if (i === 4) {
                              return (
                                <PaginationItem key="ellipsis-end">
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            } else {
                              pageNum = currentPage + (i - 2);
                            }
                          }

                          return pageNum ? (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => handlePageChange(pageNum)}
                                isActive={currentPage === pageNum}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          ) : null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}

                {/* عرض معلومات الصفحات */}
                <div className="text-center text-sm text-muted-foreground mt-2">
                  عرض {startIndex + 1} إلى {Math.min(endIndex, filteredOrders.length)} من إجمالي {filteredOrders.length} طلب
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نافذة تأكيد التسليم */}
      <Dialog open={isDeliveryDialogOpen} onOpenChange={setIsDeliveryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد تسليم الطلب</DialogTitle>
            <DialogDescription>
              تأكيد تسليم الطلب #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">المنتجات المسلمة</h3>
              <p className="text-sm text-muted-foreground">
                حدد المنتجات التي تم تسليمها للعميل
              </p>
            </div>
            <div className="space-y-2">
              {selectedOrder?.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={deliveredItems[item.id] || false}
                    onCheckedChange={(checked) => handleItemDeliveryChange(item.id, checked === true)}
                  />
                  <Label htmlFor={`item-${item.id}`} className="flex-1">
                    {item.productName} ({item.quantity} قطعة) - {item.total} ج.م
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeliveryDialogOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "جاري التحديث..." : "تأكيد التسليم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة إلغاء الطلب */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>إلغاء الطلب</DialogTitle>
            <DialogDescription>
              إلغاء الطلب #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-4">
              <Label htmlFor="cancel-reason">سبب الإلغاء</Label>
              <Select
                value={cancellationReasons.includes(cancelReason) ? cancelReason : ""}
                onValueChange={(value) => setCancelReason(value)}
              >
                <SelectTrigger id="cancel-reason" className="w-full text-right dir-rtl">
                  <SelectValue placeholder="اختر سبب الإلغاء" />
                </SelectTrigger>
                <SelectContent>
                  {cancellationReasons.map((reason) => (
                    <SelectItem key={reason} value={reason}>
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">تنبيه</h4>
                  <p className="text-sm text-amber-700">
                    لن يتم احتساب أي عمولة للمسوق عند إلغاء الطلب.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCancelDialogOpen(false)}
              disabled={isUpdating}
            >
              تراجع
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={isUpdating}
            >
              {isUpdating ? "جاري التحديث..." : "تأكيد الإلغاء"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة التسليم الجزئي */}
      <Dialog open={isPartialDeliveryDialogOpen} onOpenChange={setIsPartialDeliveryDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>تسليم جزئي للطلب</DialogTitle>
            <DialogDescription>
              تحديد المنتجات المسلمة وغير المسلمة للطلب #{selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 overflow-y-auto flex-grow">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">تفاصيل المنتجات</h3>
              <p className="text-sm text-muted-foreground">
                حدد المنتجات التي تم تسليمها للعميل وأسباب رفض المنتجات غير المسلمة
              </p>
            </div>

            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">المنتج</TableHead>
                    <TableHead className="w-24 text-center">الكمية الكلية</TableHead>
                    <TableHead className="w-32 text-center">الكمية المسلمة</TableHead>
                    <TableHead className="w-24 text-center">الكمية المرتجعة</TableHead>
                    <TableHead className="w-24 text-center">السعر</TableHead>
                    <TableHead className="w-28 text-center">إجمالي المسلم</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedOrder?.items.map((item) => {
                    const deliveredQty = deliveredQuantities[item.id] ?? item.quantity;
                    const rejectedQty = item.quantity - deliveredQty;
                    const deliveredTotal = deliveredQty * item.price;

                    // البحث عن تفاصيل المنتج الإضافية
                    // نحاول البحث باستخدام المعرف أولاً، ثم الاسم (في حال كان الاسم هو المعرف)
                    const productDetails = productDetailsMap[item.productId] || productDetailsMap[item.productName];

                    // تحديد الاسم للصورة والنص
                    // إذا كان اسم المنتج الحالي في الطلب مجرد أرقام، نستخدم الاسم من تفاصيل المنتج
                    const isNameNumeric = /^\d+$/.test(item.productName || "");
                    const displayName = (productDetails?.name) || (isNameNumeric ? productDetails?.name : item.productName) || item.productId || "منتج غير معرّف";

                    // تحديد الصورة
                    const displayImage = productDetails?.image || item.image || "/placeholder.svg";

                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg border overflow-hidden bg-gray-100 flex-shrink-0">
                              <img
                                src={displayImage}
                                alt={displayName}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                                }}
                              />
                            </div>
                            <div className="flex flex-col justify-center">
                              <div className="font-semibold text-sm whitespace-nowrap">{displayName}</div>
                              <div className="flex flex-wrap gap-x-2 text-xs text-muted-foreground mt-1">
                                {item.color && <span>اللون: <span className="font-medium text-gray-700">{item.color}</span></span>}
                                {item.size && <span>المقاس: <span className="font-medium text-gray-700">{item.size}</span></span>}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={deliveredQty.toString()}
                            onValueChange={(value) => handleDeliveredQuantityChange(item.id, parseInt(value))}
                          >
                            <SelectTrigger className="w-20 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: item.quantity + 1 }, (_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                  {i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={rejectedQty > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {rejectedQty}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{item.price} ج.م</TableCell>
                        <TableCell className="text-center">
                          <span className={deliveredQty > 0 ? "text-green-600 font-medium" : "text-muted-foreground"}>
                            {deliveredTotal} ج.م
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <Separator />

            {/* ملخص الطلب بعد التسليم الجزئي */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">ملخص الطلب بعد التسليم الجزئي</h3>

              <div className="bg-gray-50 p-4 rounded-md border">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">إجمالي المنتجات المسلمة:</div>
                    <div className="font-medium text-green-600">
                      {selectedOrder?.items.reduce((sum, item) => {
                        const deliveredQty = Number(deliveredQuantities[item.id] ?? item.quantity);
                        return sum + (deliveredQty * Number(item.price || 0));
                      }, 0)} ج.م
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">إجمالي المنتجات المرتجعة:</div>
                    <div className="font-medium text-red-600">
                      {selectedOrder?.items.reduce((sum, item) => {
                        const deliveredQty = Number(deliveredQuantities[item.id] ?? item.quantity);
                        const rejectedQty = Number(item.quantity || 0) - deliveredQty;
                        return sum + (rejectedQty * Number(item.price || 0));
                      }, 0)} ج.م
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">إجمالي الطلب الأصلي:</div>
                    <div className="font-medium">
                      {selectedOrder?.items.reduce((sum, item) => sum + Number(item.total || 0), 0)} ج.م
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">رسوم الشحن:</div>
                    <div className="font-medium">{Number(selectedOrder?.shippingFee || 0)} ج.م</div>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="text-base font-medium">مستحقات شركة الشحن:</div>
                    <div className="text-lg font-bold">
                      {(selectedOrder?.items.reduce((sum, item) => sum + Number(item.total || 0), 0) || 0) +
                        Number(selectedOrder?.shippingFee || 0)} ج.م
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    (فلوس المنتجات المسلمة + المنتجات المرتجعة كبضاعة)
                  </p>
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="text-base font-medium text-primary-600">العمولة المستحقة للمسوق:</div>
                  <div className="text-base font-bold text-primary-600">
                    {(() => {
                      const calculatedCommission = selectedOrder?.items.reduce((sum, item) => {
                        const deliveredQty = deliveredQuantities[item.id] ?? item.quantity;

                        // استخدام عمولة العنصر المخزنة إذا وجدت، وإلا استخدام 10% من السعر كاحتياط
                        const itemCommission = (item.commission && item.commission > 0)
                          ? item.commission
                          : Math.round(item.price * 0.1);

                        return sum + (itemCommission * deliveredQty);
                      }, 0) || 0;

                      return Math.round(calculatedCommission).toFixed(2);
                    })()} ج.م
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800">ملاحظة</h4>
                    <p className="text-sm text-blue-700">
                      سيتم احتساب العمولة فقط على المنتجات المسلمة. شركة الشحن تحتفظ بالمنتجات المرتجعة + ثمن المنتجات المسلمة حتى يتم التحصيل.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-shrink-0 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsPartialDeliveryDialogOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmPartialDelivery}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "جاري التحديث..." : "تأكيد التسليم الجزئي"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة تأكيد التحصيل */}
      <Dialog open={isConfirmCollectionDialogOpen} onOpenChange={setIsConfirmCollectionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>تأكيد التحصيل</DialogTitle>
            <DialogDescription>
              تأكيد تحصيل الطلبات المحددة وخصم قيمتها من مستحقات شركات الشحن
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <h3 className="font-medium">الطلبات المحددة للتحصيل</h3>
              <p className="text-sm text-muted-foreground">
                عدد الطلبات: {Object.values(selectedOrders).filter(selected => selected).length} طلب
              </p>
            </div>

            {/* ملخص الطلبات حسب شركة الشحن */}
            <div className="space-y-2">
              <h3 className="font-medium">ملخص حسب شركة الشحن</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">شركة الشحن</TableHead>
                      <TableHead className="text-center">عدد الطلبات</TableHead>
                      <TableHead className="text-center">إجمالي المبلغ</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      // تجميع الطلبات حسب شركة الشحن
                      const ordersByCompany: Record<string, { count: number, totalAmount: number, shippingFees: number }> = {};

                      paginatedOrders
                        .filter(order => selectedOrders[order.id])
                        .forEach(order => {
                          if (!order.shippingCompany) return;

                          if (!ordersByCompany[order.shippingCompany]) {
                            ordersByCompany[order.shippingCompany] = {
                              count: 0,
                              totalAmount: 0,
                              shippingFees: 0
                            };
                          }

                          ordersByCompany[order.shippingCompany].count++;
                          // حساب سعر المنتجات فقط (بدون سعر الشحن)
                          const productsTotalAmount = Number(order.totalAmount || 0) - Number(order.shippingFee || 0);
                          ordersByCompany[order.shippingCompany].totalAmount += productsTotalAmount;
                          ordersByCompany[order.shippingCompany].shippingFees += Number(order.shippingFee || 0);
                        });

                      return Object.entries(ordersByCompany).map(([companyId, { count, totalAmount, shippingFees }]) => (
                        <TableRow key={companyId}>
                          <TableCell className="font-medium">
                            {shippingCompanies.find(c => c.id === companyId)?.name || companyId}
                          </TableCell>
                          <TableCell className="text-center">{count}</TableCell>
                          <TableCell className="text-center">
                            <div className="font-medium text-green-600">
                              {formatPrice(totalAmount)} ج.م
                            </div>
                            <div className="text-xs text-muted-foreground">
                              (بدون رسوم الشحن: {formatPrice(shippingFees)} ج.م)
                            </div>
                          </TableCell>
                        </TableRow>
                      ));
                    })()}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800">تنبيه</h4>
                  <p className="text-sm text-amber-700">
                    سيتم خصم قيمة المنتجات فقط (بدون رسوم الشحن) من مستحقات شركات الشحن المرتبطة بها.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmCollectionDialogOpen(false)}
              disabled={isUpdating}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleConfirmCollection}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUpdating ? "جاري التحديث..." : "تأكيد التحصيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default InDeliveryPage;

