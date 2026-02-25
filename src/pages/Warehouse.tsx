import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Box, Package, Edit, Truck, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Order, OrderStatus } from "@/pages/Orders";
import { getOrders, updateOrderStatus, invalidateAllOrderQueries } from "@/services/orderService";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";

// لم نعد نحتاج إلى البيانات الوهمية لأننا نستخدم التخزين المحلي

const ProcessingOrders = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 20;

  // جلب الطلبات من التخزين المحلي
  const { data: orders, isLoading } = useQuery({
    queryKey: ["warehouse-orders"],
    queryFn: async () => {
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 300));
      return getOrders();
    },
    refetchInterval: 10000, // Smart Polling: 10s when active
  });

  // الحصول على الطلبات التي تنتمي إلى قسم المخازن مع تطبيق البحث
  const ordersList = Array.isArray(orders) ? orders : (orders?.data || []);
  const warehouseOrders = ordersList.filter((order: any) => {
    // فلترة حسب القسم
    const isWarehouseOrder = order.section === "warehouse";

    // فلترة حسب البحث (اسم العميل، رقم الهاتف، رقم الهاتف الثاني، كود الطلب)
    const matchesSearch = !searchQuery ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery) ||
      (order.customerPhone2 && order.customerPhone2.includes(searchQuery));

    return isWarehouseOrder && matchesSearch;
  }) || [];

  // ترتيب الطلبات حسب تاريخ التحديث (الأحدث أولاً)
  const sortedWarehouseOrders = [...warehouseOrders].sort((a, b) => {
    const timeA = new Date(a.updatedAt).getTime();
    const timeB = new Date(b.updatedAt).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return b.id.localeCompare(a.id);
  });

  // حساب الصفحات
  const totalOrders = sortedWarehouseOrders.length;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const paginatedOrders = sortedWarehouseOrders.slice(startIndex, endIndex);

  // تحديث حالة الطلب
  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 500));

      // تحديث حالة الطلب في التخزين المحلي
      await updateOrderStatus(orderId, newStatus);

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      toast.success(`تم تحديث حالة الطلب بنجاح`);
    } catch (error) {
      toast.error(`حدث خطأ أثناء تحديث حالة الطلب`);
    }
  };


  return (
    <>
      {/* خانة البحث */}
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex w-full max-w-sm items-center space-x-2 rtl:space-x-reverse">
            <Input
              placeholder="بحث بالاسم، رقم الهاتف، أو كود الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <Button variant="outline" size="icon">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            طلبات المخزن ({warehouseOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">جاري تحميل البيانات...</div>
          ) : warehouseOrders.length === 0 ? (
            <div className="text-center py-4">
              {searchQuery ?
                `لا توجد طلبات تطابق البحث "${searchQuery}"` :
                "لا توجد طلبات في المخزن حالياً"
              }
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 ${order.status === "confirmed" ? "bg-blue-50" : "bg-purple-50"} rounded-lg`}>
                      <Box className={`h-5 w-5 ${order.status === "confirmed" ? "text-blue-500" : "text-purple-500"}`} />
                    </div>
                    <div>
                      <p className="font-medium">طلب #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600">{order.customerName}</p>
                      <p className="text-sm text-gray-500">
                        {order.customerPhone} • {order.items.length} منتجات •
                        <span className="font-bold text-primary mr-2">
                          المطلوب تحصيله: {formatPrice(order.totalAmount - (order.paid_amount || 0))} ج.م
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/warehouse/orders/${order.id}`)}
                      className="gap-1"
                    >
                      عرض التفاصيل
                    </Button>
                    <Badge
                      variant="outline"
                      className="bg-purple-50 text-purple-700 border-purple-300"
                    >
                      قيد التجهيز
                    </Badge>
                  </div>
                </div>
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

      {/* تم إزالة النافذة المنبثقة واستبدالها بالانتقال إلى صفحة تفاصيل الطلب */}
    </>
  );
};

const WarehousePage = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">المخزن</h1>
          <p className="text-gray-500">
            إدارة المخزون والطلبات قيد التجهيز
          </p>
        </div>

        <ProcessingOrders />
      </div>
    </DashboardLayout>
  );
};

export default WarehousePage;
