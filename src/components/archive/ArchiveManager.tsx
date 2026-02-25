import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Download, Trash, Loader2, Shield } from "lucide-react";
import { toast } from "sonner";
import ArchivePasswordDialog from "./ArchivePasswordDialog";
import { getOrders, saveOrders } from "@/services/orderService";
import { Order } from "@/pages/Orders";

const ArchiveManager = () => {
  // حالة التحقق من كلمة المرور (Bypassed)
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // حالة إدارة الأرشيف - Date Range
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const [fromDate, setFromDate] = useState<string>(firstDayOfMonth.toISOString().split('T')[0]);
  const [toDate, setToDate] = useState<string>(today.toISOString().split('T')[0]);
  const [showAll, setShowAll] = useState<boolean>(false); // Show all archive orders
  const [ordersCount, setOrdersCount] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // حساب عدد الفواتير في الفترة المحددة
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchOrdersCount = async () => {
      try {
        const orders = await getOrders();

        if (!Array.isArray(orders)) {
          console.error("getOrders did not return an array:", orders);
          setOrdersCount(0);
          return;
        }

        const count = orders.filter((order) => {
          // Archive section filter
          const isArchiveSection = order.section === "archive";
          if (!isArchiveSection) return false;

          // If "Show All" is checked, include all archive orders
          if (showAll) return true;

          // Handle date parsing robustly
          const dateString = order.date || order.createdAt || "";
          const orderDate = new Date(dateString);

          if (isNaN(orderDate.getTime())) {
            return false; // Skip orders with invalid dates when filtering by date
          }

          const from = new Date(fromDate);
          const to = new Date(toDate);
          to.setHours(23, 59, 59, 999); // Include entire end date

          const isInRange = orderDate >= from && orderDate <= to;

          return isInRange;
        }).length;

        setOrdersCount(count);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setOrdersCount(0);
      }
    };

    fetchOrdersCount();
  }, [fromDate, toDate, showAll, isAuthenticated]);

  // تصدير الفواتير كملف
  const handleExport = async () => {
    setIsExporting(true);
    try {
      const orders = await getOrders();

      const targetOrders = orders.filter((order) => {
        const isArchiveSection = order.section === "archive";
        if (!isArchiveSection) return false;

        // If showing all, include all archive orders
        if (showAll) return true;

        const dateString = order.date || order.createdAt || "";
        const orderDate = new Date(dateString);
        if (isNaN(orderDate.getTime())) return false;

        const from = new Date(fromDate);
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);

        return orderDate >= from && orderDate <= to;
      });

      if (targetOrders.length === 0) {
        toast.error("لا توجد فواتير لتصديرها في هذه الفترة");
        return;
      }

      // Create JSON blob
      const dataStr = JSON.stringify(targetOrders, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `archive_orders_${fromDate}_to_${toDate}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for UX
      toast.success(`تم تصدير ${targetOrders.length} فاتورة بنجاح`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("حدث خطأ أثناء تصدير الفواتير");
    } finally {
      setIsExporting(false);
    }
  };

  // حذف الفواتير
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const orders = await getOrders();

      const from = new Date(fromDate);
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);

      // 1. Identify orders to delete
      const ordersToDelete = orders.filter((order) => {
        const isArchiveSection = order.section === "archive";
        if (!isArchiveSection) return false; // Only delete archive orders

        // If showing all, delete ALL archive orders
        if (showAll) return true;

        const dateString = order.date || order.createdAt || "";
        const orderDate = new Date(dateString);

        // If invalid date, skip it
        if (isNaN(orderDate.getTime())) return false;

        const isMatch = (
          orderDate >= from &&
          orderDate <= to
        );

        return isMatch;
      });

      if (ordersToDelete.length === 0) {
        toast.info("لا توجد فواتير مطابقة للحذف في الأرشيف");
        setShowConfirmation(false);
        return;
      }

      // 2. Delete each order individually
      let deletedCount = 0;
      // We import deleteOrder at top, ensure it's imported
      const { deleteOrder } = await import("@/services/orderService");

      for (const order of ordersToDelete) {
        if (order.id) {
          await deleteOrder(order.id);
          deletedCount++;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500)); // UX delay

      toast.success(`تم حذف ${deletedCount} فاتورة من الأرشيف بنجاح`);

      setShowConfirmation(false);
      setOrdersCount(0); // Reset count logic will run in effect

      // Force refresh data
      window.dispatchEvent(new Event("storage-update"));
      // Also invalidate queries if using React Query elsewhere
      // queryClient.invalidateQueries({ queryKey: ["orders"] }); 

    } catch (error) {
      console.error("Delete error:", error);
      toast.error("حدث خطأ أثناء حذف الفواتير");
    } finally {
      setIsDeleting(false);
    }
  };

  // التعامل مع نجاح التحقق من كلمة المرور
  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setShowPasswordDialog(false);
  };

  // إذا لم يتم التحقق بعد، نعرض زر للوصول إلى قسم الأرشيف
  // Authentication check bypassed - Immediate access granted to Archive Management

  // بعد التحقق، نعرض واجهة إدارة الأرشيف
  return (
    <Card>
      <CardHeader>
        <CardTitle>إدارة أرشيف الفواتير</CardTitle>
        <CardDescription>
          يمكنك تصدير وحذف الفواتير القديمة <span className="text-red-500 font-bold">الموجودة في قسم الأرشيف فقط</span> للحفاظ على مساحة قاعدة البيانات.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fromDate">من تاريخ</Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="toDate">إلى تاريخ</Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Show All Checkbox */}
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              id="showAll"
              checked={showAll}
              onChange={(e) => setShowAll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="showAll" className="cursor-pointer">
              عرض جميع فواتير الأرشيف (بغض النظر عن التاريخ)
            </Label>
          </div>

          <div className="bg-muted p-4 rounded-md">
            <p className="text-center text-lg">
              عدد فواتير الأرشيف في هذه الفترة: <strong>{ordersCount}</strong>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || ordersCount === 0}
              className="w-full sm:w-auto"
            >
              {isExporting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="ml-2 h-4 w-4" />
              )}
              تصدير الفواتير
            </Button>

            <Button
              variant="destructive"
              onClick={() => setShowConfirmation(true)}
              disabled={isDeleting || ordersCount === 0}
              className="w-full sm:w-auto"
            >
              {isDeleting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash className="ml-2 h-4 w-4" />
              )}
              حذف الفواتير من الأرشيف
            </Button>
          </div>
        </div>
      </CardContent>

      {/* تأكيد الحذف */}
      <AlertDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد حذف الفواتير</AlertDialogTitle>
            <AlertDialogDescription>
              أنت على وشك حذف {ordersCount} فاتورة من الأرشيف للفترة من {new Date(fromDate).toLocaleDateString('ar-EG')} إلى {new Date(toDate).toLocaleDateString('ar-EG')}.
              <br />
              <span className="text-red-600 font-bold block mt-2">
                هذا الإجراء سيقوم بحذف البيانات نهائياً من الذاكرة لتوفير المساحة ولا يمكن التراجع عنه.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {isDeleting && (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              )}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ArchiveManager;

