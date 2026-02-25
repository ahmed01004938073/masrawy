import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, AlertCircle } from "lucide-react";
import { useCart } from "@/contexts/store/CartContext";
import { toast } from "@/hooks/use-toast";
import { getSiteSettings, SiteSettings } from "@/services/siteSettingsService";
import PriceDisplay from "@/components/store/PriceDisplay";

const CartCheckout = () => {
  const navigate = useNavigate();
  const { cartItems, updateColor, updateSize, updatePrice } = useCart();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    const loadSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const handleProceed = () => {
    // التحقق من أن جميع المنتجات لها لون ومقاس وسعر بيع
    const incompleteItems = cartItems.filter(
      item => !item.color || !item.size || !item.sellPrice
    );

    if (incompleteItems.length > 0) {
      toast({
        title: "يرجى إكمال البيانات",
        description: "يجب اختيار اللون والمقاس وتحديد سعر البيع لجميع المنتجات",
        variant: "destructive",
      });
      return;
    }

    // التحقق من أن سعر البيع أكبر من أو يساوي السعر الأساسي
    const invalidPrices = cartItems.filter(
      item => item.sellPrice! < item.basePrice
    );

    if (invalidPrices.length > 0) {
      toast({
        title: "أسعار غير صالحة",
        description: "سعر البيع يجب أن يكون أكبر من أو يساوي السعر الأساسي",
        variant: "destructive",
      });
      return;
    }

    // حساب الإجماليات للتحقق من القيود
    const totalBasePrice = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
    const totalSellPrice = cartItems.reduce((sum, item) => sum + item.sellPrice! * item.quantity, 0);
    const totalCommission = totalSellPrice - totalBasePrice;
    const totalQuantity = cartItems.reduce((sum, item) => sum + item.quantity, 0);


    // التحقق من القيود باستخدام الإعدادات
    if (settings) {
      // التحقق من الحد الأقصى لعدد المنتجات
      if (settings.maxOrders > 0 && totalQuantity > settings.maxOrders) {
        toast({
          title: "تجاوز الحد الأقصى للطلبات",
          description: `عفواً، الحد الأقصى لعدد المنتجات المسموح به في الطلب الواحد هو ${settings.maxOrders} منتجات`,
          variant: "destructive",
        });
        return;
      }

      // التحقق من الحد الأدنى للعمولة
      if (settings.minCommission > 0 && totalCommission < settings.minCommission) {
        toast({
          title: "العمولة أقل من الحد المسموح",
          description: `عفواً، يجب أن لا تقل إجمالي عمولتك في الطلب عن ${settings.minCommission} جنيه`,
          variant: "destructive",
        });
        return;
      }

      // التحقق من الحد الأقصى للعمولة
      if (settings.maxCommission > 0 && totalCommission > settings.maxCommission) {
        toast({
          title: "العمولة تجاوزت الحد المسموح",
          description: `عفواً، الحد الأقصى للعمولة المسموح بها في الطلب هو ${settings.maxCommission} جنيه`,
          variant: "destructive",
        });
        return;
      }
    }

    // الانتقال لصفحة إدخال بيانات العميل
    navigate("/order-confirmation", {
      state: {
        cartItems,
        totalBasePrice,
        totalSellPrice,
        totalCommission,
      },
    });
  };

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pb-32">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/cart")}
            className="mb-4"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة للسلة
          </Button>
          <h1 className="text-4xl font-bold mb-2">تفاصيل الطلب</h1>
          <p className="text-muted-foreground">اختر اللون والمقاس وحدد سعر البيع لكل منتج</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Product Details */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="gradient-card border-border/50">
                <CardContent className="p-6">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        الكمية: {item.quantity}
                      </p>

                      <div className="text-sm font-medium text-primary mt-1 flex items-center gap-1">
                        السعر الأساسي: <PriceDisplay amount={Math.floor(item.basePrice)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* اختيار اللون */}
                    <div className="space-y-2">
                      <Label>اللون {!item.color && <span className="text-destructive">*</span>}</Label>
                      <Select
                        value={item.color || ""}
                        onValueChange={(value) => updateColor(item.id, value)}
                      >
                        <SelectTrigger className={!item.color ? "border-destructive" : ""}>
                          <SelectValue placeholder="اختر اللون" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.availableColors?.map((color) => (
                            <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* اختيار المقاس */}
                    <div className="space-y-2">
                      <Label>المقاس {!item.size && <span className="text-destructive">*</span>}</Label>
                      <Select
                        value={item.size || ""}
                        onValueChange={(value) => updateSize(item.id, value)}
                      >
                        <SelectTrigger className={!item.size ? "border-destructive" : ""}>
                          <SelectValue placeholder="اختر المقاس" />
                        </SelectTrigger>
                        <SelectContent>
                          {item.availableSizes?.map((size) => (
                            <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* سعر البيع */}
                    <div className="space-y-2">
                      <Label>سعر البيع {!item.sellPrice && <span className="text-destructive">*</span>}</Label>
                      <Input
                        type="number"
                        min={item.basePrice}
                        value={item.sellPrice || ""}
                        onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                        placeholder={`الحد الأدنى: ${item.basePrice}`}
                        className={!item.sellPrice ? "border-destructive" : ""}
                      />
                    </div>
                  </div>

                  {/* عرض العمولة */}
                  {item.sellPrice && item.sellPrice >= item.basePrice && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                      <p className="text-sm font-medium flex items-center gap-1">
                        عمولتك: <span className="text-primary font-bold">
                          <PriceDisplay amount={Math.floor((item.sellPrice - item.basePrice) * item.quantity)} />
                        </span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="gradient-card border-border/50 sticky top-4">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold">ملخص الطلب</h3>

                <div className="space-y-2 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي السعر الأساسي</span>
                    <span className="font-medium">
                      <PriceDisplay amount={Math.floor(cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0))} />
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي سعر البيع</span>
                    <span className="font-medium">
                      <PriceDisplay amount={Math.floor(cartItems.reduce((sum, item) => sum + (item.sellPrice || 0) * item.quantity, 0))} />
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">عمولتك الإجمالية</span>
                  <span className="text-2xl font-bold text-primary">
                    <PriceDisplay amount={Math.floor(cartItems.reduce(
                      (sum, item) => sum + ((item.sellPrice || item.basePrice) - item.basePrice) * item.quantity,
                      0
                    ))} />
                  </span>
                </div>

                {/* تحذير إذا كانت هناك بيانات ناقصة */}
                {cartItems.some(item => !item.color || !item.size || !item.sellPrice) && (
                  <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-destructive">
                      يرجى إكمال بيانات جميع المنتجات (اللون، المقاس، سعر البيع)
                    </p>
                  </div>
                )}

                <Button
                  className="w-full gradient-primary"
                  size="lg"
                  onClick={handleProceed}
                >
                  متابعة إلى إدخال بيانات العميل
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckout;
