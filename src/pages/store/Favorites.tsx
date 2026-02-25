import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/contexts/store/FavoritesContext";
import { useCart } from "@/contexts/store/CartContext";
import { useProducts } from "@/contexts/store/ProductsContext";

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToCart } = useCart();
  const { products } = useProducts();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate pagination
  const reversedFavorites = [...favorites].reverse();
  const totalPages = Math.ceil(reversedFavorites.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFavorites = reversedFavorites.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
  const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="max-w-md mx-auto">
            <Heart className="w-24 h-24 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">لا توجد مفضلات</h2>
            <p className="text-muted-foreground mb-6">ابدأ بإضافة منتجات إلى المفضلة</p>
            <Button onClick={() => navigate("/products")} className="gradient-primary">
              تصفح المنتجات
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Function to get product details by ID
  const getProductDetails = (productId: string) => {
    return products.find(product => product.id === productId) || {
      id: productId,
      name: `منتج #${productId}`,
      price: Math.floor(200 + Math.random() * 500),
      image: `https://picsum.photos/seed/${productId}/400`,
      colors: ["أسود", "أبيض", "أزرق"],
      stock: { "أسود": 10, "أبيض": 15, "أزرق": 8 },
      categoryId: 1,
      commission: 0
    };
  };

  // حساب إجمالي المخزون
  const getTotalStock = (product: any): number => {
    if (!product.stock) return 0;
    return (Object.values(product.stock) as any[]).reduce((total: number, quantity: any) => total + Number(quantity), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="relative">
        {/* Premium Shiny Green Header Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white pt-10 pb-20 px-4 md:px-8 rounded-b-[2.5rem] shadow-lg mb-[-4rem]">
          <div className="container mx-auto relative z-10">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl shadow-inner group transition-all hover:bg-white/30">
                <Heart className="w-8 h-8 text-white transition-transform group-hover:scale-110" />
              </div>
              <div className="bg-white/95 backdrop-blur-sm px-4 md:px-6 py-3 rounded-2xl shadow-xl border border-white/50 max-w-full overflow-hidden">
                <p className="text-zinc-900 text-[11px] sm:text-sm md:text-xl font-black whitespace-nowrap font-cairo">منتجاتك المفضلة والمميزة</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 pb-32 md:pb-8 relative z-10">

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {currentFavorites.map((productId) => {
            const product = getProductDetails(productId);

            return (
              <Card
                key={productId}
                className="group overflow-hidden hover:shadow-elegant transition-all duration-300 gradient-card border-border/50"
              >
                <div className="relative overflow-hidden aspect-square cursor-pointer" onClick={() => navigate(`/product/${productId}`)}>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-3 right-3 bg-card/80 backdrop-blur-sm hover:bg-card"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(productId);
                      toast({ title: "تم الإزالة من المفضلة" });
                    }}
                  >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </Button>
                  <div className="absolute top-3 left-3">
                    <Badge
                      className={
                        getTotalStock(product) > 10
                          ? "shadow-glow bg-green-500"
                          : getTotalStock(product) > 5
                            ? "shadow-glow bg-yellow-500"
                            : "shadow-glow bg-red-500"
                      }
                    >
                      المخزون: {getTotalStock(product)}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-5">
                  <h3 className="font-bold text-xl mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{Math.floor(product.price)} جنيه</p>
                      <p className="text-sm text-muted-foreground">السعر الأساسي</p>
                    </div>
                    <div className="text-left">
                      <Badge className="bg-green-500 text-white">
                        عمولة مفتوحة
                      </Badge>
                    </div>
                  </div>
                  <Button
                    className="w-full gradient-primary"
                    onClick={() => {
                      addToCart({
                        productId: product.id,
                        name: product.name,
                        basePrice: product.price,
                        quantity: 1,
                        image: product.image,
                        availableColors: product.colors,
                        availableSizes: ["S", "M", "L", "XL", "XXL"],
                      });
                      toast({
                        title: "تمت الإضافة للسلة",
                        description: "يمكنك متابعة التسوق أو الذهاب للسلة"
                      });
                    }}
                  >
                    <ShoppingCart className="w-4 h-4 ml-2" />
                    إضافة للسلة
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <Button
              onClick={prevPage}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index + 1}
                onClick={() => paginate(index + 1)}
                variant={currentPage === index + 1 ? "default" : "outline"}
                size="sm"
              >
                {index + 1}
              </Button>
            ))}

            <Button
              onClick={nextPage}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
