import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CreditCard, Package, DollarSign, Truck, Edit, Calendar } from "lucide-react";
import { toast } from "sonner";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Payment,
  ReturnedProduct,
  getShippingCompanyById,
  getPaymentsByCompanyId,
  getReturnedProductsByCompanyId,
  addPayment,
  updateShippingCompany,
} from "@/services/collectionService";
import { ShippingCompany } from "@/types/shipping";

const ShippingCompanyDetailsPage = () => {
  const { formatPrice } = usePriceFormatter();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [company, setCompany] = useState<ShippingCompany | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [returnedProducts, setReturnedProducts] = useState<ReturnedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddPaymentDialogOpen, setIsAddPaymentDialogOpen] = useState(false);
  const [editedCompany, setEditedCompany] = useState<ShippingCompany | null>(null);
  const [newPaymentData, setNewPaymentData] = useState({
    amount: 0,
    paymentMethod: "تحويل بنكي",
    receiptNumber: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // تحميل البيانات
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // جلب بيانات شركة الشحن
        const companyData = await getShippingCompanyById(id || "");

        if (companyData) {
          setCompany(companyData);
          setEditedCompany(companyData);

          // جلب عمليات الدفع
          const companyPayments = await getPaymentsByCompanyId(companyData.id);
          setPayments(companyPayments);

          // جلب المنتجات المرتجعة
          const companyReturnedProducts = await getReturnedProductsByCompanyId(companyData.id);
          setReturnedProducts(companyReturnedProducts);
        } else {
          toast.error("لم يتم العثور على شركة الشحن");
          navigate("/archive");
        }
      } catch (error) {
        toast.error("حدث خطأ أثناء جلب البيانات");
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, navigate]);

  // العودة إلى صفحة الأرشيف
  const handleGoBack = () => {
    navigate("/archive");
  };

  // فتح نافذة تعديل بيانات الشركة
  const handleOpenEditDialog = () => {
    setEditedCompany(company);
    setIsEditDialogOpen(true);
  };

  // تغيير بيانات الشركة
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editedCompany) {
      setEditedCompany({
        ...editedCompany,
        [name]: value,
      });
    }
  };

  // حفظ بيانات الشركة
  const handleSaveCompany = async () => {
    if (!editedCompany) return;

    setIsSubmitting(true);
    try {
      // تحديث بيانات الشركة
      const updatedCompany = await updateShippingCompany(editedCompany.id, editedCompany);
      setCompany(updatedCompany);
      toast.success("تم تحديث بيانات الشركة بنجاح");
      setIsEditDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحديث بيانات الشركة");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // فتح نافذة إضافة دفعة جديدة
  const handleOpenAddPaymentDialog = () => {
    setNewPaymentData({
      amount: 0,
      paymentMethod: "تحويل بنكي",
      receiptNumber: "",
      notes: "",
    });
    setIsAddPaymentDialogOpen(true);
  };

  // تغيير بيانات الدفعة الجديدة
  const handleNewPaymentDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewPaymentData((prev) => ({
      ...prev,
      [name]: name === "amount" ? Number(value) : value,
    }));
  };

  // إضافة دفعة جديدة
  const handleAddPayment = async () => {
    if (!company) return;

    if (newPaymentData.amount <= 0) {
      toast.error("يجب أن يكون المبلغ أكبر من صفر");
      return;
    }

    setIsSubmitting(true);
    try {
      // إضافة دفعة جديدة
      const newPayment = await addPayment({
        companyId: company.id,
        amount: newPaymentData.amount,
        paymentMethod: newPaymentData.paymentMethod,
        receiptNumber: newPaymentData.receiptNumber || undefined,
        notes: newPaymentData.notes || undefined,
      });

      // تحديث قائمة المدفوعات
      setPayments((prev) => [newPayment, ...prev]);

      // تحديث بيانات الشركة
      const updatedCompany = await getShippingCompanyById(company.id);
      if (updatedCompany) {
        setCompany(updatedCompany);
      }

      toast.success("تم تسجيل الدفعة بنجاح");
      setIsAddPaymentDialogOpen(false);
    } catch (error) {
      toast.error("حدث خطأ أثناء تسجيل الدفعة");
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

  if (isLoading || !company) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-lg">جاري تحميل البيانات...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">
              تفاصيل شركة الشحن
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEditDialog}
              className="flex items-center gap-1"
            >
              <Edit className="h-4 w-4" />
              تعديل البيانات
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenAddPaymentDialog}
              className="flex items-center gap-1"
            >
              <DollarSign className="h-4 w-4" />
              تسجيل دفعة
            </Button>
          </div>
        </div>

        {/* بطاقة معلومات الشركة */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              معلومات الشركة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">
                  البيانات الأساسية
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">اسم الشركة:</span>
                    <span className="font-medium">{company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">رقم الهاتف:</span>
                    <span className="font-medium">{company.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">العنوان:</span>
                    <span className="font-medium">
                      {company.address || "غير متوفر"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الواتساب (للطلبات):</span>
                    <span className="font-medium text-green-600" dir="ltr">
                      {company.whatsapp || "مثل الهاتف"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الموقع:</span>
                    <span className="font-medium">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          زيارة الموقع
                        </a>
                      ) : "غير متوفر"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">تاريخ التسجيل:</span>
                    <span className="font-medium">
                      {formatDate(company.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-muted-foreground mb-2">
                  إحصائيات
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المستحقات المالية:</span>
                    <span className="font-medium text-red-600">
                      {formatPrice(company.balance)} EGP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطلبات المسلمة:</span>
                    <span className="font-medium text-green-600">
                      {company.deliveredOrders} طلب
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الطلبات المرفوضة:</span>
                    <span className="font-medium text-red-600">
                      {company.rejectedOrders} طلب
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">المنتجات المرتجعة:</span>
                    <span className="font-medium text-amber-600">
                      {company.returnedProducts} منتج
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* تبويبات المعلومات */}
        <Tabs defaultValue="payments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="payments">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                سجل المدفوعات
              </div>
            </TabsTrigger>
            <TabsTrigger value="returns">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                المنتجات المرتجعة
              </div>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>سجل المدفوعات</CardTitle>
                  <CardDescription>
                    سجل المدفوعات المستلمة من شركة {company.name}
                  </CardDescription>
                </div>
                <Button
                  onClick={handleOpenAddPaymentDialog}
                  className="flex items-center gap-1"
                >
                  <DollarSign className="h-4 w-4" />
                  تسجيل دفعة
                </Button>
              </CardHeader>
              <CardContent>
                {payments.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-center">المبلغ</TableHead>
                          <TableHead className="text-center">طريقة الدفع</TableHead>
                          <TableHead className="text-center">رقم الإيصال</TableHead>
                          <TableHead className="text-center">التاريخ</TableHead>
                          <TableHead className="text-center">ملاحظات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="font-medium text-center text-green-600">
                              {formatPrice(payment.amount)} EGP
                            </TableCell>
                            <TableCell className="text-center">{payment.paymentMethod}</TableCell>
                            <TableCell className="text-center">{payment.receiptNumber || "-"}</TableCell>
                            <TableCell className="text-center">{formatDate(payment.date)}</TableCell>
                            <TableCell className="text-center">{payment.notes || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <CreditCard className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
                    <p>لا توجد مدفوعات مسجلة حتى الآن</p>
                    <Button
                      onClick={handleOpenAddPaymentDialog}
                      variant="outline"
                      className="mt-4"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      تسجيل دفعة جديدة
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle>المنتجات المرتجعة</CardTitle>
                <CardDescription>
                  قائمة المنتجات المرتجعة من شركة {company.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {returnedProducts.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">رقم الطلب</TableHead>
                          <TableHead className="text-right">اسم المنتج</TableHead>
                          <TableHead className="text-center">الكمية</TableHead>
                          <TableHead className="text-center">سبب الإرجاع</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                          <TableHead className="text-center">التاريخ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {returnedProducts.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell className="font-medium text-right">{product.orderNumber}</TableCell>
                            <TableCell className="text-right">{product.productName}</TableCell>
                            <TableCell className="text-center">{product.quantity}</TableCell>
                            <TableCell className="text-center">{product.reason}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={
                                  product.status === "processed"
                                    ? "default"
                                    : product.status === "damaged"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className={
                                  product.status === "processed"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : product.status === "damaged"
                                      ? "bg-red-100 text-red-800 hover:bg-red-100"
                                      : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                }
                              >
                                {product.status === "processed"
                                  ? "تمت المعالجة"
                                  : product.status === "damaged"
                                    ? "تالف"
                                    : "قيد المعالجة"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center">{formatDate(product.date)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    <Package className="mx-auto h-10 w-10 mb-3 text-muted-foreground/60" />
                    <p>لا توجد منتجات مرتجعة حتى الآن</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* نافذة تعديل بيانات الشركة */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الشركة</DialogTitle>
              <DialogDescription>
                قم بتعديل بيانات شركة الشحن. اضغط على زر "حفظ التغييرات" عند الانتهاء.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">اسم الشركة</Label>
                <Input
                  id="name"
                  name="name"
                  value={editedCompany?.name || ""}
                  onChange={handleCompanyChange}
                  placeholder="أدخل اسم الشركة"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editedCompany?.phone || ""}
                  onChange={handleCompanyChange}
                  placeholder="أدخل رقم الهاتف"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">العنوان</Label>
                <Input
                  id="address"
                  name="address"
                  value={editedCompany?.address || ""}
                  onChange={handleCompanyChange}
                  placeholder="أدخل عنوان الشركة"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="whatsapp">رقم الواتساب (للطلبات)</Label>
                <Input
                  id="whatsapp"
                  name="whatsapp"
                  value={editedCompany?.whatsapp || ""}
                  onChange={handleCompanyChange}
                  placeholder="رقم الواتساب الخاص بالطلبات"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="website">موقع الشركة</Label>
                <Input
                  id="website"
                  name="website"
                  value={editedCompany?.website || ""}
                  onChange={handleCompanyChange}
                  placeholder="https://example.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  name="email"
                  value={editedCompany?.email || ""}
                  onChange={handleCompanyChange}
                  placeholder="info@company.com"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSaveCompany} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري الحفظ...
                  </>
                ) : (
                  "حفظ التغييرات"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة تسجيل دفعة جديدة */}
        <Dialog open={isAddPaymentDialogOpen} onOpenChange={setIsAddPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>تسجيل دفعة جديدة</DialogTitle>
              <DialogDescription>
                تسجيل دفعة مستلمة من شركة {company.name}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="amount">المبلغ</Label>
                <div className="flex items-center">
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    min="1"
                    value={newPaymentData.amount}
                    onChange={handleNewPaymentDataChange}
                    className="flex-1"
                  />
                  <span className="mr-2 text-lg">ج.م</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  المستحق الحالي: {formatPrice(company.balance)} ج.م
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="paymentMethod">طريقة الدفع</Label>
                <select
                  id="paymentMethod"
                  name="paymentMethod"
                  value={newPaymentData.paymentMethod}
                  onChange={handleNewPaymentDataChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="تحويل بنكي">تحويل بنكي</option>
                  <option value="نقدي">نقدي</option>
                  <option value="شيك">شيك</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="receiptNumber">رقم الإيصال (اختياري)</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  value={newPaymentData.receiptNumber}
                  onChange={handleNewPaymentDataChange}
                  placeholder="أدخل رقم الإيصال"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                <Input
                  id="notes"
                  name="notes"
                  value={newPaymentData.notes}
                  onChange={handleNewPaymentDataChange}
                  placeholder="أدخل ملاحظات إضافية"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddPaymentDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAddPayment} disabled={newPaymentData.amount <= 0 || isSubmitting}>
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    جاري التسجيل...
                  </>
                ) : (
                  "تسجيل الدفعة"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ShippingCompanyDetailsPage;
