import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Package, Download, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/store/Navbar";
import { useProducts } from "@/contexts/store/ProductsContext";
import { useCart } from "@/contexts/store/CartContext";
import { useFavorites } from "@/contexts/store/FavoritesContext";

import { getSiteSettings, SiteSettings } from "@/services/siteSettingsService";
import PriceDisplay from "@/components/store/PriceDisplay";
import StarRating from "@/components/store/StarRating";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { products, refreshProducts } = useProducts();

  const product = products.find(p => p.id === id);

  const { addToCart } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    refreshProducts();
    const loadSettings = async () => {
      const data = await getSiteSettings();
      setSettings(data);
    };
    loadSettings();
  }, []);

  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState<string | number>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const mainImg = product.image || (product.images && product.images.length > 0 ? product.images[0] : "");
      setSelectedImage(mainImg);
    }
  }, [product]);

  let availableSizes: string[] = [];
  let availableColors: string[] = [];

  if (product) {
    if (product.detailedVariants && product.detailedVariants.length > 0) {
      const colorQuantities: Record<string, number> = {};
      product.detailedVariants.forEach((v: any) => {
        if (v.color) {
          colorQuantities[v.color] = (colorQuantities[v.color] || 0) + Number(v.quantity);
        }
      });
      availableColors = Object.keys(colorQuantities).filter(c => colorQuantities[c] > 0);

      if (product.colors && product.colors.length > 0) {
        availableColors = product.colors.filter(c => availableColors.includes(c));
      }

      if (selectedColor) {
        availableSizes = product.detailedVariants
          .filter((v: any) => v.color === selectedColor && Number(v.quantity) > 0)
          .map((v: any) => v.size);
      } else {
        availableSizes = product.detailedVariants
          .filter((v: any) => Number(v.quantity) > 0)
          .map((v: any) => v.size);
      }
    } else {
      availableSizes = product.sizes || [];
      availableColors = (product.colors || []).filter(c => (product.stock[c] || 0) > 0);
    }

    availableSizes = [...new Set(availableSizes)].filter(s => s && s.trim() !== "");
    availableColors = [...new Set(availableColors)].filter(c => c && c.trim() !== "");
  }

  useEffect(() => {
    if (selectedColor && availableColors.length > 0 && !availableColors.includes(selectedColor)) {
      setSelectedColor(null);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    if (selectedSize && availableSizes.length > 0 && !availableSizes.includes(selectedSize)) {
      setSelectedSize(null);
    }
  }, [selectedColor, availableSizes, selectedSize]);

  const basePrice = product?.price || 0;
  const commission = Number(customPrice) - basePrice;

  let stockCount = 0;
  if (product) {
    if (selectedColor && selectedSize && product.detailedVariants && product.detailedVariants.length > 0) {
      const variant = product.detailedVariants.find((v: any) => v.color === selectedColor && v.size === selectedSize);
      stockCount = variant ? Number(variant.quantity) : 0;
    } else if (selectedColor) {
      if (product.detailedVariants && product.detailedVariants.length > 0) {
        stockCount = product.detailedVariants
          .filter((v: any) => v.color === selectedColor)
          .reduce((sum, v) => sum + Number(v.quantity), 0);
      } else {
        stockCount = (product.stock as Record<string, number>)[selectedColor] || 0;
      }
    } else {
      if (typeof product.stock === 'number') {
        stockCount = product.stock;
      } else {
        stockCount = Object.values(product.stock).reduce((sum, val) => sum + val, 0);
      }
    }
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-red-500 mb-4">المنتج غير موجود</h1>
          <Button onClick={() => navigate('/products')}>العودة للمنتجات</Button>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    if (!selectedColor) {
      toast({ title: "اختيار غير مكتمل", description: "يرجى اختيار اللون", variant: "destructive" });
      return;
    }
    if (!selectedSize) {
      toast({ title: "اختيار غير مكتمل", description: "يرجى اختيار المقاس", variant: "destructive" });
      return;
    }
    if (Number(customPrice) <= basePrice) {
      toast({ title: "خطأ في السعر", description: "يجب أن يكون سعر البيع أكبر من السعر الأساسي", variant: "destructive" });
      return;
    }
    if (settings && settings.minCommission > 0 && commission * quantity < settings.minCommission) {
      toast({ title: "العمولة منخفضة", description: `الحد الأدنى للعمولة المسموح بها هو ${settings.minCommission} جنيه`, variant: "destructive" });
      return;
    }
    if (settings && settings.maxCommission > 0 && commission * quantity > settings.maxCommission) {
      toast({ title: "العمولة مرتفعة", description: `الحد الأقصى للعمولة المسموح بها هو ${settings.maxCommission} جنيه`, variant: "destructive" });
      return;
    }
    navigate("/order-confirmation", {
      state: { product, selectedColor, selectedSize: selectedSize || "Free Size", customPrice, commission, quantity }
    });
  };

  const handleDownload = () => {
    if (product?.driveLink) {
      window.open(product.driveLink, '_blank');
    } else {
      toast({ title: "لا يوجد رابط", description: "لم يتم إضافة رابط للملفات لهذا المنتج", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pb-32 md:pb-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowRight className="w-4 h-4 ml-2" />
          رجوع
        </Button>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Left Side: Gallery & Description Column */}
            <div className="flex flex-col gap-6 w-full md:w-auto">
              {/* Product Gallery */}
              <div className="flex flex-col md:flex-row-reverse gap-4 w-full md:w-auto">
                {/* Main Image */}
                <div className="w-full md:w-[500px] flex-shrink-0">
                  <div className="relative w-full aspect-square bg-background border border-border/40 rounded-2xl shadow-sm overflow-hidden">
                    <img
                      src={selectedImage || product.image || ""}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-contain p-4"
                    />
                  </div>
                </div>

                {/* Thumbnails */}
                {(() => {
                  const allGalleryImages = [product.image, ...(product.images || [])].filter(Boolean);
                  if (allGalleryImages.length <= 1) return null;
                  return (
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto w-full md:w-24 md:h-[500px] py-1 no-scrollbar md:scrollbar-thin md:scrollbar-thumb-muted-foreground/20 md:scrollbar-track-transparent select-none shrink-0">
                      <div className="flex md:flex-col gap-3 min-w-max md:min-w-0">
                        {allGalleryImages.map((img: string, idx: number) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${selectedImage === img ? 'border-primary ring-2 ring-primary/10' : 'border-border/40 hover:border-border'}`}
                          >
                            <img src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Product Description - Aligned with Gallery Width */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <Label className="text-xl font-bold text-foreground">وصف المنتج</Label>
                </div>
                <Card className="border border-border/40 bg-card shadow-sm overflow-hidden rounded-2xl">
                  <CardContent className="p-6 text-foreground/90 prose prose-sm max-w-none">
                    {product.description ? (
                      <p className="whitespace-pre-wrap font-cairo leading-relaxed m-0 text-base md:text-lg">
                        {product.description}
                      </p>
                    ) : (
                      <p className="m-0 italic text-muted-foreground">لا يوجد وصف لهذا المنتج حالياً</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Side: Product Info & Order Card */}
            <div className="flex-1 space-y-6 w-full">
              <div>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                  <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
                  {product.sku && (
                    <Badge variant="outline" className="w-fit font-mono text-xs px-3 py-1 bg-muted text-muted-foreground border-border">
                      {product.sku}
                    </Badge>
                  )}
                </div>

                <div className="mb-4">
                  <StarRating salesCount={product.sales_count || 0} rating={product.rating} />
                </div>

                <div className="flex gap-3 mb-4">
                  <Badge className={`${stockCount > 0 ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"} text-white shadow-glow`}>
                    {stockCount > 0 ? "متوفر" : "نفذت الكمية"}
                  </Badge>
                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white font-bold">{stockCount} قطعة</Badge>
                </div>

                <Button
                  onClick={handleDownload}
                  variant={product.driveLink ? "default" : "outline"}
                  className={`mb-4 flex items-center gap-2 ${product.driveLink ? "bg-blue-600 hover:bg-blue-700 text-white" : "opacity-50 cursor-not-allowed"}`}
                  disabled={!product.driveLink}
                >
                  <Download className="w-4 h-4" />
                  تحميل صور المنتج
                </Button>

                <Card className="gradient-card border-border/50">
                  <CardContent className="p-4 md:p-6 space-y-6">
                    {/* Color selection */}
                    <div className="space-y-3">
                      <Label className="text-base md:text-lg font-semibold">اللون</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map((color: string) => (
                          <Button
                            key={color}
                            variant="outline"
                            onClick={() => setSelectedColor(color)}
                            className={`min-w-[80px] h-11 flex items-center justify-center px-4 rounded-xl border-2 transition-all duration-200 text-sm md:text-base font-bold ${selectedColor === color ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg scale-105" : "hover:border-border dark:hover:border-zinc-700 bg-background"}`}
                          >
                            <span className="leading-tight">{color}</span>
                          </Button>
                        ))}
                      </div>
                      {selectedColor && (
                        <p className="text-sm text-muted-foreground font-bold">
                          المتوفر من هذا اللون: {
                            product.detailedVariants && product.detailedVariants.length > 0
                              ? product.detailedVariants.filter((v: any) => v.color === selectedColor).reduce((sum, v) => sum + Number(v.quantity), 0)
                              : (product.stock[selectedColor] || 0)
                          } قطعة
                        </p>
                      )}
                    </div>

                    {/* Size selection */}
                    <div className="space-y-3">
                      <Label className="text-base md:text-lg font-semibold">المقاس</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableSizes.length > 0 ? (
                          availableSizes.map((size: string) => (
                            <Button
                              key={size}
                              variant="outline"
                              onClick={() => setSelectedSize(size)}
                              className={`min-w-[80px] h-11 flex items-center justify-center px-4 rounded-xl border-2 transition-all duration-200 text-sm md:text-base font-bold ${selectedSize === size ? "bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-lg scale-105" : "hover:border-border dark:hover:border-zinc-700 bg-background"}`}
                            >
                              {size}
                            </Button>
                          ))
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => setSelectedSize("Free Size")}
                            className={`px-4 h-11 rounded-xl border-2 ${selectedSize === "Free Size" ? "bg-green-600 hover:bg-green-700 text-white border-green-600" : "bg-background"}`}
                          >
                            Free Size
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Price and quantity */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">السعر الأساسي</Label>
                          <div className="text-xl font-extrabold text-foreground bg-muted/30 px-2 py-1 rounded-md inline-block">
                            <PriceDisplay amount={basePrice} />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="customPrice" className="text-sm">سعر البيع</Label>
                          <Input
                            id="customPrice"
                            type="number"
                            placeholder="0.00"
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            className="text-2xl font-bold h-auto py-2 placeholder:text-gray-200"
                          />
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">الكمية</Label>
                        <div className="flex items-center gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            disabled={!selectedColor}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(settings?.maxOrders || 99, Math.max(1, Number(e.target.value))))}
                            className="w-20 text-center"
                            disabled={!selectedColor}
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => selectedColor && setQuantity(Math.min(stockCount || 99, settings?.maxOrders || 99, quantity + 1))}
                            disabled={!selectedColor}
                          >
                            +
                          </Button>
                        </div>
                      </div>

                      <div className="bg-primary/10 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium">عمولتك:</span>
                          <span className={`text-3xl font-extrabold ${commission >= 0 ? 'text-primary' : 'text-destructive'} tracking-wide`}>
                            <PriceDisplay amount={commission * quantity} className="text-2xl" />
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        onClick={handleConfirm}
                        className={`${stockCount === 0 ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"} text-white shadow-glow text-base md:text-lg py-7 md:py-6 transition-all duration-300`}
                        size="lg"
                        disabled={!selectedColor || !selectedSize || stockCount === 0 || quantity > stockCount || Number(customPrice) <= basePrice}
                      >
                        {(() => {
                          if (stockCount === 0 && selectedColor) return <><XCircle className="w-4 h-4 ml-2" /> نفذت الكمية</>;
                          if (!selectedColor) return <><Package className="w-4 h-4 ml-2" /> اطلب الآن</>;
                          if (!selectedSize) return "اختر المقاس";
                          if (Number(customPrice) <= basePrice) return "حدد سعر البيع";
                          return <><Package className="w-4 h-4 ml-2" /> اطلب الآن</>;
                        })()}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
