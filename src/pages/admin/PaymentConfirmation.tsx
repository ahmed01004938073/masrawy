
import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getOrdersBySection, confirmPayment } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Eye, XCircle, Search, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const PaymentConfirmation = () => {
    const { formatPrice } = usePriceFormatter();
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [paidAmount, setPaidAmount] = useState("");
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    const { data: ordersResponse, isLoading } = useQuery({
        queryKey: ["orders", "payment_confirmation", searchQuery],
        queryFn: () => getOrdersBySection("payment_confirmation", 1, 100, searchQuery),
    });

    const orders = Array.isArray(ordersResponse) ? ordersResponse : (ordersResponse?.data || []);

    const confirmMutation = useMutation({
        mutationFn: ({ orderId, amount }: { orderId: string, amount: number }) => confirmPayment(orderId, amount),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["section-counts"] });
            toast.success("تم تأكيد الدفع ونقل الطلب للمخزن");
            setIsConfirmOpen(false);
            setSelectedOrder(null);
            setPaidAmount("");
        },
        onError: (error: any) => {
            toast.error("حدث خطأ أثناء التأكيد: " + error.message);
        }
    });

    const handleConfirmRequest = (order: any) => {
        setSelectedOrder(order);
        setPaidAmount(""); // Default is empty, admin writes what's in image
        setIsConfirmOpen(true);
    };

    const handleConfirmAction = () => {
        const amount = parseFloat(paidAmount);
        if (isNaN(amount) || amount < 0) {
            toast.error("يرجى إدخال مبلغ صحيح");
            return;
        }

        confirmMutation.mutate({ orderId: selectedOrder.id, amount });
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-amber-600">تأكيد الدفع (عربون)</h1>
                </div>

                <Card>
                    <CardContent className="pt-6">
                        <div className="relative">
                            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="بحث برقم الطلب أو اسم العميل..."
                                className="pr-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>طلبات بانتظار مراجعة الإيصال ({orders.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-8">جاري التحميل...</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">لا توجد طلبات معلقة حالياً</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center">رقم الطلب</TableHead>
                                        <TableHead className="text-center">العميل</TableHead>
                                        <TableHead className="text-center">إجمالي الفاتورة</TableHead>
                                        <TableHead className="text-center">المسوق</TableHead>
                                        <TableHead className="text-center">إيصال الدفع</TableHead>
                                        <TableHead className="text-center">إجراءات</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order: any) => (
                                        <TableRow key={order.id}>
                                            <TableCell className="text-center font-bold">{order.orderNumber}</TableCell>
                                            <TableCell className="text-center">{order.customerName}</TableCell>
                                            <TableCell className="text-center font-bold text-primary">
                                                {formatPrice(order.totalAmount)} ج.م
                                            </TableCell>
                                            <TableCell className="text-center">{order.marketerName}</TableCell>
                                            <TableCell className="text-center">
                                                {order.payment_screenshot ? (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-blue-500 hover:text-blue-700"
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setIsPreviewOpen(true);
                                                        }}
                                                    >
                                                        <Eye className="w-4 h-4 ml-1" /> عرض الصورة
                                                    </Button>
                                                ) : (
                                                    <span className="text-red-500 text-xs">لا يوجد إيصال</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    size="sm"
                                                    className="bg-green-600 hover:bg-green-700"
                                                    onClick={() => handleConfirmRequest(order)}
                                                >
                                                    <CheckCircle className="w-4 h-4 ml-1" /> تأكيد الدفع
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Confirm Dialog */}
            <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>تأكيد استلام المبلغ</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-3">
                            <DollarSign className="w-5 h-5 text-amber-600 mt-1" />
                            <div>
                                <p className="font-semibold text-amber-900">إجمالي الفاتورة: {selectedOrder && formatPrice(selectedOrder.totalAmount)} ج.م</p>
                                <p className="text-sm text-amber-700">أدخل المبلغ المكتوب في إيصال العميل ليتم خصمه من الإجمالي.</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">المبلغ المدفوع (العربون) *</label>
                            <Input
                                type="number"
                                placeholder="مثال: 50"
                                value={paidAmount}
                                onChange={(e) => setPaidAmount(e.target.value)}
                                className="text-lg font-bold text-green-600"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>إلغاء</Button>
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            disabled={confirmMutation.isPending}
                            onClick={handleConfirmAction}
                        >
                            {confirmMutation.isPending ? "جاري الحفظ..." : "تأكيد واستكمال الطلب"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Image Dialog */}
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>إيصال دفع الطلب #{selectedOrder?.orderNumber}</DialogTitle>
                    </DialogHeader>
                    <div className="p-2 border rounded bg-slate-50 flex justify-center">
                        {selectedOrder?.payment_screenshot ? (
                            <img src={selectedOrder.payment_screenshot} alt="Receipt" className="max-h-[70vh] object-contain" />
                        ) : (
                            <p>لا توجد صورة</p>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default PaymentConfirmation;
