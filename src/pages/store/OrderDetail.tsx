import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Phone, MapPin, Package, CheckCircle, XCircle, Clock } from "lucide-react";
import { useOrders } from "@/contexts/store/OrdersContext";
import { useToast } from "@/hooks/use-toast";

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, updateProductStatus } = useOrders();
  const { toast } = useToast();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">الطلب غير موجود</h2>
          <Button onClick={() => navigate("/orders")}>العودة للطلبات</Button>
        </div>
      </div>
    );
  }

  const handleProductStatusChange = (productId: string, status: "pending" | "delivered" | "cancelled") => {
    if (id) {
      updateProductStatus(id, productId, status);
      toast({
        title: "تم تحديث الحالة",
        description: "تم تحديث حالة القطعة بنجاح"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered": return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "cancelled": return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed": return "مكتمل";
      case "cancelled": return "ملغي";
      case "partial": return "جزئي"; // إضافة حالة "جزئي"
      default: return "قيد الانتظار";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-500/10 text-green-600 dark:text-green-400";
      case "cancelled": return "bg-red-500/10 text-red-600 dark:text-red-400";
      case "partial": return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default: return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    }
  };

  // حساب العمولة المستحقة بناءً على القطع المستلمة
  const earnedCommission = order.cartItems
    .filter(item => item.status === "delivered")
    .reduce((sum, item) => sum + Number(item.commission || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/orders")}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع للطلبات
        </Button>

        <div className="space-y-6">
          {/* Order Header */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-bold">{order.product}</h1>
                  <p className="text-muted-foreground">رقم الطلب: {order.id}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                  <span className="font-bold text-primary text-xl">{earnedCommission} جنيه</span>
                  <span className="text-muted-foreground">العمولة المستحقة</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-primary" />
                  <span>{order.customerName} - {order.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>{order.province} - {order.city}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                تفاصيل المنتجات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.cartItems.map((item) => (
                <div key={item.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    {item.color && <p className="text-sm text-muted-foreground">اللون: {item.color}</p>}
                    {item.size && <p className="text-sm text-muted-foreground">المقاس: {item.size}</p>}
                    <p className="font-medium mt-1">{Math.floor(Number(item.price))} جنيه</p>
                    <p className="text-sm text-muted-foreground">الكمية: {item.quantity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="mr-1">{getStatusText(item.status)}</span>
                      </span>
                      <span className="text-sm font-medium text-primary">
                        العمولة: {Math.floor(Number(item.commission))} جنيه
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={item.status}
                      onValueChange={(value: "pending" | "delivered" | "cancelled") =>
                        handleProductStatusChange(item.id, value)
                      }
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">قيد الانتظار</SelectItem>
                        <SelectItem value="delivered">تم التسليم</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="gradient-card border-border/50">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي سعر المنتجات:</span>
                  <span className="font-medium">{Math.floor(Number(order.price || 0))} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الشحن:</span>
                  <span className="font-medium">{Math.floor(Number(order.shippingFee || 0))} جنيه</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي سعر البيع:</span>
                  <span className="font-medium">{Math.floor(Number(order.price || 0) + Number(order.shippingFee || 0))} جنيه</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="text-muted-foreground">إجمالي العمولة الممكن الحصول عليها:</span>
                  <span className="font-medium">{Math.floor(Number(order.commission || 0))} جنيه</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold">العمولة المستحقة فعليًا:</span>
                  <span className="font-bold text-primary text-lg">{Math.floor(Number(earnedCommission || 0))} جنيه</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
