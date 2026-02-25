
import React, { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { getOrders, saveOrders, updateOrderStatus } from "@/services/orderService";
import { mockOrders } from "@/data/mockOrders";
import { fixOrderImages } from "@/services/imageFixService";
import {
  Search,
  ArrowUpDown
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";

// New state hooks

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import OrderDetails from "@/components/orders/OrderDetails";
import OrderActions from "@/components/orders/OrderActions";

// Type definitions
export type OrderStatus =
  | "pending" // قيد الانتظار
  | "confirmed" // تم التأكيد
  | "processing" // قيد التجهيز
  | "shipped" // تم الشحن
  | "in_delivery" // جاري التوصيل
  | "delivered" // تم التسليم
  | "partially_delivered" // تم التسليم جزئياً
  | "delivery_rejected" // تم رفض التسليم
  | "returned" // مرتجع
  | "cancelled" // ملغي
  | "suspended"; // معلق

export type PaymentMethod = "cash" | "card" | "bank_transfer";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
  commission?: number;
  image?: string;
  color?: string;
  size?: string;
  delivered?: boolean;
  deliveredQuantity?: number;
  rejectedQuantity?: number;
  rejectionReason?: string;
  sku?: string;
}

export type OrderSection = "payment_confirmation" | "orders" | "warehouse" | "shipping" | "delivery" | "collection" | "archive";

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  province?: string;
  city?: string;
  customerNotes?: string;
  marketerId?: string;
  marketerName?: string;
  items: OrderItem[];
  status: OrderStatus;
  section?: OrderSection; // خاصية جديدة للإشارة إلى القسم الحالي للطلب
  totalAmount: number;
  shippingFee: number;
  discount?: number;
  commission?: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "paid" | "unpaid";
  notes?: string;
  shippingCompany?: string; // معرف شركة الشحن
  shippingCompanyName?: string; // اسم شركة الشحن
  trackingNumber?: string; // رقم التتبع
  shippingDate?: string; // تاريخ الشحن
  deliveryNotes?: string; // ملاحظات التوصيل
  page?: string; // الصفحة التي تم الطلب منها
  payment_screenshot?: string; // رابط صورة التحويل
  paid_amount?: number; // المبلغ المدفوع مقدماً
  createdAt: string;
  updatedAt: string;
}

// Mock data for demonstration - تم نقلها إلى ملف mockOrders.ts
// استخدم هذه البيانات فقط للمرجع
const _mockOrdersReference: Order[] = [
  {
    id: "1",
    orderNumber: "ORD-001",
    customerName: "أحمد محمد",
    customerPhone: "+20 123 456 7890",
    customerPhone2: "+20 111 222 3333",
    customerAddress: "شارع النصر، القاهرة، مصر",
    province: "القاهرة",
    city: "مدينة نصر",
    customerNotes: "يفضل التسليم بعد الساعة 5 مساءً",
    marketerName: "محمد علي",
    marketerId: "m1",
    items: [
      {
        id: "item1",
        productId: "p1",
        productName: "هاتف ذكي",
        quantity: 1,
        price: 5000,
        total: 5000,
        image: "/placeholder.svg",
        color: "أسود",
        size: ""
      },
      {
        id: "item2",
        productId: "p2",
        productName: "سماعات لاسلكية",
        quantity: 2,
        price: 500,
        total: 1000,
        image: "/placeholder.svg",
        color: "أبيض",
        size: ""
      }
    ],
    status: "pending",
    totalAmount: 6000,
    shippingFee: 50,
    commission: 300,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    createdAt: "2023-04-10T10:30:00Z",
    updatedAt: "2023-04-10T10:30:00Z"
  },
  {
    id: "2",
    orderNumber: "ORD-002",
    customerName: "سارة أحمد",
    customerPhone: "+20 111 222 3333",
    customerPhone2: "",
    customerAddress: "شارع الهرم، الجيزة، مصر",
    province: "الجيزة",
    city: "الهرم",
    customerNotes: "عميل دائم",
    marketerName: "فاطمة حسن",
    marketerId: "m2",
    items: [
      {
        id: "item3",
        productId: "p3",
        productName: "ساعة ذكية",
        quantity: 1,
        price: 2000,
        total: 2000,
        image: "/placeholder.svg",
        color: "أسود",
        size: ""
      }
    ],
    status: "confirmed",
    totalAmount: 2000,
    shippingFee: 60,
    discount: 200,
    commission: 100,
    paymentMethod: "bank_transfer",
    paymentStatus: "paid",
    notes: "يرجى الاتصال قبل التسليم",
    createdAt: "2023-04-09T14:45:00Z",
    updatedAt: "2023-04-09T15:30:00Z"
  },
  {
    id: "3",
    orderNumber: "ORD-003",
    customerName: "خالد عبد الله",
    customerPhone: "+20 100 200 3000",
    customerAddress: "شارع فيصل، الجيزة، مصر",
    province: "الجيزة",
    city: "فيصل",
    marketerName: "محمد علي",
    marketerId: "m1",
    items: [
      {
        id: "item4",
        productId: "p4",
        productName: "لابتوب",
        quantity: 1,
        price: 12000,
        total: 12000,
        image: "/placeholder.svg",
        color: "رمادي",
        size: ""
      },
      {
        id: "item5",
        productId: "p5",
        productName: "ماوس",
        quantity: 1,
        price: 300,
        total: 300,
        image: "/placeholder.svg",
        color: "أسود",
        size: ""
      }
    ],
    status: "cancelled",
    totalAmount: 12300,
    shippingFee: 0,
    commission: 246,
    paymentMethod: "card",
    paymentStatus: "unpaid",
    notes: "تم إلغاء الطلب بناء على طلب العميل",
    createdAt: "2023-04-08T09:20:00Z",
    updatedAt: "2023-04-08T11:15:00Z"
  },
  {
    id: "4",
    orderNumber: "ORD-004",
    customerName: "هدى حسين",
    customerPhone: "+20 155 666 7777",
    customerAddress: "شارع التحرير، القاهرة، مصر",
    province: "القاهرة",
    city: "وسط البلد",
    marketerName: "فاطمة حسن",
    marketerId: "m2",
    items: [
      {
        id: "item6",
        productId: "p6",
        productName: "مكنسة كهربائية",
        quantity: 1,
        price: 2500,
        total: 2500,
        image: "/placeholder.svg",
        color: "أحمر",
        size: ""
      }
    ],
    status: "processing",
    totalAmount: 2500,
    shippingFee: 50,
    commission: 100,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    createdAt: "2023-04-07T16:10:00Z",
    updatedAt: "2023-04-07T16:45:00Z"
  },
  {
    id: "5",
    orderNumber: "ORD-005",
    customerName: "محمود سعيد",
    customerPhone: "+20 122 333 4444",
    customerAddress: "شارع المعز، القاهرة، مصر",
    province: "القاهرة",
    city: "الحسين",
    marketerName: "محمد علي",
    marketerId: "m1",
    items: [
      {
        id: "item7",
        productId: "p7",
        productName: "تلفزيون ذكي",
        quantity: 1,
        price: 8000,
        total: 8000,
        image: "/placeholder.svg",
        color: "أسود",
        size: "50 بوصة"
      }
    ],
    status: "shipped",
    totalAmount: 8000,
    shippingFee: 50,
    commission: 240,
    paymentMethod: "cash",
    paymentStatus: "unpaid",
    createdAt: "2023-04-06T11:25:00Z",
    updatedAt: "2023-04-06T14:30:00Z"
  }
];

// Helper function to get status badge color
const getStatusBadgeColor = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
    case "confirmed":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100";
    case "processing":
      return "bg-purple-100 text-purple-800 hover:bg-purple-100";
    case "shipped":
      return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
    case "in_delivery":
      return "bg-orange-100 text-orange-800 hover:bg-orange-100";
    case "delivered":
      return "bg-green-100 text-green-800 hover:bg-green-100";
    case "partially_delivered":
      return "bg-teal-100 text-teal-800 hover:bg-teal-100";
    case "delivery_rejected":
      return "bg-pink-100 text-pink-800 hover:bg-pink-100";
    case "cancelled":
      return "bg-red-100 text-red-800 hover:bg-red-100";
    case "suspended":
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-100";
  }
};

// Helper function to translate status to Arabic
const translateStatus = (status: OrderStatus) => {
  switch (status) {
    case "pending":
      return "قيد الانتظار";
    case "confirmed":
      return "تم التأكيد";
    case "processing":
      return "قيد التجهيز";
    case "shipped":
      return "تم الشحن";
    case "in_delivery":
      return "جاري التوصيل";
    case "delivered":
      return "تم التسليم";
    case "partially_delivered":
      return "تم التسليم جزئياً";
    case "delivery_rejected":
      return "تم رفض التسليم";
    case "cancelled":
      return "ملغي";
    case "suspended":
      return "معلق";
    default:
      return status;
  }
};

// Helper function to translate payment method to Arabic
const translatePaymentMethod = (method: PaymentMethod) => {
  switch (method) {
    case "cash":
      return "الدفع عند الاستلام";
    case "card":
      return "بطاقة ائتمان";
    case "bank_transfer":
      return "تحويل بنكي";
    default:
      return method;
  }
};

const OrdersPage = () => {
  const { formatPrice } = usePriceFormatter();
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const ordersPerPage = 20;

  const queryClient = useQueryClient();

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // جلب الطلبات من API
  const { data: ordersResponse, isLoading, error } = useQuery({
    queryKey: ["orders", currentPage, searchQuery],
    queryFn: async () => {
      return getOrders(currentPage, ordersPerPage, searchQuery);
    },
    refetchInterval: 10000,
  });

  const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);
  const totalItems = Array.isArray(ordersResponse) ? ordersResponse.length : (ordersResponse?.total || 0);
  const totalPages = Array.isArray(ordersResponse) ? Math.ceil(ordersResponse.length / ordersPerPage) : (ordersResponse?.totalPages || 1);

  // Apply visual filters (if any remaining client-side logic is needed)
  const filteredOrders = orders.filter(order => {
    // عرض الطلبات التي تنتمي إلى قسم "orders" فقط
    const isInOrdersSection = order.section === "orders" || order.section === undefined;
    return isInOrdersSection;
  });

  const paginatedOrders = filteredOrders;

  // State for managing order statuses
  const [orderStatuses, setOrderStatuses] = useState<Record<string, OrderStatus>>({});

  // Handlers
  const navigate = useNavigate(); // Initialize navigate hook at the top level of the component

  const handleViewDetails = (orderId: string) => {
    navigate(`/admin/orders/${orderId}`);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">إدارة الطلبات</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full max-w-sm items-center space-x-2 rtl:space-x-reverse">
                <Input
                  placeholder="بحث عن طلب..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
                <Button variant="outline" size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {/* تم حذف زر حالة الطلب */}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              طلبات قيد المراجعة ({filteredOrders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-4">جاري تحميل البيانات...</div>
            ) : error ? (
              <div className="text-center py-4 text-red-500">حدث خطأ أثناء تحميل البيانات</div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-4">لا توجد طلبات متطابقة مع معايير البحث</div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-center">رقم الطلب</TableHead>
                      <TableHead className="text-center">
                        <div className="flex items-center justify-center">
                          اسم العميل
                          <ArrowUpDown className="mr-2 h-4 w-4" />
                        </div>
                      </TableHead>
                      <TableHead className="text-center">المبلغ الإجمالي</TableHead>
                      <TableHead className="text-center">تاريخ الطلب</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedOrders.map((order) => (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleViewDetails(order.id)}>
                        <TableCell className="font-medium text-center">{order.orderNumber}</TableCell>
                        <TableCell className="text-center">{order.customerName}</TableCell>
                        <TableCell className="text-center font-bold">
                          <div>
                            {formatPrice((order.totalAmount || 0) - (order.paid_amount || 0))} ج.م
                          </div>
                          {order.paid_amount > 0 && (
                            <div className="text-[10px] text-green-600">
                              (مسبق الدفع: {formatPrice(order.paid_amount)})
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={`${getStatusBadgeColor(order.status)} border-none`}>
                            {translateStatus(order.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button variant="outline" size="sm" onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetails(order.id);
                          }}>
                            عرض التفاصيل
                          </Button>
                        </TableCell>

                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>

                    {/* Simplified pagination items */}
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                      // Logic to show pages around current page
                      let pageNum = i + 1;
                      if (totalPages > 7) {
                        if (currentPage > 4) pageNum = currentPage - 4 + i + 1;
                        if (pageNum > totalPages) pageNum = totalPages - (6 - i);
                      }
                      if (pageNum <= 0 || pageNum > totalPages) return null;

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pageNum === currentPage}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Remove the OrderDetails modal component */}
      {/* {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={handleCloseDetails}
        />
      )} */}
    </DashboardLayout>
  );
};

export default OrdersPage;

