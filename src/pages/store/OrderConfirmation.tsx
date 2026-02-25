import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, CheckCircle2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/contexts/store/CartContext";
import { useOrders } from "@/contexts/store/OrdersContext";
import { useUser } from "@/contexts/store/UserContext";
import Navbar from "@/components/store/Navbar"; // إضافة استيراد شريط التنقل
import { getStoreShippingLocations, getShippingFee } from "@/services/collectionService";

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useUser();

  // الحالة لتخزين المحافظات القادمة من الداش بورد
  const [provinces, setProvinces] = useState<Array<{ name: string; cities: string[] }>>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  // تحميل المحافظات المتاحة عند فتح الصفحة
  useEffect(() => {
    const fetchLocations = async () => {
      setIsLoadingLocations(true);
      try {
        const data = await getStoreShippingLocations();
        setProvinces(data);
      } catch (error) {
        console.error("Failed to load shipping locations", error);
        toast({
          title: "خطأ في تحميل المناطق",
          description: "تعذر تحميل مناطق الشحن المتاحة. يرجى المحاولة لاحقاً.",
          variant: "destructive"
        });
      } finally {
        setIsLoadingLocations(false);
      }
    };
    fetchLocations();
  }, [toast]);

  const orderData = location.state || {};

  // تحديد ما إذا كانت البيانات تأتي من صفحة تفاصيل المنتج
  const isFromProductDetail = orderData.product && !orderData.cartItems;

  // إنشاء cartItems من بيانات المنتج إذا كانت قادمة من صفحة تفاصيل المنتج
  const cartItems = isFromProductDetail
    ? [{
      id: orderData.product?.id || 1,
      name: orderData.product?.name || "طلب جديد",
      color: orderData.selectedColor || "",
      size: orderData.selectedSize || "",
      basePrice: orderData.product?.price || 0,
      sellPrice: orderData.customPrice || 0,
      quantity: orderData.quantity || 1,
      sku: orderData.product?.sku || "",
      image: orderData.product?.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
    }]
    : orderData.cartItems || [];

  // تحويل cartItems إلى تنسيق OrderProduct مع تتبع الحالة
  const orderProducts = cartItems.map((item: any) => ({
    id: `${Date.now()}-${Math.random()}`, // معرف فريد للقطعة
    productId: item.productId || item.id, // الحفاظ على معرف المنتج الأصلي للخصم من المخزون
    name: item.name,
    price: item.sellPrice, // سعر الوحدة
    total: item.sellPrice * item.quantity, // الإجمالي (سعر الوحدة * الكمية)
    basePrice: item.basePrice * item.quantity,
    commission: (item.sellPrice - item.basePrice) * item.quantity,
    quantity: item.quantity,
    status: "pending" as const,
    image: item.image,
    color: item.color,
    size: item.size,
    sku: item.sku
  }));

  // حساب الإجماليات
  const totalBasePrice = orderProducts.reduce((sum, item) => sum + item.basePrice, 0);
  const totalSellPrice = orderProducts.reduce((sum, item) => sum + (item.total || 0), 0);
  const totalCommission = orderProducts.reduce((sum, item) => sum + item.commission, 0);

  // سعر الشحن الثابت - سيتم تحديثه لاحقاً حسب المحافظة المختارة
  const shippingCost = 0;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [alternativePhone, setAlternativePhone] = useState("");
  const [selectedPage, setSelectedPage] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingFee, setShippingFee] = useState(0);
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPaymentScreenshot(reader.result as string);
      setUploading(false);
      toast({
        title: "تم الرفع بنجاح ✅",
        description: "تم إرفاق صورة التحويل بنجاح",
      });
    };
    reader.readAsDataURL(file);
  };

  // تحديث سعر الشحن عند تغيير المدينة أو المحافظة
  useEffect(() => {
    const fetchShipping = async () => {
      if (province) {
        // نمرر المدينة أيضاً لكي يتم البحث بدقة أكبر
        const fee = await getShippingFee(province, city);
        setShippingFee(Number(fee));
      } else {
        setShippingFee(0);
      }
    };
    fetchShipping();
  }, [province, city]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // التحقق من الحقول الإلزامية
    const missingFields = [];
    if (!customerName) missingFields.push("اسم العميل");
    if (!phone) missingFields.push("رقم الهاتف");
    if (!province) missingFields.push("المحافظة");
    if (!city) missingFields.push("المدينة");
    if (!address) missingFields.push("العنوان التفصيلي");

    if (missingFields.length > 0) {
      toast({
        title: "بيانات ناقصة ❌",
        description: `يرجى ملء الحقول التالية: ${missingFields.join("، ")}`,
        variant: "destructive"
      });
      return;
    }

    if (!paymentScreenshot) {
      toast({
        title: "يرجى رفع صورة التحويل ❌",
        description: "يجب إرفاق صورة إيصال الدفع لإتمام الطلب",
        variant: "destructive"
      });
      return;
    }

    // التحقق من طول رقم الهاتف (يجب أن يكون 11 رقم على الأقل)
    if (phone.length < 11) {
      toast({
        title: "رقم الهاتف غير صحيح 📞",
        description: "يجب أن يتكون رقم الهاتف من 11 رقمًا على الأقل",
        variant: "destructive"
      });
      return;
    }

    // حساب السعر الإجمالي
    // حساب السعر الإجمالي - تأكيد التحويل لأرقام لمنع مشكلة الدمج النصي
    const numericShipping = Number(shippingFee) || 0;
    const numericTotalSell = Number(totalSellPrice) || 0;
    const totalPrice = numericTotalSell + numericShipping;

    // إنشاء الطلب الجديد
    const newOrder = {
      product: orderProducts.length > 0
        ? orderProducts[0].name + (orderProducts.length > 1 ? ` و${orderProducts.length - 1} منتجات أخرى` : "")
        : "طلب جديد",
      customer: customerName,
      price: totalPrice, // حفظ السعر الإجمالي بدلاً من سعر البيع فقط
      totalSellPrice: numericTotalSell,
      commission: totalCommission,
      status: "pending" as const,
      date: new Date().toISOString().split('T')[0],
      image: orderProducts.length > 0
        ? orderProducts[0].image
        : "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100",
      customerName,
      phone,
      alternativePhone,
      page: selectedPage,
      selectedPage,
      province,
      city,
      address,
      notes,
      shippingFee: numericShipping,
      cartItems: orderProducts,
      marketerId: user?.id,
      marketerName: user?.name,
      payment_screenshot: paymentScreenshot,
      section: "payment_confirmation"
    };

    // إضافة الطلب إلى قائمة الطلبات
    try {
      await addOrder(newOrder);

      // تفريغ السلة بعد إتمام الطلب
      clearCart();

      toast({
        title: "تم إرسال الطلب بنجاح! 🎉",
        description: "شكراً لك، سيتم التواصل مع العميل قريباً",
      });

      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    } catch (error: any) {
      console.error("Order creation failed:", error);
      toast({
        title: "فشل إنشاء الطلب ❌",
        description: error.message || "حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.",
        variant: "destructive"
      });
    }
  };

  const selectedProvince = provinces.find(p => p.name === province);

  return (
    <div className="min-h-screen bg-background">
      <Navbar /> {/* إضافة شريط التنقل */}
      <div className="container mx-auto px-4 py-8 pb-32 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع للمنتجات
        </Button>

        <div className="grid md:grid-cols-5 gap-6">
          {/* Order Summary */}
          <Card className="md:col-span-2 h-fit shadow-elegant gradient-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                ملخص الطلب
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* عرض تفاصيل المنتجات */}
              {cartItems && cartItems.map((item: any) => (
                <div key={item.id} className="mb-4 pb-4 border-b border-border last:border-b-0">
                  <div>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full rounded-lg mb-3"
                    />
                    <h3 className="font-bold text-lg">{item.name}</h3>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">اللون:</span>
                      <span className="font-medium">{item.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">المقاس:</span>
                      <span className="font-medium">{item.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">السعر الأساسي:</span>
                      <span className="font-medium">{Math.floor(item.basePrice)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">سعر البيع:</span>
                      <span className="font-bold text-lg">{Math.floor(item.sellPrice)} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-semibold">الكمية:</span>
                      <span className="font-bold">{item.quantity}</span>
                    </div>
                    <div className="flex justify-between bg-primary/10 p-3 rounded-lg">
                      <span className="font-semibold">عمولتك:</span>
                      <span className="font-bold text-primary text-lg">{Math.floor((item.sellPrice - item.basePrice) * item.quantity)} جنيه</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* الإجماليات */}
              <div className="pt-4 border-t border-border space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">سعر الشحن:</span>
                  <span className="font-medium">
                    {Math.floor(shippingFee)} جنيه
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">إجمالي سعر البيع:</span>
                  <span className="font-medium">{Math.floor(totalSellPrice)} جنيه</span>
                </div>
                <div className="flex justify-between bg-primary/10 p-3 rounded-lg">
                  <span className="font-semibold">إجمالي المبلغ:</span>
                  <span className="font-bold text-primary text-lg">
                    {Math.floor(Number(totalSellPrice) + Number(shippingFee))} جنيه
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Form */}
          <Card className="md:col-span-3 shadow-elegant gradient-card border-border/50">
            <CardHeader>
              <CardTitle>بيانات العميل</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">اسم العميل *</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="أدخل اسم العميل"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01xxxxxxxxx"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="alt-phone">رقم الهاتف البديل</Label>
                    <Input
                      id="alt-phone"
                      value={alternativePhone}
                      onChange={(e) => setAlternativePhone(e.target.value)}
                      placeholder="رقم هاتف بديل (اختياري)"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page">اختر صفحتك</Label>
                    <select
                      id="page"
                      value={selectedPage}
                      onChange={(e) => setSelectedPage(e.target.value)}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="">اختر صفحتك (اختياري)</option>
                      {user?.pages && user.pages.map((page, index) => (
                        <option key={index} value={page}>{page}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="province">المحافظة *</Label>
                    <Select value={province} onValueChange={setProvince} required disabled={isLoadingLocations}>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingLocations ? "جاري تحميل المناطق..." : "اختر المحافظة"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((prov) => (
                          <SelectItem key={prov.name} value={prov.name}>
                            {prov.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">المدينة/المركز *</Label>
                    <Select value={city} onValueChange={setCity} required disabled={!province}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر المدينة" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProvince?.cities.map((cityName) => (
                          <SelectItem key={cityName} value={cityName}>
                            {cityName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">العنوان التفصيلي *</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="الشارع، رقم المبنى، الشقة"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="أي ملاحظات إضافية..."
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-medium">صورة إيصال الدفع (فودافون كاش / تحويل) *</Label>
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${paymentScreenshot ? 'border-green-500 bg-green-50/50' : 'border-gray-200 hover:border-primary/50'}`}>
                    {paymentScreenshot ? (
                      <div className="space-y-3">
                        <img src={paymentScreenshot} alt="Receipt" className="mx-auto h-40 object-contain rounded-lg shadow-sm" />
                        <div className="flex justify-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setPaymentScreenshot(null)}
                            className="text-red-500 border-red-200 hover:bg-red-50"
                          >
                            حذف وتغيير الصورة
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 cursor-pointer" onClick={() => document.getElementById('payment-upload')?.click()}>
                        <div className="flex justify-center">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <Upload className="h-8 w-8 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">{uploading ? "جاري الرفع..." : "اضغط لرفع صورة الإيصال"}</p>
                          <p className="text-xs text-muted-foreground">صورة واضحة لعملية التحويل</p>
                        </div>
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="payment-upload"
                          onChange={handleFileUpload}
                        />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    * ملاحظة: سيتم خصم هذا المبلغ من إجمالي الفاتورة عند الاستلام.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary shadow-glow text-lg py-6"
                  size="lg"
                  disabled={uploading}
                >
                  تأكيد الطلب وإرسال الإيصال
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
