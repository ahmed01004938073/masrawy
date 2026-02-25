import React, { useState } from "react";
import { User, Phone, Mail, FileText, ChevronDown, ChevronUp, Printer, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrderStatus } from "@/pages/Orders";
import { translateStatus, getStatusBadgeColor, translatePaymentMethod } from "./orderUtils";

// Define the Marketer interface
export interface Marketer {
  id: string;
  name: string;
  phone: string;
  email: string;
  joinDate: string;
  totalOrders: number;
  orderStats: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  orders: {
    id: string;
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    date: string;
    status: OrderStatus;
    total: number;
    items: {
      productName: string;
      quantity: number;
      price: number;
      total: number;
    }[];
    paymentMethod: string;
    shippingFee: number;
    discount?: number;
    commission: number;
  }[];
}

interface MarketerInformationProps {
  marketerId?: string;
  marketerName?: string;
}

const MarketerInformation: React.FC<MarketerInformationProps> = ({
  marketerId,
  marketerName,
}) => {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Marketer['orders'][0] | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Mock data for the marketer details
  const marketerDetails: Marketer = {
    id: marketerId || "m1",
    name: marketerName || "محمد علي",
    phone: "+20 123 456 7890",
    email: "mohamed.ali@example.com",
    joinDate: "2023-01-15",
    totalOrders: 45,
    orderStats: {
      pending: 5,
      confirmed: 8,
      processing: 10,
      shipped: 7,
      delivered: 12,
      cancelled: 3,
    },
    orders: [
      {
        id: "1",
        orderNumber: "ORD-001",
        customerName: "أحمد محمد",
        customerPhone: "+20 123 456 7890",
        customerAddress: "شارع النصر، القاهرة، مصر",
        date: "2023-04-10",
        status: "pending",
        total: 6000,
        paymentMethod: "cash",
        shippingFee: 50,
        commission: 300,
        items: [
          { productName: "هاتف ذكي", quantity: 1, price: 5000, total: 5000 },
          { productName: "سماعات لاسلكية", quantity: 2, price: 500, total: 1000 }
        ]
      },
      {
        id: "2",
        orderNumber: "ORD-002",
        customerName: "سارة أحمد",
        customerPhone: "+20 111 222 3333",
        customerAddress: "شارع الهرم، الجيزة، مصر",
        date: "2023-04-09",
        status: "confirmed",
        total: 2000,
        paymentMethod: "bank_transfer",
        shippingFee: 60,
        discount: 200,
        commission: 100,
        items: [
          { productName: "ساعة ذكية", quantity: 1, price: 2000, total: 2000 }
        ]
      },
      {
        id: "3",
        orderNumber: "ORD-003",
        customerName: "خالد عبد الله",
        customerPhone: "+20 100 200 3000",
        customerAddress: "شارع فيصل، الجيزة، مصر",
        date: "2023-04-08",
        status: "cancelled",
        total: 12300,
        paymentMethod: "card",
        shippingFee: 0,
        commission: 615,
        items: [
          { productName: "لابتوب", quantity: 1, price: 12000, total: 12000 },
          { productName: "ماوس", quantity: 1, price: 300, total: 300 }
        ]
      },
      {
        id: "4",
        orderNumber: "ORD-004",
        customerName: "هدى حسين",
        customerPhone: "+20 155 666 7777",
        customerAddress: "شارع التحرير، القاهرة، مصر",
        date: "2023-04-07",
        status: "processing",
        total: 2500,
        paymentMethod: "cash",
        shippingFee: 50,
        commission: 125,
        items: [
          { productName: "مكنسة كهربائية", quantity: 1, price: 2500, total: 2500 }
        ]
      },
      {
        id: "5",
        orderNumber: "ORD-005",
        customerName: "محمود سعيد",
        customerPhone: "+20 122 333 4444",
        customerAddress: "شارع المعز، القاهرة، مصر",
        date: "2023-04-06",
        status: "shipped",
        total: 8000,
        paymentMethod: "cash",
        shippingFee: 50,
        commission: 400,
        items: [
          { productName: "تلفزيون ذكي", quantity: 1, price: 8000, total: 8000 }
        ]
      },
    ],
  };

  // Filter orders based on active tab
  const filteredOrders = marketerDetails.orders.filter(order => {
    if (activeTab === "all") return true;
    return order.status === activeTab;
  });

  return (
    <Card className="border-2 mb-6">
      <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
        <CardTitle className="text-xl flex justify-between items-center">
          <div className="flex items-center">
            <User className="ml-3 h-5 w-5 text-primary-500" />
            <span className="font-cairo">المسوق</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xl font-bold ml-3">
              {marketerName ? marketerName.charAt(0) : "م"}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{marketerName || "غير محدد"}</h3>
              <p className="text-sm text-gray-500">معرف المسوق: {marketerId || "غير محدد"}</p>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() => setIsDetailsOpen(true)}
            disabled={!marketerId}
            className="text-base"
          >
            عرض تفاصيل المسوق
          </Button>
        </div>
      </CardContent>

      {/* Marketer Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cairo">تفاصيل المسوق</DialogTitle>
            <DialogDescription className="text-base">
              معلومات كاملة عن المسوق وإحصائيات الطلبات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Marketer Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold ml-4">
                  {marketerDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{marketerDetails.name}</h3>
                  <p className="text-gray-500">انضم في {new Date(marketerDetails.joinDate).toLocaleDateString("ar-EG")}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="ml-2 h-5 w-5 text-gray-500" />
                  <span>{marketerDetails.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="ml-2 h-5 w-5 text-gray-500" />
                  <span>{marketerDetails.email}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="ml-2 h-5 w-5 text-gray-500" />
                  <span>إجمالي الطلبات: {marketerDetails.totalOrders}</span>
                </div>
              </div>
            </div>

            {/* Order Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div
                className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer hover:bg-yellow-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("pending")}
              >
                <p className="text-yellow-800 text-sm font-cairo font-semibold mb-1">قيد الانتظار</p>
                <p className="text-3xl font-bold text-yellow-900">{marketerDetails.orderStats.pending}</p>
              </div>
              <div
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("confirmed")}
              >
                <p className="text-blue-800 text-sm font-cairo font-semibold mb-1">تم التأكيد</p>
                <p className="text-3xl font-bold text-blue-900">{marketerDetails.orderStats.confirmed}</p>
              </div>
              <div
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("processing")}
              >
                <p className="text-purple-800 text-sm font-cairo font-semibold mb-1">قيد التجهيز</p>
                <p className="text-3xl font-bold text-purple-900">{marketerDetails.orderStats.processing}</p>
              </div>
              <div
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("shipped")}
              >
                <p className="text-indigo-800 text-sm font-cairo font-semibold mb-1">تم الشحن</p>
                <p className="text-3xl font-bold text-indigo-900">{marketerDetails.orderStats.shipped}</p>
              </div>
              <div
                className="p-4 bg-green-50 border border-green-200 rounded-lg cursor-pointer hover:bg-green-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("delivered")}
              >
                <p className="text-green-800 text-sm font-cairo font-semibold mb-1">تم التسليم</p>
                <p className="text-3xl font-bold text-green-900">{marketerDetails.orderStats.delivered}</p>
              </div>
              <div
                className="p-4 bg-red-50 border border-red-200 rounded-lg cursor-pointer hover:bg-red-100 transition-colors shadow-sm flex flex-col items-center"
                onClick={() => setActiveTab("cancelled")}
              >
                <p className="text-red-800 text-sm font-cairo font-semibold mb-1">ملغي</p>
                <p className="text-3xl font-bold text-red-900">{marketerDetails.orderStats.cancelled}</p>
              </div>
            </div>

            {/* Orders Table */}
            <div className="border rounded-md overflow-hidden shadow-sm">
              <div className="bg-gray-50 p-4 flex justify-between items-center border-b">
                <h3 className="font-bold text-lg font-cairo">
                  {activeTab === "all" ? "جميع الطلبات" : `الطلبات ${translateStatus(activeTab as OrderStatus)}`}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("all")}
                  className="hover:bg-primary-50"
                >
                  عرض الكل
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow className="hover:bg-gray-50">
                      <TableHead className="text-center font-cairo font-bold text-primary-700">رقم الطلب</TableHead>
                      <TableHead className="text-center font-cairo font-bold text-primary-700">اسم العميل</TableHead>
                      <TableHead className="text-center font-cairo font-bold text-primary-700">التاريخ</TableHead>
                      <TableHead className="text-center font-cairo font-bold text-primary-700">المبلغ</TableHead>
                      <TableHead className="text-center font-cairo font-bold text-primary-700">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                          لا توجد طلبات في هذه الحالة
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsOrderDetailsOpen(true);
                          }}
                        >
                          <TableCell className="font-medium text-center">{order.orderNumber}</TableCell>
                          <TableCell className="text-center">{order.customerName}</TableCell>
                          <TableCell className="text-center">{order.date}</TableCell>
                          <TableCell className="text-center font-semibold">{order.total} ج.م</TableCell>
                          <TableCell className="text-center">
                            <Badge className={`${getStatusBadgeColor(order.status)} border-none px-3 py-1`}>
                              {translateStatus(order.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              إغلاق
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-cairo flex justify-between items-center">
              <span>تفاصيل الطلب #{selectedOrder?.orderNumber}</span>
              <Badge className={`${selectedOrder ? getStatusBadgeColor(selectedOrder.status) : ''} border-none text-base px-4 py-1.5`}>
                {selectedOrder ? translateStatus(selectedOrder.status) : ''}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              تاريخ الطلب: {selectedOrder?.date}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl">معلومات العميل</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">الاسم:</h3>
                      <p>{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">رقم الهاتف:</h3>
                      <p>{selectedOrder.customerPhone}</p>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <h3 className="font-semibold mb-1">العنوان:</h3>
                      <p>{selectedOrder.customerAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl">المنتجات</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="text-center font-cairo font-bold">المنتج</TableHead>
                        <TableHead className="text-center font-cairo font-bold">الكمية</TableHead>
                        <TableHead className="text-center font-cairo font-bold">السعر</TableHead>
                        <TableHead className="text-center font-cairo font-bold">الإجمالي</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="text-center">{item.productName}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-center">{item.price} ج.م</TableCell>
                          <TableCell className="text-center font-semibold">{item.total} ج.م</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex-col items-end border-t p-5 bg-gray-50 rounded-b-lg">
                  <div className="space-y-3 text-base w-full sm:w-72 md:w-80">
                    <div className="flex justify-between">
                      <span>إجمالي المنتجات:</span>
                      <span className="font-medium">{selectedOrder.items.reduce((sum, item) => sum + item.total, 0)} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تكلفة الشحن:</span>
                      <span className="font-medium">{selectedOrder.shippingFee} ج.م</span>
                    </div>
                    <div className="flex justify-between text-blue-600">
                      <span>العمولة:</span>
                      <span className="font-medium">{selectedOrder.commission} ج.م</span>
                    </div>
                    {selectedOrder.discount && selectedOrder.discount > 0 && (
                      <div className="flex justify-between">
                        <span>الخصم:</span>
                        <span className="text-red-500 font-medium">- {selectedOrder.discount} ج.م</span>
                      </div>
                    )}
                    <Separator className="my-3" />
                    <div className="flex justify-between font-bold text-xl py-4 px-5 bg-primary-100 rounded-lg border-2 border-primary-300 shadow-md">
                      <span className="font-cairo">إجمالي المنتج مع الشحن:</span>
                      <span className="text-primary-900">{selectedOrder.items.reduce((sum, item) => sum + item.total, 0) + selectedOrder.shippingFee} ج.م</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>

              {/* Payment Information */}
              <Card className="border-2">
                <CardHeader className="pb-3 bg-gray-50 rounded-t-lg">
                  <CardTitle className="text-xl">معلومات الدفع</CardTitle>
                </CardHeader>
                <CardContent className="p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-semibold mb-1">طريقة الدفع:</h3>
                      <p>{translatePaymentMethod(selectedOrder.paymentMethod)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter className="sm:justify-between gap-2 border-t pt-4">
            <Button variant="ghost" onClick={() => setIsOrderDetailsOpen(false)}>
              <X className="ml-2 h-5 w-5" />
              إغلاق
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Open print dialog
                window.print();
              }}
              className="text-base"
            >
              <Printer className="ml-2 h-5 w-5" />
              طباعة الفاتورة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MarketerInformation;
