import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ChevronLeft } from "lucide-react";
import { useCart } from "@/contexts/store/CartContext";
import { useFavorites } from "@/contexts/store/FavoritesContext";

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    category: string;
    colors?: string[];
    sizes?: string[];
    stock: Record<string, number>;
    commission?: number;
}

interface CategorySectionProps {
    categoryName: string;
    products: Product[];
    bannerImage?: string;
    onViewAll?: () => void;
}

const CategorySection = ({ categoryName, products, bannerImage, onViewAll }: CategorySectionProps) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { toggleFavorite, isFavorite } = useFavorites();

    const handleAddToCart = (product: Product) => {
        addToCart({
            productId: String(product.id),
            name: product.name,
            basePrice: product.price,
            quantity: 1,
            image: product.image,
            availableColors: product.colors,
            availableSizes: product.sizes && product.sizes.length > 0 ? product.sizes : ["Free Size"],
        });
    };

    const getTotalStock = (product: Product) => {
        return Object.values(product.stock).reduce((total, quantity) => total + quantity, 0);
    };

    return (
        <div className="mb-6">
            {/* Optional Banner Image */}
            {bannerImage && (
                <div className="px-0 mb-3">
                    <div className="relative rounded-lg overflow-hidden shadow-sm h-32 w-full">
                        <img
                            src={bannerImage}
                            alt={categoryName}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                </div>
            )}

            {/* Category Header */}
            <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-lg font-bold text-gray-800">
                    {categoryName}
                </h2>
                {onViewAll && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onViewAll}
                        className="text-primary text-xs flex items-center gap-1 h-7"
                    >
                        عرض الكل
                        <ChevronLeft className="w-3 h-3" />
                    </Button>
                )}
            </div>

            {/* Products List (Vertical Stack for Mobile) */}
            <div className="flex flex-col gap-3">
                {products.map((product) => (
                    <Card
                        key={product.id}
                        className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/40 shadow-sm rounded-xl flex flex-row h-28"
                    >
                        {/* Image Section */}
                        <div
                            className="relative w-28 shrink-0 bg-gray-50 cursor-pointer"
                            onClick={() => {
                                console.log("Navigating to product:", product.id);
                                navigate(`/product/${product.id}`);
                            }}
                        >
                            <img
                                src={product.image}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                            />
                            {/* Fav Button (On Image) */}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleFavorite(String(product.id));
                                }}
                                className="absolute top-1 right-1 bg-white/70 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-gray-400 hover:text-red-500 transition-colors z-10"
                            >
                                <Heart className={`w-3.5 h-3.5 ${isFavorite(String(product.id)) ? 'fill-red-500 text-red-500' : ''}`} />
                            </button>
                        </div>

                        {/* Details Section */}
                        <CardContent className="p-3 flex flex-col justify-between flex-1">
                            <div className="flex justify-between items-start w-full gap-2">
                                <h3 className="font-semibold text-sm text-gray-800 line-clamp-2 leading-tight">
                                    {product.name}
                                </h3>
                                {/* Stock Display - Replaces Fav Button position */}
                                <Badge variant="outline" className={`shrink-0 text-[9px] px-1.5 h-5 flex gap-1 border-0 ${getTotalStock(product) > 10 ? "bg-green-50 text-green-700" :
                                    getTotalStock(product) > 5 ? "bg-yellow-50 text-yellow-700" :
                                        "bg-red-50 text-red-700"
                                    }`}>
                                    <span>المخزون:</span>
                                    <span className="font-bold">{getTotalStock(product)}</span>
                                </Badge>
                            </div>

                            <div className="flex items-end justify-between mt-auto">
                                <div className="flex flex-col items-start gap-1">
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none text-[9px] w-fit px-1.5 h-4">
                                        عمولة مفتوحة
                                    </Badge>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-gray-900 leading-none">
                                            {product.price}
                                        </span>
                                        <span className="text-[10px] text-gray-500 font-medium ml-1">
                                            جنيه
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    size="icon"
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-full shadow-sm active:scale-95 transition-all"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAddToCart(product);
                                    }}
                                >
                                    <ShoppingCart className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div >
    );
};

export default CategorySection;
