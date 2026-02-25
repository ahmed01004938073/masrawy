import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/store/CartContext";

const Cart = () => {
  const navigate = useNavigate();
  const {
    cartItems,
    removeFromCart,
    updateQuantity
  } = useCart();

  const totalBasePrice = cartItems.reduce((sum, item) => sum + item.basePrice * item.quantity, 0);
  const totalSellPrice = cartItems.reduce((sum, item) => sum + (item.sellPrice || item.basePrice) * item.quantity, 0);
  const totalCommission = totalSellPrice - totalBasePrice;

  const handleCheckout = () => {
    navigate("/cart/checkout");
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <ShoppingBag className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">السلة فارغة</h2>
            <p className="text-muted-foreground mb-6">ابدأ بإضافة منتجات إلى سلة التسوق</p>
            <Button onClick={() => navigate("/products")} className="gradient-primary">
              تصفح المنتجات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <div className="relative">
        {/* Premium Shiny Green Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white pt-10 pb-20 px-4 md:px-8 rounded-b-[2.5rem] shadow-lg mb-[-4rem]">
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group transition-all hover:bg-white/30">
                <ShoppingBag className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-4 md:px-6 py-3 rounded-2xl shadow-xl border border-white/50 max-w-full overflow-hidden">
                <p className="text-zinc-900 text-[11px] sm:text-sm md:text-xl font-black whitespace-nowrap font-cairo">مراجعة الطلب وإتمام الشراء</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pb-32 relative z-10">

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <Card key={item.id} className="gradient-card border-border/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-lg object-cover"
                    />

                    <div className="flex-1 space-y-3">
                      <div className="flex justify-between">
                        <div>
                          <h3 className="font-bold text-lg">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            السعر: {Math.floor(item.basePrice)} جنيه
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium">
                            الإجمالي: {Math.floor(item.basePrice * item.quantity)} جنيه
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <Card className="shadow-elegant gradient-card border-border/50 sticky top-24">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-bold text-xl mb-4">ملخص السلة</h3>

                <div className="space-y-3 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">عدد المنتجات</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">إجمالي الكمية</span>
                    <span className="font-medium">{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold">الإجمالي</span>
                  <span className="text-2xl font-bold text-primary">
                    {Math.floor(totalBasePrice)} جنيه
                  </span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-green-600 hover:bg-green-700 text-white shadow-glow text-lg py-6"
                  size="lg"
                >
                  إتمام الطلب
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>



    </div >
  );
};

export default Cart;
