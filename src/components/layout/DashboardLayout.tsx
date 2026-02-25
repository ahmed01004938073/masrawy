
import React, { useState, useEffect } from "react";
import { Link, useLocation, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { BarChart2, Box, LogOut, Menu, Package, Settings, ShoppingCart, Users, Star, Home, Truck, DollarSign, LayoutDashboard, Activity, Archive, ClipboardCheck, UserCog, Bell, X, Flame } from "lucide-react";
import NotificationButton from "@/components/notifications/NotificationButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { getOrders, getOrdersCountBySection } from "@/services/orderService";
import { getWithdrawalRequests } from "@/services/withdrawalService";
import { getSiteSettings } from "@/services/siteSettingsService";
import { sendHeartbeat, getEmployees } from "@/services/employeeService";
import { getMarketers } from "@/services/marketerService";
import { useQuery } from "@tanstack/react-query";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  permission: string;
}

const mainNav: NavItem[] = [
  {
    title: "الرئيسية",
    href: "/admin/dashboard",
    icon: Home,
    permission: "view_dashboard",
  },

  {
    title: "المنتجات",
    href: "/admin/products",
    icon: Box,
    permission: "view_products",
  },
  {
    title: "الأقسام",
    href: "/admin/categories",
    icon: LayoutDashboard,
    permission: "view_categories",
  },

  {
    title: "تأكيد الدفع",
    href: "/admin/payment-confirmation",
    icon: ClipboardCheck,
    permission: "view_orders",
  },
  {
    title: "الطلبات",
    href: "/admin/orders",
    icon: ShoppingCart,
    permission: "view_orders",
  },
  {
    title: "المخزن",
    href: "/admin/warehouse",
    icon: Package,
    permission: "view_warehouse",
  },
  {
    title: "الشحن",
    href: "/admin/shipping",
    icon: Truck,
    permission: "view_shipping",
  },
  {
    title: "جاري التوصيل",
    href: "/admin/in-delivery",
    icon: Activity,
    permission: "view_shipping",
  },
  {
    title: "أرشيف الطلبات",
    href: "/admin/archive",
    icon: Archive,
    permission: "view_orders",
  },
  {
    title: "المسوقين",
    href: "/admin/marketers",
    icon: Users,
    permission: "view_marketers",
  },
  {
    title: "العمولات",
    href: "/admin/commissions",
    icon: DollarSign,
    permission: "view_commissions",
  },
  {
    title: "إعدادات الشحن",
    href: "/admin/shipping-settings",
    icon: ClipboardCheck,
    permission: "view_shipping",
  },
  {
    title: "التقارير",
    href: "/admin/reports",
    icon: BarChart2,
    permission: "view_reports",
  },
  {
    title: "تحليل المشتريات",
    href: "/admin/purchase-dashboard",
    icon: Flame,
    permission: "view_reports",
  },

  {
    title: "الإعدادات",
    href: "/admin/settings",
    icon: Settings,
    permission: "view_settings",
  },
  {
    title: "إعدادات الموقع",
    href: "/admin/site-settings",
    icon: Star,
    permission: "view_settings",
  },

];



interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, logout, hasPermission } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false); // مغلق افتراضياً على الموبايل
  const [isMobile, setIsMobile] = useState(false);

  // حذفنا كود المزامنة اليدوي لأن الـ Context هو المصدر الوحيد للحقيقة الآن
  // ونحن نستخدم الكوكيز بدلاً من التخزين المحلي

  // تحديد حجم الشاشة
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setSidebarOpen(true); // فتح القائمة على الشاشات الكبيرة
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);


  // وظيفة تسجيل الخروج والتوجيه إلى صفحة تسجيل الدخول
  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (!user) {
    return <Navigate to="/admin/login" />;
  }

  // جلب عدد الطلبات في كل قسم
  const { data: sectionCounts } = useQuery({
    queryKey: ["section-counts"],
    queryFn: async () => {
      return getOrdersCountBySection();
    },
    refetchInterval: 30000, // إعادة جلب البيانات كل 30 ثانية
  });

  // جلب طلبات السحب
  const { data: withdrawalRequests } = useQuery({
    queryKey: ["withdrawal-requests"],
    queryFn: async () => {
      return getWithdrawalRequests();
    },
    refetchInterval: 30000, // إعادة جلب البيانات كل 30 ثانية
  });

  // جلب إعدادات الموقع
  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: getSiteSettings,
    refetchInterval: 30000,
  });

  // جلب المسوقين لحساب العدد
  const { data: marketersData } = useQuery({
    queryKey: ["marketers-count"],
    queryFn: () => getMarketers(1, 1), // جلب صفحة واحدة لمعرفة الإجمالي
    refetchInterval: 300000, // 5 minutes refresh
  });

  // حساب عدد الطلبات المعلقة
  const pendingOrdersCount = sectionCounts?.orders || 0;

  // حساب إجمالي المسوقين
  const totalMarketersCount = (marketersData as any)?.total || (Array.isArray(marketersData) ? marketersData.length : 0);

  // حساب عدد طلبات السحب قيد الانتظار
  const withdrawalsList = Array.isArray(withdrawalRequests) ? withdrawalRequests : (withdrawalRequests as any)?.data || [];
  const pendingWithdrawalsCount = withdrawalsList.filter(request => request.status === "pending").length || 0;

  // حساب عدد الإشعارات غير المقروءة (временно ثابت)
  const unreadNotificationsCount = 3; // سيتم استبداله بالعدد الفعلي لاحقًا

  // تحديث عدد الإشعارات عند تحميل الصفحة
  useEffect(() => {
    // محاكاة تحديث عدد الإشعارات
    const updateNotificationCount = () => {
      // في المستقبل يمكن استبدال هذا بكود حقيقي لجلب عدد الإشعارات
      // unreadNotificationsCount = getRealNotificationCount();
    };

    updateNotificationCount();

    // DEBUG: Show user ID to verify heartbeat prerequisite
    // if (user) {
    //   toast.info(`Debug: User ID = ${user.id} (${typeof user.id})`);
    // } else {
    //   toast.warning("Debug: No User Found in Context");
    // }
  }, [user]);

  // Heartbeat system: Update last active status every 1 minute
  useEffect(() => {
    if (!user?.id) return;

    // Initial heartbeat
    sendHeartbeat(user.id);

    const intervalId = setInterval(() => {
      sendHeartbeat(user.id);
    }, 60 * 1000); // 1 minute - balanced security & performance

    return () => clearInterval(intervalId);
  }, [user?.id]);

  // تعيين الأقسام المتاحة للموظف
  const getAccessibleSections = () => {
    if (!user) return [];

    // المدير لديه جميع الصلاحيات
    if (user.role === "admin") {
      // إضافة جميع الأقسام الرئيسية والفرعية للمدير
      const allSections = [
        "dashboard", "products", "categories", "payment-confirmation", "orders", "warehouse",
        "shipping", "delivery", "archive", "marketers", "commissions",
        "shipping-settings", "reports", "settings", "site-settings", "employees"
      ];
      return allSections;
    }

    // استخراج الأقسام المتاحة من الموظف
    let accessibleSections: string[] = [];

    if (user.accessibleSections) {
      accessibleSections = [...user.accessibleSections];
    } else if (user.permissions) {
      // استخراج الأقسام من الصلاحيات
      accessibleSections = user.permissions.map(permission => permission.section);
    }

    // إضافة لوحة التحكم دائمًا
    if (!accessibleSections.includes("dashboard")) {
      accessibleSections.push("dashboard");
    }

    return accessibleSections;
  };

  // الحصول على الأقسام المتاحة للموظف
  const accessibleSections = getAccessibleSections();

  // تعيين العناصر المتاحة في القائمة الجانبية
  const authorizedNavItems = mainNav.filter(item => {
    // المدير يرى جميع العناصر
    if (user.role === "admin") {
      return true;
    }

    // استخراج اسم القسم من الصلاحية
    const sectionMap: Record<string, string> = {
      "view_dashboard": "dashboard",
      "view_products": "products",
      "view_categories": "categories",
      "view_orders": "orders",
      "view_warehouse": "warehouse",
      "view_shipping": "shipping",
      "view_marketers": "marketers",
      "view_commissions": "commissions",
      "view_reports": "reports",
      "view_settings": "settings"
    };

    // الحصول على اسم القسم المقابل للصلاحية
    const section = sectionMap[item.permission] || item.permission.split("_")[1] || item.permission.split("_")[0];

    // تعيين الأقسام الفرعية التي تندرج تحت أقسام رئيسية
    const sectionMapping: Record<string, string> = {
      "shipping-settings": "shipping", // إعدادات الشحن تندرج تحت قسم الشحن
      "in-delivery": "shipping", // التوصيل يندرج تحت قسم الشحن
      "archive": "orders", // الأرشيف يندرج تحت قسم الطلبات

      "site-settings": "settings", // إعدادات الموقع تندرج تحت قسم الإعدادات
      "employees": "settings" // الموظفين تندرج تحت قسم الإعدادات
    };

    // الحصول على مسار العنصر بدون الشرطة الأمامية والبادئة
    const itemPath = item.href.replace(/^\/admin\//, ''); // مثال: "delivery" بدلاً من "/admin/delivery"

    // التحقق مما إذا كان العنصر هو قسم فرعي
    if (sectionMapping[itemPath]) {
      // إذا كان قسم فرعي، تحقق من وجوده بشكل صريح في الأقسام المتاحة
      return accessibleSections.includes(itemPath);
    }

    // التحقق من وجود القسم في الأقسام المتاحة للموظف
    return accessibleSections.includes(section);
  });

  return (
    <div className="min-h-screen flex bg-gray-50 relative">
      {/* Overlay للموبايل */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - متجاوب */}
      <div className={cn(
        "fixed left-0 top-0 h-screen bg-white border-r overflow-y-auto z-30 transition-transform duration-300 ease-in-out shadow-xl md:shadow-none",
        isMobile ? "w-60" : "w-48 sm:w-52 md:w-56 lg:w-60",
        isMobile && !sidebarOpen ? "-translate-x-full" : "translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between border-b border-gray-100 px-3 sm:px-4 py-3 sm:py-4 bg-gradient-to-l from-primary-50 to-white">
            <Link to="/admin/dashboard" className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary-600 shadow-md flex-shrink-0">
                <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-sm sm:text-base font-extrabold text-primary-700 font-cairo truncate tracking-wide leading-tight">
                  {siteSettings?.siteName || "نظام الأفلييت"}
                </span>
                <span className="block text-[10px] sm:text-xs text-gray-400 font-cairo truncate leading-tight">
                  لوحة التحكم
                </span>
              </div>
            </Link>
            {isMobile && (
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="h-8 w-8 flex-shrink-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Navigation Links */}
          <div className="flex-1 py-4 sm:py-6 px-1 sm:px-3">
            <div className="space-y-1 sm:space-y-2 px-1 sm:px-2">
              {authorizedNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center px-2 sm:px-3 py-2 sm:py-3 text-xs sm:text-sm md:text-base font-semibold rounded-lg transition-colors shadow-sm w-full",
                      isActive
                        ? "bg-primary-100 text-primary-700 border-r-4 border-primary-600"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-current flex-shrink-0" />
                      {item.href === "/admin/payment-confirmation" && sectionCounts?.payment_confirmation > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full ${sectionCounts.payment_confirmation > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {sectionCounts.payment_confirmation}
                        </span>
                      )}
                      {item.href === "/admin/orders" && sectionCounts?.orders > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full ${sectionCounts.orders > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {sectionCounts.orders}
                        </span>
                      )}
                      {item.href === "/admin/warehouse" && sectionCounts?.warehouse > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full ${sectionCounts.warehouse > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {sectionCounts.warehouse}
                        </span>
                      )}
                      {item.href === "/admin/shipping" && sectionCounts?.shipping > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full ${sectionCounts.shipping > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {sectionCounts.shipping}
                        </span>
                      )}
                      {item.href === "/admin/in-delivery" && (sectionCounts?.delivery || 0) + (sectionCounts?.collection || 0) > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-orange-500 text-white text-xs rounded-full ${(sectionCounts?.delivery || 0) + (sectionCounts?.collection || 0) > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {(sectionCounts?.delivery || 0) + (sectionCounts?.collection || 0)}
                        </span>
                      )}
                      {item.href === "/admin/archive" && sectionCounts?.archive > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-gray-500 text-white text-xs rounded-full ${sectionCounts.archive > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {sectionCounts.archive}
                        </span>
                      )}
                      {item.href === "/admin/marketers" && totalMarketersCount > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] rounded-full ${totalMarketersCount > 99 ? 'h-4 w-auto px-1' : 'h-4 w-4'} flex items-center justify-center shadow-sm border border-white font-bold`}>
                          {totalMarketersCount}
                        </span>
                      )}
                      {item.href === "/admin/commissions" && pendingWithdrawalsCount > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full ${pendingWithdrawalsCount > 99 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {pendingWithdrawalsCount}
                        </span>
                      )}
                      {item.href === "/admin/notifications" && unreadNotificationsCount > 0 && (
                        <span className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full ${unreadNotificationsCount > 9 ? 'h-5 w-auto px-1' : 'h-5 w-5'} flex items-center justify-center shadow-sm`}>
                          {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                        </span>
                      )}
                    </div>
                    <span className="font-cairo mr-2 sm:mr-3 text-xs sm:text-sm md:text-base font-semibold truncate flex-1">{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Profile */}
          <div className="p-2 sm:p-3 md:p-5 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0 flex-1">
                <Avatar className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 ml-1 sm:ml-2 flex-shrink-0">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="text-xs sm:text-sm md:text-lg">{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="mr-2 sm:mr-3 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm md:text-base font-medium font-cairo truncate">{user?.name}</p>
                  <p className="text-xs sm:text-xs md:text-sm text-gray-500 truncate">{user?.role}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title="تسجيل الخروج"
                className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10 flex-shrink-0"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content - متجاوب */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden transition-all duration-300 ease-in-out",
        isMobile ? "ml-0" : "ml-48 sm:ml-52 md:ml-56 lg:ml-60"
      )} dir="ltr">
        {/* Top header */}
        <header className="bg-white border-b py-2 sm:py-3 px-3 sm:px-4 md:px-6 lg:px-8 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden h-8 w-8"
              >
                <Menu className="h-5 w-5" />
              </Button>
            )}
            <h1 className="text-sm sm:text-lg md:text-xl font-bold font-cairo truncate max-w-[150px] sm:max-w-none">
              {authorizedNavItems.find(item => location.pathname.startsWith(item.href))?.title || "لوحة التحكم"}
            </h1>
          </div>
          <div className="flex items-center flex-shrink-0">
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-4 sm:py-6 md:px-6 md:py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

