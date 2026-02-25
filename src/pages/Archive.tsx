import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Order, OrderStatus, OrderSection } from "./Orders";
import { getOrdersBySection, updateOrderStatus, updateOrder, invalidateAllOrderQueries } from "@/services/orderService";
import { Search, Archive, RefreshCcw, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import AdminSecurityDialog from "@/components/common/AdminSecurityDialog";
import { getSiteSettings } from "@/services/siteSettingsService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const ArchivePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isReactivateDialogOpen, setIsReactivateDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"updatedAt" | "orderNumber" | "customerName">("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Security State (Bypassed)
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [isCheckingSecurity, setIsCheckingSecurity] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);

  const normalizeNumerals = (str: string) => {
    const arabicNumerals = [/٠/g, /١/g, /٢/g, /٣/g, /٤/g, /٥/g, /٦/g, /٧/g, /٨/g, /٩/g];
    let result = str;
    for (let i = 0; i < 10; i++) {
      result = result.replace(arabicNumerals[i], i.toString());
    }
    return result;
  };

  // Security check removed at user request
  /*
  useEffect(() => {
    ...
  }, []);
  */

  const handleSecuritySuccess = async () => {
    const settings = await getSiteSettings();
    const archivePassword = settings?.archiveMasterPassword || "ahmed3990";
    localStorage.setItem("archive_access_token", String(archivePassword).trim());
    setIsAuthorized(true);
    setIsSecurityDialogOpen(false);
  };

  // عدد الطلبات في الصفحة الواحدة
  const ordersPerPage = 50;

  // جلب الطلبات من الأرشيف مع البارامترات الجديدة
  const { data: archiveResponse, isLoading } = useQuery({
    queryKey: ["archive-orders", currentPage, searchTerm],
    queryFn: () => getOrdersBySection("archive", currentPage, ordersPerPage, searchTerm),
    refetchInterval: 10000,
  });

  const orders = Array.isArray(archiveResponse) ? archiveResponse : (archiveResponse?.data || []);
  const totalItems = Array.isArray(archiveResponse) ? archiveResponse.length : (archiveResponse?.total || 0);
  const totalPages = Array.isArray(archiveResponse) ? Math.ceil(totalItems / ordersPerPage) : (archiveResponse?.totalPages || 1);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredOrders = orders;
  const paginatedOrders = orders;
  const startIndex = (currentPage - 1) * ordersPerPage;
  const endIndex = startIndex + filteredOrders.length;

  // فتح نافذة إعادة تنشيط الطلب
  const openReactivateDialog = (order: Order) => {
    setSelectedOrder(order);
    setIsReactivateDialogOpen(true);
  };

  // إعادة تنشيط الطلب
  const handleReactivateOrder = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);

      // تحديث حالة الطلب إلى "قيد الانتظار"
      const updatedOrder = {
        ...selectedOrder,
        status: "pending" as OrderStatus,
        section: "orders" as OrderSection,
        updatedAt: new Date().toISOString()
      };

      // تحديث الطلب
      await updateOrderStatus(selectedOrder.id, "pending");
      await updateOrder(updatedOrder);

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      toast.success("تم إعادة تنشيط الطلب بنجاح");
      setIsReactivateDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء إعادة تنشيط الطلب");
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleSortChange = (field: "updatedAt" | "orderNumber" | "customerName") => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  if (isCheckingSecurity) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Authorization check bypassed - Access granted to all admin users with access to this route

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">أرشيف الطلبات</h1>
            <p className="text-muted-foreground">
              إدارة الطلبات المكتملة والملغاة والمحصلة
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center">
            {searchTerm.trim() && (
              <div className="text-sm text-muted-foreground">
                نتائج البحث: <span className="font-medium text-primary">{totalItems}</span> طلب
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs mr-2"
                  onClick={() => setSearchTerm("")}
                >
                  مسح البحث
                </Button>
              </div>
            )}
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث عن طلب، عميل، رقم هاتف..."
              className="pl-10 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الطلبات المؤرشفة</CardTitle>
            <CardDescription>
              {totalItems} طلب (مكتمل، ملغي، محصل)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-10">
                <Archive className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                <h3 className="text-lg font-medium">لا توجد طلبات</h3>
                <p className="text-muted-foreground">
                  لا توجد طلبات في الأرشيف حاليًا
                </p>
              </div>
            ) : (
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24 text-center">
                        <button
                          className="flex flex-col items-center w-full hover:bg-gray-50 py-1 rounded-md transition-colors"
                          onClick={() => handleSortChange("orderNumber")}
                        >
                          <div className="flex items-center gap-1">
                            <span>رقم</span>
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
                          <span>حالة</span>
                          <span>الطلب</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-32 text-center">
                        <div className="flex flex-col items-center">
                          <span>ملاحظات</span>
                        </div>
                      </TableHead>
                      <TableHead className="w-32 text-center">
                        <button
                          className="flex flex-col items-center w-full hover:bg-gray-50 py-1 rounded-md transition-colors"
                          onClick={() => handleSortChange("updatedAt")}
                        >
                          <div className="flex items-center gap-1">
                            <span>تاريخ</span>
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
                    {orders.map((order: any) => (
                      <TableRow key={order.id}>
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
                          <Badge className={
                            order.status === "delivered" ? "bg-green-100 text-green-800" :
                              order.status === "partially_delivered" ? "bg-yellow-100 text-yellow-800" :
                                order.status === "delivery_rejected" ? "bg-red-100 text-red-800" :
                                  order.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                                    "bg-blue-100 text-blue-800"
                          }>
                            {order.status === "delivered" && "تم التسليم"}
                            {order.status === "partially_delivered" && "تسليم جزئي"}
                            {order.status === "delivery_rejected" && "تم رفض الاستلام"}
                            {order.status === "cancelled" && "ملغي"}
                            {!["delivered", "partially_delivered", "delivery_rejected", "cancelled"].includes(order.status) && order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground truncate max-w-[150px]">
                            {order.collectionNotes || order.cancellationReason || "غير محدد"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {new Date(order.collectionDate || order.cancellationDate || order.updatedAt).toLocaleDateString("ar-EG")}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-gray-700">
                            {order.totalAmount} ج.م
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => openReactivateDialog(order)}
                            >
                              <RefreshCcw className="h-4 w-4 mr-1" />
                              إعادة تنشيط
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => navigate(`/admin/orders/${order.id}`)}
                            >
                              <Info className="h-4 w-4 mr-1" />
                              التفاصيل
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

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
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => (
                          <PaginationItem key={i}>
                            <PaginationLink
                              onClick={() => handlePageChange(i + 1)}
                              isActive={currentPage === i + 1}
                            >
                              {i + 1}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={isReactivateDialogOpen} onOpenChange={setIsReactivateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إعادة تنشيط الطلب</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من إعادة تنشيط الطلب #{selectedOrder?.orderNumber}؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReactivateDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleReactivateOrder}
              disabled={isUpdating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? "جاري التنفيذ..." : "تأكيد إعادة التنشيط"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default ArchivePage;
