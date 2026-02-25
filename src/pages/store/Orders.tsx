import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Clock, CheckCircle, XCircle, TrendingUp, Eye, Search, User, Phone, Truck, Loader, DollarSign } from "lucide-react";
import { useWallet } from "@/contexts/store/WalletContext";
import { useOrders } from "@/contexts/store/OrdersContext";
import { useUser } from "@/contexts/store/UserContext";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getSiteSettings } from "@/services/siteSettingsService";
import { getStatusBadge, getStatusText } from "@/lib/orderUtils";
import { markCommissionAsDelivered } from "@/services/marketerService";
import OrderStats from "@/components/store/OrderStats";

interface Order {
  id: string;
  product: string;
  customer: string;
  price: number;
  commission: number;
  status: "pending" | "confirmed" | "processing" | "shipped" | "in_delivery" | "delivered" | "partially_delivered" | "delivery_rejected" | "cancelled" | "suspended";
  date: string;
  image: string;
  updatedAt?: string;
  notes?: string;
  province?: string;
  phone?: string;
  alternativePhone?: string;
}



const statusConfig = {
  pending: { label: "قيد الانتظار", icon: Clock, color: "bg-yellow-500" },
  confirmed: { label: "قيد التجهيز", icon: CheckCircle, color: "bg-blue-500" },
  processing: { label: "جاري التجهيز", icon: Loader, color: "bg-purple-500" },
  shipped: { label: "قيد الشحن", icon: Truck, color: "bg-indigo-500" },
  in_delivery: { label: "جاري التوصيل", icon: Truck, color: "bg-orange-500" },
  delivered: { label: "تم التسليم", icon: CheckCircle, color: "bg-green-500" },
  partially_delivered: { label: "تسليم جزئي", icon: TrendingUp, color: "bg-teal-500" },
  delivery_rejected: { label: "ملغى", icon: XCircle, color: "bg-red-500" },
  cancelled: { label: "ملغي", icon: XCircle, color: "bg-red-500" },
  suspended: { label: "معلق", icon: Clock, color: "bg-gray-500" }
};

const Orders = () => {
  const { orders, updateOrderStatus } = useOrders();
  const { user } = useUser();
  const navigate = useNavigate();
  const { addToBalance, totalEarnedCommission, refreshWallet } = useWallet();
  const [searchQuery, setSearchQuery] = useState(""); // حالة البحث
  const [activeFilter, setActiveFilter] = useState("all"); // Active filter state
  const [currentPage, setCurrentPage] = useState(1);
  const ORDERS_PER_PAGE = 20;

  // Fetch site settings for WhatsApp number
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: getSiteSettings,
  });

  // تصفية الطلبات حسب نص البحث مع تحسين الأداء باستخدام useMemo
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders;

    const lowerCaseQuery = searchQuery.toLowerCase();
    return orders.filter(order =>
      order.customer.toLowerCase().includes(lowerCaseQuery) ||
      order.phone?.toLowerCase().includes(lowerCaseQuery) ||
      order.alternativePhone?.toLowerCase().includes(lowerCaseQuery) ||
      order.id.toLowerCase().includes(lowerCaseQuery)
    );
  }, [orders, searchQuery]);

  // ترتيب الطلبات حسب الأحدث أولاً
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      // تحويل معرفات الطلبات إلى أرقام للمقارنة
      const idA = parseInt(a.id.split('-')[1]);
      const idB = parseInt(b.id.split('-')[1]);
      return idB - idA; // ترتيب تنازلي (الأحدث أولاً)
    });
  }, [filteredOrders]);

  // حساب الصفحات
  const totalOrders = sortedOrders.length;
  const totalPages = Math.ceil(totalOrders / ORDERS_PER_PAGE);
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE;
  const endIndex = startIndex + ORDERS_PER_PAGE;
  const paginatedOrders = sortedOrders.slice(startIndex, endIndex);

  // تحديث دالة تغيير الحالة لتناسب الأنواع الجديدة
  const handleUpdateOrderStatus = (orderId: string, newStatus: any) => {
    updateOrderStatus(orderId, newStatus);

    const order = orders.find(o => o.id === orderId);
    if (order) {
      const wasCompleted = order.status === "delivered";
      const isNowCompleted = newStatus === "delivered";

      // إضافة العمولة للمحفظة عند تغيير الحالة إلى "تم التسليم"
      if (isNowCompleted && !wasCompleted) {
        // تحديث حالة العمولة في قاعدة البيانات وتحديث الرصيد
        markCommissionAsDelivered(orderId).then(() => {
          refreshWallet();
        });

        toast({
          title: "تم تسليم الطلب",
          description: `تم إضافة عمولة ${order.commission} جنيه إلى أرباحك وجاري تحديث الرصيد`,
        });
      }
    }

    toast({
      title: "تم تحديث حالة الطلب",
      description: `تم تغيير حالة الطلب إلى ${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}`,
    });
  };

  const totalCommission = sortedOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.commission || 0), 0);

  // حساب إحصائيات الطلبات التفصيلية لنقلها لصفحة الطلبات
  const orderStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const s = order.status;
        if (s === "pending" || (s as string) === "new") {
          acc.pending++;
        }
        else if (s === "processing" || s === "confirmed" || (s as string) === "warehouse") {
          acc.processing++;
        }
        else if (s === "shipped") {
          acc.shipped++;
        }
        else if (s === "in_delivery" || (s as string) === "out_for_delivery") {
          acc.inDelivery++;
        }
        else if (s === "delivered" || (s as string) === "completed") {
          acc.completed++;
        }
        else if (s === "cancelled" || (s as string) === "returned" || (s as string) === "rejected" || s === "delivery_rejected") {
          acc.cancelled++;
        }
        else if (s === "partially_delivered" || (s as string) === "partial") {
          acc.partial++;
        }
        return acc;
      },
      {
        pending: 0,
        processing: 0,
        shipped: 0,
        inDelivery: 0,
        completed: 0,
        cancelled: 0,
        partial: 0,
      }
    );
  }, [orders]);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Navbar />

      <div className="relative">
        {/* Premium Shiny Green Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white pt-10 pb-20 px-4 md:px-8 rounded-b-[2.5rem] shadow-lg mb-[-4rem]">
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group transition-all hover:bg-white/30">
                <Package className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-4 md:px-6 py-3 rounded-2xl shadow-xl border border-white/50 max-w-full overflow-hidden">
                <p className="text-zinc-900 text-[11px] sm:text-sm md:text-xl font-black whitespace-nowrap font-cairo">تتبع حالة طلباتك السابقة والحالية</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">

        {/* كروت ملخص الطلبات - استبدال بالقديمة بمكون OrderStats الموحد للموبايل فقط */}
        <div className="mb-10">
          <div className="md:hidden">
            <OrderStats stats={orderStats} />
          </div>

          {/* وضع الكمبيوتر: استعادة الكروت الـ 4 الأصلية */}
          <div className="hidden md:grid grid-cols-4 gap-6">
            {/* إجمالي الطلبات - Black/Slate */}
            <div className="bg-slate-100/80 dark:bg-slate-900/40 backdrop-blur-md rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-slate-500/10 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-sm">
                <Package className="w-6 h-6 text-slate-700 dark:text-slate-300" />
              </div>
              <div className="text-3xl font-black text-slate-800 dark:text-slate-200 mb-1 leading-none">{orders.length}</div>
              <div className="text-[10px] md:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">إجمالي الطلبات</div>
            </div>

            {/* مكتملة - Green */}
            <div className="bg-green-50/80 dark:bg-green-900/20 backdrop-blur-md rounded-[2rem] p-5 border border-green-200 dark:border-green-800 shadow-inner flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-sm">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-3xl font-black text-green-700 dark:text-green-300 mb-1 leading-none">
                {orders.filter(o => o.status === "delivered").length}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">طلبات مكتملة</div>
            </div>

            {/* قيد الانتظار - Red */}
            <div className="bg-red-50/80 dark:bg-red-900/20 backdrop-blur-md rounded-[2rem] p-5 border border-red-200 dark:border-red-800 shadow-inner flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-sm">
                <Clock className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-3xl font-black text-red-700 dark:text-red-300 mb-1 leading-none">
                {orders.filter(o => o.status === "pending").length}
              </div>
              <div className="text-[10px] md:text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">قيد الانتظار</div>
            </div>

            {/* إجمالي العمولة - Blue */}
            <div className="bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-md rounded-[2rem] p-5 border border-blue-200 dark:border-blue-800 shadow-inner flex flex-col items-center justify-center text-center group hover:scale-[1.02] transition-all duration-300 cursor-default">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-3 group-hover:rotate-12 transition-transform shadow-sm">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-300 mb-1 leading-none">{Math.floor(totalEarnedCommission)}</div>
              <div className="text-[10px] md:text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider font-cairo">إجمالي العمولة (جنيه)</div>
            </div>
          </div>
        </div>

        {/* شريط البحث - مصغر ومتوسط */}
        <div className="max-w-xl mx-auto relative mb-10 group">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 group-focus-within:text-primary transition-colors" />
          <Input
            type="text"
            placeholder="ابحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-4 pr-11 h-12 text-sm shadow-sm border-gray-100 bg-white dark:bg-zinc-900/50 focus:border-primary focus:ring-primary/10 rounded-full transition-all duration-300"
          />
        </div>


        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>قائمة الطلبات</CardTitle>
          </CardHeader>
          <CardContent>

            {/* Button Filter Navigation */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 mb-6">
              <Button
                variant={activeFilter === "all" ? "default" : "outline"}
                onClick={() => setActiveFilter("all")}
                className="w-full"
              >
                الكل
              </Button>
              <Button
                variant={activeFilter === "pending" ? "default" : "outline"}
                onClick={() => setActiveFilter("pending")}
                className="w-full"
              >
                قيد الانتظار
              </Button>
              <Button
                variant={activeFilter === "processing" ? "default" : "outline"}
                onClick={() => setActiveFilter("processing")}
                className="w-full"
              >
                جاري التجهيز
              </Button>
              <Button
                variant={activeFilter === "shipped" ? "default" : "outline"}
                onClick={() => setActiveFilter("shipped")}
                className="w-full"
              >
                قيد الشحن
              </Button>
              <Button
                variant={activeFilter === "in_delivery" ? "default" : "outline"}
                onClick={() => setActiveFilter("in_delivery")}
                className="w-full"
              >
                جاري التوصيل
              </Button>
              <Button
                variant={activeFilter === "delivered" ? "default" : "outline"}
                onClick={() => setActiveFilter("delivered")}
                className="w-full"
              >
                تم التسليم
              </Button>
              <Button
                variant={activeFilter === "partially_delivered" ? "default" : "outline"}
                onClick={() => setActiveFilter("partially_delivered")}
                className="w-full"
              >
                تسليم جزئي
              </Button>
              <Button
                variant={activeFilter === "cancelled" ? "default" : "outline"}
                onClick={() => setActiveFilter("cancelled")}
                className="w-full"
              >
                ملغى
              </Button>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {paginatedOrders
                .filter((order) => {
                  if (activeFilter === "all") return true;
                  if (activeFilter === "processing") return order.status === "processing" || order.status === "confirmed";
                  if (activeFilter === "cancelled") return order.status === "cancelled" || order.status === "delivery_rejected";
                  return order.status === activeFilter;
                })
                .map((order) => {
                  // Safe lookup for status config with fallback to "pending"
                  const currentStatus = (statusConfig[order.status as keyof typeof statusConfig] ? order.status : "pending") as keyof typeof statusConfig;
                  const statusData = statusConfig[currentStatus];
                  const StatusIcon = statusData.icon;

                  return (
                    <Card key={order.id} className="gradient-card border-border/50">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                          <img
                            src={order.image}
                            alt={order.product}
                            className="w-full sm:w-24 h-32 sm:h-24 rounded-lg object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                              <div className="flex-1">
                                <h3 className="font-bold text-lg break-words">{order.product}</h3>
                                <p className="text-sm text-muted-foreground">رقم الطلب: {order.id}</p>
                              </div>

                              {/* Status Badge with Timestamp */}
                              <div className="flex flex-col gap-2 items-end">
                                <Badge
                                  className={`${statusData.color} whitespace-nowrap flex-shrink-0`}
                                >
                                  <StatusIcon className="w-3 h-3 ml-1" />
                                  {statusData.label}
                                </Badge>

                                {/* Status Update Timestamp */}
                                {order.updatedAt && (
                                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl text-[10px] sm:text-xs text-blue-700 dark:text-blue-300 shadow-sm animate-in fade-in zoom-in duration-300">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    <span className="font-bold">
                                      {new Date(order.updatedAt).toLocaleDateString('ar-EG', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Order Details Table */}
                            <div className="mb-4 overflow-x-auto">
                              <table className="w-full text-sm border-collapse">
                                <thead>
                                  <tr className="bg-secondary/10">
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">العميل</th>
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">الهاتف</th>
                                    {order.alternativePhone && (
                                      <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">الهاتف البديل</th>
                                    )}
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">المحافظة</th>
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">السعر</th>
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">العمولة</th>
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">التاريخ</th>
                                    <th className="py-2 px-3 text-right font-bold text-muted-foreground border-b-2 border-border">الملاحظات</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="py-2 px-3 font-medium border-b border-border/50">{order.customer}</td>
                                    <td className="py-2 px-3 font-medium border-b border-border/50">{order.phone}</td>
                                    {order.alternativePhone && (
                                      <td className="py-2 px-3 font-medium border-b border-border/50">{order.alternativePhone}</td>
                                    )}
                                    <td className="py-2 px-3 font-medium border-b border-border/50">{order.province || "-"}</td>
                                    <td className="py-2 px-3 font-medium border-b border-border/50">{Math.floor(order.price)} جنيه</td>
                                    <td className="py-2 px-3 font-bold text-primary border-b border-border/50">{Math.floor(order.commission)} جنيه</td>
                                    <td className="py-2 px-3 font-medium border-b border-border/50">{order.date}</td>
                                    <td className="py-2 px-3 font-medium border-b border-border/50 text-muted-foreground italic">{order.notes || "لا توجد"}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* عرض سبب الإلغاء إذا وجد */}
                            {(order.status === "cancelled" || order.status === "delivery_rejected") && order.cancellationReason && (
                              <div className="mt-3 mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <span className="font-bold text-red-800 ml-1">سبب الإلغاء:</span>
                                    <span className="text-red-700 font-medium">{order.cancellationReason}</span>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {/* زر الإلغاء يظهر فقط في حالة "قيد المراجعة" */}
                              {order.status === "pending" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleUpdateOrderStatus(order.id, "cancelled")}
                                >
                                  <XCircle className="w-4 h-4 ml-2" />
                                  إلغاء
                                </Button>
                              )}

                              {/* زر الواتساب يظهر في الحالات: قيد الانتظار، جارٍ التجهيز، جارٍ الشحن، جاري التوصيل */}
                              {(order.status === "pending" || order.status === "confirmed" || order.status === "processing" || order.status === "shipped" || order.status === "in_delivery") && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600"
                                  onClick={() => {
                                    // استخدام رقم الواتساب من الإعدادات
                                    const adminWhatsApp = settings?.whatsappNumber;

                                    if (!adminWhatsApp) {
                                      toast({
                                        title: "غير متوفر",
                                        description: "رقم واتساب الإدارة غير محدد في الإعدادات",
                                        variant: "destructive"
                                      });
                                      return;
                                    }

                                    // رسالة واتساب تتضمن بيانات العميل واسم المسوق
                                    const marketerName = user?.name || "المسوق";
                                    const message = `استعلام من المسوق: ${marketerName}%0A%0Aرقم الطلب: ${order.id}%0Aاسم العميل: ${order.customer}%0Aعنوان العميل: ${order.address} - ${order.city} - ${order.province}%0Aرقم هاتف العميل: ${order.phone}${order.alternativePhone ? `%0Aرقم هاتف بديل: ${order.alternativePhone}` : ''}%0A%0Aإجمالي الطلب: ${order.price} جنيه%0Aعمولة المسوق: ${order.commission} جنيه`;
                                    window.open(`https://wa.me/${adminWhatsApp}?text=${message}`, '_blank');
                                  }}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-2">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                  </svg>
                                  واتساب
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>

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
    </div >
  );
};

export default Orders;
