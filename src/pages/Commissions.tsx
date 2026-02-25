import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Search, Check, X, DollarSign, User, Clock, Calendar, Filter } from "lucide-react";
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
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  WithdrawalRequest,
  getWithdrawalRequests,
  updateWithdrawalRequestStatus,
  getWithdrawalStats,
  initializeWithdrawalData
} from "@/services/withdrawalService";

// نموذج بيانات معالجة طلب السحب
interface ProcessWithdrawalData {
  status: "approved" | "rejected";
  notes: string;
}

const CommissionsPage = () => {
  const { formatPrice } = usePriceFormatter();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  /* Removed redundant state that is now handled by useQuery */
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    pendingAmount: 0,
    approvedAmount: 0,
    rejectedAmount: 0,
    uniqueMarketers: 0,
  });
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processData, setProcessData] = useState<ProcessWithdrawalData>({
    status: "approved",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // عدد الطلبات في الصفحة الواحدة
  const requestsPerPage = 10;

  // تغيير الصفحة
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  // فتح نافذة معالجة طلب السحب
  const handleOpenProcessDialog = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setProcessData({
      status: "approved",
      notes: "",
    });
    setIsProcessDialogOpen(true);
  };

  // تغيير بيانات معالجة الطلب
  const handleProcessDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProcessData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // تغيير حالة معالجة الطلب
  const handleStatusChange = (status: "approved" | "rejected") => {
    setProcessData((prev) => ({
      ...prev,
      status,
    }));
  };



  // تحميل البيانات
  // تحميل البيانات
  const { data: requestsResponse, isLoading: isDataLoading, refetch } = useQuery({
    queryKey: ["withdrawalRequests", currentPage, activeTab, searchTerm],
    queryFn: async () => {
      // Note: Backend getWithdrawals current version doesn't support status/search filters directly in sql yet, 
      // but we send them anyway to be future proof. For now, it will paginate.
      return await getWithdrawalRequests(currentPage, requestsPerPage, activeTab, searchTerm);
    },
    refetchInterval: 10000,
  });

  const { data: statsResponse } = useQuery({
    queryKey: ["withdrawalStats"],
    queryFn: getWithdrawalStats,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (statsResponse) setStats(statsResponse);
  }, [statsResponse]);

  const withdrawalRequests = Array.isArray(requestsResponse) ? requestsResponse : (requestsResponse?.data || []);
  const totalPages = Array.isArray(requestsResponse) ? Math.ceil(requestsResponse.length / requestsPerPage) : (requestsResponse?.totalPages || 1);
  const totalItems = Array.isArray(requestsResponse) ? requestsResponse.length : (requestsResponse?.total || 0);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm]);

  // Use the data from the query instead of state
  const paginatedRequests = withdrawalRequests;
  const filteredRequests = withdrawalRequests; // Already filtered by server (or will be soon)

  const fetchData = refetch;

  // معالجة طلب السحب
  const handleProcessWithdrawal = async () => {
    if (!selectedRequest) return;

    setIsSubmitting(true);

    try {
      // تحديث حالة الطلب
      const updatedRequest = await updateWithdrawalRequestStatus(
        selectedRequest.id,
        processData.status,
        processData.notes || undefined
      );

      if (updatedRequest) {
        // تحديث قائمة الطلبات
        /* Updated locally via query refetch */

        // تحديث الإحصائيات
        const withdrawalStats = await getWithdrawalStats();
        setStats(withdrawalStats);

        // عرض رسالة نجاح
        toast.success(
          `تم ${processData.status === "approved" ? "قبول" : "رفض"} طلب السحب بنجاح`
        );
      }

      setIsProcessDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء معالجة طلب السحب");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">العمولات وطلبات السحب</h1>
            <p className="text-muted-foreground">
              إدارة طلبات سحب الأرباح الخاصة بالمسوقين
            </p>
          </div>
        </div>

        {/* إحصائيات طلبات السحب */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-gradient-to-br from-indigo-900 to-indigo-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100 flex items-center">
                <DollarSign className="mr-2 h-4 w-4" />
                إجمالي طلبات السحب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-xs text-indigo-200 mt-1 flex items-center">
                <User className="mr-1 h-3 w-3" />
                من {stats.uniqueMarketers} مسوق
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-900 to-emerald-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-emerald-100 flex items-center">
                <Check className="mr-2 h-4 w-4" />
                الطلبات المقبولة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.approved}
              </div>
              <p className="text-xs text-emerald-200 mt-1 flex items-center">
                <DollarSign className="mr-1 h-3 w-3" />
                {formatPrice(stats.approvedAmount)} ج.م
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-900 to-amber-700 text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-amber-100 flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                طلبات قيد الانتظار
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats.pending}
              </div>
              <p className="text-xs text-amber-200 mt-1 flex items-center">
                <DollarSign className="mr-1 h-3 w-3" />
                {formatPrice(stats.pendingAmount)} ج.م
              </p>
            </CardContent>
          </Card>
        </div>

        {/* تبويبات وبحث */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Tabs
            defaultValue="all"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full md:w-auto"
          >
            <TabsList className="grid grid-cols-4 w-full md:w-[450px]">
              <TabsTrigger value="all">جميع الطلبات</TabsTrigger>
              <TabsTrigger value="pending">قيد الانتظار</TabsTrigger>
              <TabsTrigger value="approved">تمت الموافقة</TabsTrigger>
              <TabsTrigger value="cancelled">ملغى</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث عن طلب سحب..."
              className="pl-10 h-9 rounded-full bg-gray-50 border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* جدول طلبات السحب */}
        <Card>
          <CardHeader>
            <CardTitle>طلبات سحب الأرباح</CardTitle>
            <CardDescription>
              {filteredRequests.length} طلب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الطلب</TableHead>
                    <TableHead className="text-right">اسم المسوق</TableHead>
                    <TableHead className="text-center">المبلغ</TableHead>
                    <TableHead className="text-center">طريقة الدفع</TableHead>
                    <TableHead className="text-center">تاريخ الطلب</TableHead>
                    <TableHead className="text-center">الحالة</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium text-right">{request.id}</TableCell>
                      <TableCell className="text-right">{request.marketerName}</TableCell>
                      <TableCell className="font-medium text-center">{formatPrice(request.amount)} ج.م</TableCell>
                      <TableCell className="text-center">{request.paymentMethod}</TableCell>
                      <TableCell className="text-center">{formatDate(request.requestDate)}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            request.status === "approved"
                              ? "default"
                              : request.status === "rejected"
                                ? "destructive"
                                : request.status === "cancelled"
                                  ? "outline"
                                  : "secondary"
                          }
                          className={
                            request.status === "approved"
                              ? "bg-green-100 text-green-800 hover:bg-green-100"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : request.status === "cancelled"
                                  ? "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                  : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          }
                        >
                          {request.status === "approved"
                            ? "تمت الموافقة"
                            : request.status === "rejected"
                              ? "مرفوض"
                              : request.status === "cancelled"
                                ? "ملغى"
                                : "قيد الانتظار"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {request.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenProcessDialog(request)}
                              className="h-8"
                            >
                              معالجة الطلب
                            </Button>
                          )}
                          {request.status !== "pending" && (
                            <Badge
                              variant="outline"
                              className="border-gray-200 text-gray-700"
                            >
                              تمت المعالجة
                            </Badge>
                          )}
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

      {/* نافذة معالجة طلب السحب */}
      <Dialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>معالجة طلب السحب</DialogTitle>
            <DialogDescription>
              مراجعة وتحديث حالة طلب السحب المقدم من {selectedRequest?.marketerName}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>رقم الطلب</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">{selectedRequest?.id}</div>
              </div>
              <div className="space-y-2">
                <Label>المبلغ</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700 font-bold">{formatPrice(selectedRequest?.amount)} ج.م</div>
              </div>
              <div className="space-y-2">
                <Label>طريقة الدفع</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">{selectedRequest?.paymentMethod}</div>
              </div>
              <div className="space-y-2">
                <Label>تفاصيل الحساب</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">{selectedRequest?.accountDetails}</div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label>تاريخ الطلب</Label>
                <div className="p-2 bg-gray-50 rounded-md text-gray-700">
                  {selectedRequest && formatDate(selectedRequest.requestDate)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>حالة الطلب</Label>
              <div className="flex gap-4">
                <div
                  className={`flex-1 p-3 rounded-md border cursor-pointer flex items-center justify-center gap-2 ${processData.status === "approved"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => handleStatusChange("approved")}
                >
                  <Check className="h-5 w-5" />
                  <span>قبول الطلب</span>
                </div>
                <div
                  className={`flex-1 p-3 rounded-md border cursor-pointer flex items-center justify-center gap-2 ${processData.status === "rejected"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => handleStatusChange("rejected")}
                >
                  <X className="h-5 w-5" />
                  <span>رفض الطلب</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات (اختياري)</Label>
              <Input
                id="notes"
                name="notes"
                value={processData.notes}
                onChange={handleProcessDataChange}
                placeholder="أدخل ملاحظات حول معالجة الطلب"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProcessDialogOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleProcessWithdrawal}
              disabled={isSubmitting}
              variant={processData.status === "approved" ? "default" : "destructive"}
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  جاري المعالجة...
                </>
              ) : (
                processData.status === "approved" ? "تأكيد قبول الطلب" : "تأكيد رفض الطلب"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout >
  );
};

export default CommissionsPage;
