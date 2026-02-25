import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Search, Plus, UserPlus, DollarSign, Eye, Edit, Trash, Users, User, ShoppingBag, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { fixMarketerImages } from "@/services/imageFixService";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { getMarketers, addMarketer, deleteMarketer, updateMarketer, fixCommissionsBasedOnOrderStatus, Marketer } from "@/services/marketerService";

// بيانات تجريبية للمسوقين
const mockMarketers: Marketer[] = [
  {
    id: "m1",
    name: "محمد علي",
    phone: "01XXXXXXXXX",
    email: "mohamed@example.com",
    status: "active",
    totalCommission: 5200,
    pendingCommission: 1200,
    withdrawnCommission: 4000,
    ordersCount: 42,
    createdAt: "2023-01-15T10:30:00Z",
  },
  {
    id: "m2",
    name: "فاطمة حسن",
    phone: "01XXXXXXXXX",
    email: "fatma@example.com",
    status: "active",
    totalCommission: 3800,
    pendingCommission: 800,
    withdrawnCommission: 3000,
    ordersCount: 31,
    createdAt: "2023-02-20T14:45:00Z",
  },
  {
    id: "m3",
    name: "أحمد محمود",
    phone: "01212345678",
    email: "ahmed@example.com",
    status: "inactive",
    totalCommission: 1500,
    pendingCommission: 0,
    withdrawnCommission: 1500,
    ordersCount: 12,
    createdAt: "2023-03-10T09:15:00Z",
  },
  {
    id: "m4",
    name: "سارة خالد",
    phone: "01512345678",
    email: "sara@example.com",
    status: "active",
    totalCommission: 7200,
    pendingCommission: 2200,
    withdrawnCommission: 5000,
    ordersCount: 58,
    createdAt: "2023-01-05T11:20:00Z",
  },
  {
    id: "m5",
    name: "خالد عبد الله",
    phone: "01612345678",
    email: "khaled@example.com",
    status: "active",
    totalCommission: 4300,
    pendingCommission: 1300,
    withdrawnCommission: 3000,
    ordersCount: 35,
    createdAt: "2023-02-12T16:30:00Z",
  },
];

// نموذج بيانات المسوق الجديد
interface NewMarketerData {
  name: string;
  phone: string;
  email: string;
}

const MarketersPage = () => {
  const { formatPrice } = usePriceFormatter();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const marketersPerPage = 10;

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const { data: marketersResponse, isLoading: isDataLoading } = useQuery({
    queryKey: ["marketers", currentPage, searchTerm],
    queryFn: async () => {
      return await getMarketers(currentPage, marketersPerPage, searchTerm);
    },
    refetchInterval: 10000,
  });

  const marketers = Array.isArray(marketersResponse) ? marketersResponse : (marketersResponse?.data || []);
  const totalItems = Array.isArray(marketersResponse) ? marketersResponse.length : (marketersResponse?.total || 0);
  const totalPages = Array.isArray(marketersResponse) ? Math.ceil(marketersResponse.length / marketersPerPage) : (marketersResponse?.totalPages || 1);



  const paginatedMarketers = marketers;
  const filteredMarketers = marketers; // Fallback for UI counts

  // State for Dialogs and Forms
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMarketer, setSelectedMarketer] = useState<Marketer | null>(null);
  const [newMarketerData, setNewMarketerData] = useState<NewMarketerData>({
    name: "",
    phone: "",
    email: "",
  });

  // فتح صفحة تفاصيل المسوق
  const handleViewMarketerDetails = (marketerId: string) => {
    navigate(`/admin/marketers/${marketerId}`);
  };

  // فتح نافذة إضافة مسوق جديد
  const handleOpenAddDialog = () => {
    setNewMarketerData({
      name: "",
      phone: "",
      email: "",
    });
    setIsAddDialogOpen(true);
  };

  // تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // تغيير بيانات المسوق الجديد
  const handleNewMarketerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewMarketerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // إضافة مسوق جديد
  const handleAddMarketer = async () => {
    try {
      if (!newMarketerData.name.trim()) {
        toast.error("يرجى إدخال اسم المسوق");
        return;
      }
      if (!newMarketerData.phone.trim()) {
        toast.error("يرجى إدخال رقم هاتف المسوق");
        return;
      }

      setIsSubmitting(true);

      const added = await addMarketer({
        name: newMarketerData.name,
        phone: newMarketerData.phone,
        email: newMarketerData.email,
        status: "active"
      });

      // Update state with new marketer
      await queryClient.invalidateQueries({ queryKey: ["marketers"] });

      toast.success("تم إضافة المسوق بنجاح");
      setIsAddDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء إضافة المسوق");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح نافذة حذف مسوق
  const handleOpenDeleteDialog = (marketer: Marketer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMarketer(marketer);
    setIsDeleteDialogOpen(true);
  };

  // حذف مسوق
  const handleDeleteMarketer = async () => {
    if (!selectedMarketer) return;

    setIsSubmitting(true);

    try {
      await deleteMarketer(selectedMarketer.id);

      await queryClient.invalidateQueries({ queryKey: ["marketers"] });

      toast.success("تم حذف المسوق بنجاح");
      setIsDeleteDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء حذف المسوق");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // تغيير حالة المسوق (نشط/غير نشط)
  const handleToggleMarketerStatus = async (marketer: Marketer, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const newStatus = marketer.status === "active" ? "inactive" : "active";
      const updated = await updateMarketer({
        ...marketer,
        status: newStatus
      });

      await queryClient.invalidateQueries({ queryKey: ["marketers"] });

      toast.success(
        `تم ${marketer.status === "active" ? "تعطيل" : "تنشيط"} المسوق بنجاح`
      );
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث حالة المسوق");
      console.error(error);
    }
  };



  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">المسوقين</h1>
            <p className="text-muted-foreground">
              إدارة المسوقين والعمولات
            </p>
          </div>
          <Button onClick={handleOpenAddDialog}>
            <UserPlus className="ml-2 h-4 w-4" />
            إضافة مسوق جديد
          </Button>
        </div>

        {/* إحصائيات المسوقين */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100 flex items-center">
                <Users className="mr-2 h-4 w-4" />
                إجمالي المسوقين
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalItems}</div>
              <p className="text-xs text-indigo-200 mt-1 flex items-center">
                <User className="mr-1 h-3 w-3" />
                {totalItems} مسوق إجمالي
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900 to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                إجمالي العمولات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatPrice(marketers.reduce((sum, m) => sum + m.totalCommission, 0))} ج.م
              </div>
              <p className="text-xs text-emerald-200 mt-1 flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                {formatPrice(marketers.reduce((sum, m) => sum + m.pendingCommission, 0))} ج.م عمولات معلقة
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900 to-purple-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-100 flex items-center">
                <ShoppingBag className="mr-2 h-4 w-4" />
                إجمالي الطلبات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {marketers.reduce((sum, m) => sum + m.ordersCount, 0)}
              </div>
              <p className="text-xs text-purple-200 mt-1 flex items-center">
                <User className="mr-1 h-3 w-3" />
                من خلال {marketers.length} مسوق
              </p>
            </CardContent>
          </Card>
        </div>

        {/* بحث وفلترة */}
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center">
            {searchTerm.trim() && (
              <div className="text-sm text-muted-foreground">
                نتائج البحث: <span className="font-medium text-primary">{filteredMarketers.length}</span> مسوق
                {filteredMarketers.length > 0 && searchTerm.trim() && (
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
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث عن مسوق..."
              className="pl-10 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* جدول المسوقين */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة المسوقين</CardTitle>
            <CardDescription>
              {filteredMarketers.length} مسوق
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px] text-right">اسم المسوق</TableHead>
                    <TableHead className="text-right">معرف المسوق</TableHead>
                    <TableHead className="text-right">رقم الهاتف</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">الرصيد المتاح للسحب</TableHead>
                    <TableHead className="text-center">إجمالي العمولات</TableHead>
                    <TableHead className="text-center">عدد الطلبات</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMarketers.map((marketer) => (
                    <TableRow
                      key={marketer.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleViewMarketerDetails(marketer.id)}
                    >
                      <TableCell className="font-medium text-right">{marketer.name}</TableCell>
                      <TableCell className="text-right font-mono text-xs">{marketer.id}</TableCell>
                      <TableCell className="text-right">{marketer.phone}</TableCell>
                      <TableCell className="text-right">{marketer.email}</TableCell>
                      <TableCell className="text-center">
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
                      </TableCell>
                      <TableCell className="font-medium text-amber-600 text-center">
                        {formatPrice(marketer.pendingCommission)} ج.م
                      </TableCell>
                      <TableCell className="font-medium text-green-600 text-center">
                        {formatPrice(marketer.totalCommission)} ج.م
                      </TableCell>
                      <TableCell className="text-center">{marketer.ordersCount}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewMarketerDetails(marketer.id)}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleToggleMarketerStatus(marketer, e)}
                            title={marketer.status === "active" ? "تعطيل" : "تنشيط"}
                          >
                            <Badge
                              variant="outline"
                              className={
                                marketer.status === "active"
                                  ? "border-red-200 text-red-700"
                                  : "border-green-200 text-green-700"
                              }
                            >
                              {marketer.status === "active" ? "تعطيل" : "تنشيط"}
                            </Badge>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => handleOpenDeleteDialog(marketer, e)}
                            title="حذف"
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* نظام الصفحات */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""}
                      />
                    </PaginationItem>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={page === currentPage}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* نافذة إضافة مسوق جديد */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>إضافة مسوق جديد</DialogTitle>
            <DialogDescription>
              أدخل بيانات المسوق الجديد. اضغط على زر "إضافة" عند الانتهاء.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم المسوق</Label>
              <Input
                id="name"
                name="name"
                value={newMarketerData.name}
                onChange={handleNewMarketerChange}
                placeholder="أدخل اسم المسوق"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input
                id="phone"
                name="phone"
                value={newMarketerData.phone}
                onChange={handleNewMarketerChange}
                placeholder="أدخل رقم الهاتف"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={newMarketerData.email}
                onChange={handleNewMarketerChange}
                placeholder="أدخل البريد الإلكتروني"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleAddMarketer} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  جاري الإضافة...
                </>
              ) : (
                <>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* نافذة حذف مسوق */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>حذف مسوق</DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف المسوق "{selectedMarketer?.name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMarketer}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  جاري الحذف...
                </>
              ) : (
                "تأكيد الحذف"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default MarketersPage;
