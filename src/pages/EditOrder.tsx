import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ArrowRight, Save, Plus, Trash, AlertTriangle, ZoomIn, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductSearch from "@/components/products/ProductSearch";
import { Order, OrderStatus, OrderItem, OrderSection } from "./Orders";
import { getOrderById, updateOrder, invalidateAllOrderQueries } from "@/services/orderService";
import { getShippingCompanies, getShippingAreas } from "@/services/collectionService";
import { ShippingCompany } from "@/types/shipping";
import ImageModal from "@/components/ui/image-modal";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import OrderSummary from "@/components/orders/OrderSummary";
import { getSiteSettings } from "@/services/siteSettingsService";
import { getProducts, Product } from "@/services/productService";

// ترجمة حالة الطلب إلى العربية
const translateStatus = (status: OrderStatus): string => {
  const statusMap: Record<OrderStatus, string> = {
    pending: "قيد الانتظار",
    confirmed: "تم التأكيد",
    processing: "قيد التجهيز",
    shipped: "تم الشحن",
    delivered: "تم التسليم",
    cancelled: "ملغي",
    suspended: "معلق",
    in_delivery: "جاري التوصيل",
    partially_delivered: "تسليم جزئي",
    delivery_rejected: "رفض الاستلام",
    returned: "مرتجع"
  };
  return statusMap[status] || status;
};

// ترجمة طريقة الدفع إلى العربية
const translatePaymentMethod = (method: string): string => {
  const methodMap: Record<string, string> = {
    cash: "الدفع عند الاستلام",
    card: "بطاقة ائتمان",
    bank_transfer: "تحويل بنكي"
  };
  return methodMap[method] || method;
};

// ترجمة حالة الدفع إلى العربية
const translatePaymentStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    paid: "مدفوع",
    unpaid: "غير مدفوع"
  };
  return statusMap[status] || status;
};

// لون حالة الطلب
const getStatusColor = (status: OrderStatus): string => {
  const colorMap: Record<OrderStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    confirmed: "bg-blue-100 text-blue-800 border-blue-200",
    processing: "bg-purple-100 text-purple-800 border-purple-200",
    shipped: "bg-indigo-100 text-indigo-800 border-indigo-200",
    delivered: "bg-green-100 text-green-800 border-green-200",
    cancelled: "bg-red-100 text-red-800 border-red-200",
    suspended: "bg-gray-100 text-gray-800 border-gray-200",
    in_delivery: "bg-orange-100 text-orange-800 border-orange-200",
    partially_delivered: "bg-yellow-100 text-yellow-800 border-yellow-200",
    delivery_rejected: "bg-red-100 text-red-800 border-red-200",
    returned: "bg-gray-100 text-gray-800 border-gray-200"
  };
  return colorMap[status] || "";
};

// Helper functions removed. Logic moved inside component.

// حساب العمولة
// حساب العمولة
const calculateCommission = (items: OrderItem[], products: Product[]): number => {
  return items.reduce((total, item) => {
    const product = products.find(p => p.id === item.productId);
    // Use the product's base price (what marketer sees in store) NOT wholesale price
    // Commission = (Sell Price - Base Price) × Quantity
    const basePrice = product?.price || 0;
    const itemMargin = (Number(item.price) - Number(basePrice));

    // Debug logging
    console.log('🔍 Commission Calc:', {
      productName: item.productName,
      sellPrice: item.price,
      basePrice: basePrice,
      margin: itemMargin,
      quantity: item.quantity,
      itemCommission: itemMargin * item.quantity
    });

    return total + (itemMargin * item.quantity);
  }, 0);
};

const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [provinces, setProvinces] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);
  const [shippingAreas, setShippingAreas] = useState<any[]>([]);

  // Helper inside component to access state
  const getShippingRate = (province: string) => {
    const area = shippingAreas.find(a => a.governorate === province);
    return area ? area.price : 50;
  };

  const getCitiesByProvince = (province: string) => {
    const area = shippingAreas.find(a => a.governorate === province);
    return area ? area.cities : [];
  };

  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  // Fetch products on mount
  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const result = await getProducts();
        const products = Array.isArray(result) ? result : (result?.data || []);
        setAvailableProducts(products);
      } catch (err) {
        console.error("Failed to fetch products", err);
        toast.error("فشل في تحميل قائمة المنتجات");
      }
    };
    fetchProductsData();
  }, []);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        if (!id) {
          setError("معرف الطلب غير صالح");
          return;
        }

        // محاكاة تأخير API
        await new Promise(resolve => setTimeout(resolve, 500));

        const orderData = await getOrderById(id);

        if (!orderData) {
          setError("الطلب غير موجود");
          return;
        }

        // تحميل مناطق الشحن
        const areas = await getShippingAreas();
        setShippingAreas(areas);
        const availableProvinces = areas.map((a: any) => a.governorate);
        setProvinces(availableProvinces);

        // تحميل المدن إذا كانت المحافظة محددة
        if (orderData.province) {
          const area = areas.find((a: any) => a.governorate === orderData.province);
          setCities(area ? area.cities : []);
        }

        // تحميل شركات الشحن
        const companies = await getShippingCompanies();
        setShippingCompanies(companies);

        setOrder(orderData);
      } catch (err) {
        setError("حدث خطأ أثناء جلب بيانات الطلب");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  // حساب إجمالي المنتجات
  const calculateProductTotal = (items: OrderItem[]): number => {
    return items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  };

  // حساب إجمالي الطلب
  const calculateOrderTotal = (items: OrderItem[], shippingFee: number, discount: number): number => {
    const productTotal = calculateProductTotal(items);
    return Number(productTotal) + Number(shippingFee) - Number(discount);
  };

  // تحديث بيانات الطلب
  const handleInputChange = (field: keyof Order, value: any) => {
    if (!order) return;

    const updatedOrder = { ...order, [field]: value };

    // إذا تم تغيير المحافظة، قم بتحديث رسوم الشحن والمدينة
    if (field === "province") {
      const newShippingFee = getShippingRate(value);
      updatedOrder.shippingFee = newShippingFee;
      updatedOrder.totalAmount = calculateOrderTotal(
        updatedOrder.items,
        newShippingFee,
        updatedOrder.discount || 0
      );

      // إعادة تعيين المدينة عند تغيير المحافظة
      updatedOrder.city = "";
    }

    // إذا تم تغيير الخصم، قم بتحديث إجمالي الطلب
    if (field === "discount") {
      updatedOrder.totalAmount = calculateOrderTotal(
        updatedOrder.items,
        updatedOrder.shippingFee,
        value || 0
      );
    }

    // إذا تم تغيير شركة الشحن، قم بتحديث اسم شركة الشحن
    if (field === "shippingCompany") {
      const company = shippingCompanies.find(c => c.id === value);
      if (company) {
        updatedOrder.shippingCompanyName = company.name;
      }
    }

    setOrder(updatedOrder);
  };

  // إضافة منتج جديد
  const handleAddProduct = async () => {
    if (!order || !availableProducts.length) return;

    // التحقق من الحد الأقصى للمنتجات
    const settings = await getSiteSettings();
    const maxOrders = settings.maxOrders || 5;
    if (order.items.length >= maxOrders) {
      toast.error(`لا يمكن إضافة أكثر من ${maxOrders} منتجات في الطلب الواحد`);
      return;
    }

    // فتح نافذة منبثقة لاختيار المنتج
    const firstProduct = availableProducts[0];
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      productId: firstProduct.id,
      productName: firstProduct.name,
      price: firstProduct.price,
      quantity: 1,
      total: firstProduct.price,
      image: firstProduct.thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=product${firstProduct.id}`
    };

    const updatedItems = [...order.items, newItem];
    const commission = calculateCommission(updatedItems, availableProducts);

    setOrder({
      ...order,
      items: updatedItems,
      commission,
      totalAmount: calculateOrderTotal(updatedItems, order.shippingFee, order.discount || 0)
    });

    // عرض رسالة نجاح
    toast.success("تمت إضافة المنتج بنجاح");
  };

  // تحديث منتج
  const handleUpdateProduct = (itemId: string, field: keyof OrderItem, value: any) => {
    if (!order) return;

    // Validate numeric fields
    if (field === "price" || field === "quantity") {
      const numValue = Number(value);
      if (isNaN(numValue) || numValue < 0) {
        toast.error(`قيمة ${field === "price" ? "السعر" : "الكمية"} غير صحيحة`);
        return;
      }
    }

    const updatedItems = order.items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };

        // إذا تم تغيير المنتج، قم بتحديث اسم المنتج والسعر والصورة
        if (field === "productId") {
          const product = availableProducts.find(p => p.id === value);
          if (product) {
            updatedItem.productName = product.name;
            updatedItem.price = product.price;
            updatedItem.total = product.price * updatedItem.quantity;
            updatedItem.image = product.thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=product${product.id}`;

            // إذا كان للمنتج ألوان ومقاسات، قم بتعيين القيم الافتراضية
            if (product.variants && product.variants.length > 0) {
              updatedItem.color = product.variants[0];
            }
            if (product.sizes && product.sizes.length > 0) {
              updatedItem.size = product.sizes[0];
            }

            // عرض رسالة نجاح
            toast.success(`تم تغيير المنتج إلى ${product.name}`);
          }
        }

        // إذا تم تغيير الكمية، قم بتحديث الإجمالي
        if (field === "quantity") {
          updatedItem.total = updatedItem.price * value;
        }

        // إذا تم تغيير السعر، قم بتحديث الإجمالي
        if (field === "price") {
          updatedItem.total = value * updatedItem.quantity;
        }

        return updatedItem;
      }
      return item;
    });

    const commission = calculateCommission(updatedItems, availableProducts);

    setOrder({
      ...order,
      items: updatedItems,
      commission,
      totalAmount: calculateOrderTotal(updatedItems, order.shippingFee, order.discount || 0)
    });
  };

  // حذف منتج
  const handleRemoveProduct = (itemId: string) => {
    if (!order) return;

    const updatedItems = order.items.filter(item => item.id !== itemId);

    if (updatedItems.length === 0) {
      toast.error("لا يمكن حذف جميع المنتجات من الطلب");
      return;
    }

    const commission = calculateCommission(updatedItems, availableProducts);

    setOrder({
      ...order,
      items: updatedItems,
      commission,
      totalAmount: calculateOrderTotal(updatedItems, order.shippingFee, order.discount || 0)
    });
  };

  // حفظ التغييرات
  const handleSaveChanges = async () => {
    if (!order) return;

    try {
      setIsSaving(true);

      // محاكاة تأخير API
      await new Promise(resolve => setTimeout(resolve, 800));

      // تحديث الطلب في التخزين المحلي
      await updateOrder({
        ...order,
        updatedAt: new Date().toISOString()
      });

      // تحديث جميع الاستعلامات ذات الصلة
      invalidateAllOrderQueries(queryClient);

      toast.success("تم حفظ التغييرات بنجاح");

      // البقاء في نفس الصفحة بعد حفظ التغييرات
      // لا نقوم بأي توجيه
    } catch (err: any) {
      console.error("❌ Save Error:", err);
      const errorMessage = err?.message || err?.error || "حدث خطأ غير معروف";
      toast.error(`فشل الحفظ: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">جاري تحميل بيانات الطلب...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !order) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[70vh]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
            <h2 className="text-xl font-bold mt-4">{error || "حدث خطأ غير متوقع"}</h2>
            <p className="mt-2 text-gray-600">معرف الطلب: {id}</p>
            <Button
              className="mt-4 bg-blue-600 hover:bg-blue-700"
              onClick={() => navigate(-1)}
            >
              العودة للخلف
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* رأس الصفحة */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              تعديل طلب #{order.orderNumber}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className={getStatusColor(order.status)}>
                {translateStatus(order.status)}
              </Badge>
              <span className="text-sm text-gray-500">
                تم الإنشاء في {new Date(order.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {/* تم حذف زر حفظ التغييرات العلوي */}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* معلومات العميل */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>معلومات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">الاسم</Label>
                  <Input
                    id="customerName"
                    value={order.customerName}
                    onChange={(e) => handleInputChange("customerName", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone">رقم الهاتف</Label>
                  <Input
                    id="customerPhone"
                    value={order.customerPhone}
                    onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone2">رقم هاتف بديل (اختياري)</Label>
                  <Input
                    id="customerPhone2"
                    value={order.customerPhone2 || ""}
                    onChange={(e) => handleInputChange("customerPhone2", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customerAddress">العنوان</Label>
                  <Textarea
                    id="customerAddress"
                    value={order.customerAddress}
                    onChange={(e) => handleInputChange("customerAddress", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="province">المحافظة</Label>
                  <Select
                    value={order.province}
                    onValueChange={(value) => {
                      handleInputChange("province", value);
                      // تحديث المدن عند تغيير المحافظة
                      const availableCities = getCitiesByProvince(value);
                      setCities(availableCities);
                    }}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province} value={province}>
                          {province}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Select
                    value={order.city}
                    onValueChange={(value) => handleInputChange("city", value)}
                    disabled={!order.province || cities.length === 0}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="اختر المدينة" />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="customerNotes">ملاحظات العميل (اختياري)</Label>
                  <Textarea
                    id="customerNotes"
                    value={order.customerNotes || ""}
                    onChange={(e) => handleInputChange("customerNotes", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* معلومات المسوق */}
          <Card>
            <CardHeader>
              <CardTitle>معلومات المسوق</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="marketerName">الاسم</Label>
                  <Input
                    id="marketerName"
                    value={order.marketerName || (order as any).marketer_name || ""}
                    onChange={(e) => handleInputChange("marketerName", e.target.value)}
                    className="mt-1"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="marketerId">معرف المسوق</Label>
                  <Input
                    id="marketerId"
                    value={order.marketerId || (order as any).marketer_id || ""}
                    className="mt-1"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="commission">العمولة</Label>
                  <Input
                    id="commission"
                    value={Number(order.commission || 0).toFixed(2)}
                    className="mt-1"
                    disabled
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تفاصيل الطلب */}
          <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>تفاصيل الطلب</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddProduct}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة منتج
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 border-b pb-4">
                    <div
                      className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0 cursor-pointer relative group"
                      onClick={() => {
                        setSelectedImage(item.image || "/placeholder.svg");
                        setIsImageModalOpen(true);
                      }}
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ZoomIn className="h-5 w-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-grow grid grid-cols-6 gap-4">
                      <div className="col-span-2">
                        <ProductSearch
                          label="المنتج"
                          products={availableProducts}
                          value={item.productId}
                          onChange={(value) => handleUpdateProduct(item.id, "productId", value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`price-${item.id}`}>سعر البيع</Label>
                        <Input
                          id={`price-${item.id}`}
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateProduct(item.id, "price", parseFloat(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`quantity-${item.id}`}>الكمية</Label>
                        <Input
                          id={`quantity-${item.id}`}
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateProduct(item.id, "quantity", parseInt(e.target.value))}
                          className="mt-1"
                          min="1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`color-${item.id}`}>اللون</Label>
                        <Input
                          id={`color-${item.id}`}
                          value={item.color || ""}
                          onChange={(e) => handleUpdateProduct(item.id, "color", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`size-${item.id}`}>المقاس</Label>
                        <Input
                          id={`size-${item.id}`}
                          value={item.size || ""}
                          onChange={(e) => handleUpdateProduct(item.id, "size", e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center justify-between gap-2">
                      <p className="text-sm font-medium">الإجمالي</p>
                      <p className="font-bold">{item.total} ج.م</p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveProduct(item.id)}
                        className="gap-2 mt-1"
                        disabled={order.items.length <= 1}
                      >
                        <Trash className="h-4 w-4" />
                        حذف
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ملخص الطلب */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummary
                productTotal={calculateProductTotal(order.items)}
                shippingFee={order.shippingFee}
                discount={order.discount || 0}
                commission={order.commission}
                province={order.province}
                items={order.items}
              />

              <Separator className="my-4" />
            </CardContent>
            <CardFooter className="flex justify-between gap-4">
              <Button
                variant="default"
                className="gap-2 w-full"
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
              </Button>

              <Button
                variant="default"
                className="gap-2 w-full"
                onClick={() => navigate(-1)}
                style={{ backgroundColor: '#1e40af', color: 'white' }}
              >
                <XCircle className="h-4 w-4" />
                إغلاق
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={selectedImage || "/placeholder.svg"}
        title="صورة المنتج"
      />
    </DashboardLayout>
  );
};

export default EditOrderPage;

