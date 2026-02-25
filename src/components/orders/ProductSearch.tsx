
import React, { useState, useEffect } from "react";
import { Search, Plus, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderItem } from "@/pages/Orders";

// Mock products for demonstration
const mockProducts = [
  { id: "p1", name: "هاتف ذكي", price: 5000, image: "/placeholder.svg", colors: ["أسود", "أبيض", "أزرق"], sizes: [""] },
  { id: "p2", name: "سماعات لاسلكية", price: 500, image: "/placeholder.svg", colors: ["أسود", "أبيض"], sizes: [""] },
  { id: "p3", name: "ساعة ذكية", price: 2000, image: "/placeholder.svg", colors: ["أسود", "فضي"], sizes: [""] },
  { id: "p4", name: "لابتوب", price: 12000, image: "/placeholder.svg", colors: ["رمادي"], sizes: [""] },
  { id: "p5", name: "ماوس", price: 300, image: "/placeholder.svg", colors: ["أسود"], sizes: [""] },
  { id: "p6", name: "مكنسة كهربائية", price: 2500, image: "/placeholder.svg", colors: ["أحمر"], sizes: [""] },
  { id: "p7", name: "تلفزيون ذكي", price: 8000, image: "/placeholder.svg", colors: ["أسود"], sizes: ["43 بوصة", "50 بوصة", "55 بوصة"] },
  { id: "p8", name: "قميص رجالي", price: 400, image: "/placeholder.svg", colors: ["أزرق", "أسود", "أبيض"], sizes: ["S", "M", "L", "XL"] },
  { id: "p9", name: "بنطلون جينز", price: 600, image: "/placeholder.svg", colors: ["أزرق", "أسود"], sizes: ["30", "32", "34", "36"] },
  { id: "p10", name: "حذاء رياضي", price: 800, image: "/placeholder.svg", colors: ["أسود", "أبيض", "رمادي"], sizes: ["40", "41", "42", "43", "44"] },
];

interface ProductSearchProps {
  orderItems: OrderItem[];
  onAddProduct: (product: any, color: string, size: string) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ orderItems, onAddProduct }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Search products automatically when the search query changes
  useEffect(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    if (searchQuery.trim()) {
      setIsSearching(true);
      const timeout = setTimeout(() => {
        performSearch();
      }, 300);
      
      setTypingTimeout(timeout);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
    
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [searchQuery]);

  const performSearch = () => {
    const results = mockProducts.filter(product => 
      product.name.includes(searchQuery.trim())
    );
    
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0] || "");
    setSelectedSize(product.sizes[0] || "");
  };

  const handleAddProduct = () => {
    if (selectedProduct && (selectedColor || !selectedProduct.colors.length) && (selectedSize || !selectedProduct.sizes.length)) {
      onAddProduct(selectedProduct, selectedColor, selectedSize);
      setSelectedProduct(null);
      setSelectedColor("");
      setSelectedSize("");
      setSearchResults([]);
      setSearchQuery("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-grow">
          <Search className="absolute top-3 right-3 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 py-6 text-base"
          />
          {isSearching && (
            <div className="absolute top-3 left-3">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {searchResults.length > 0 && (
        <Card className="overflow-hidden border-2 border-muted">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="text-right text-base font-cairo">المنتج</TableHead>
                  <TableHead className="text-right text-base font-cairo">السعر</TableHead>
                  <TableHead className="text-right text-base font-cairo w-20">إضافة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {searchResults.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-12 h-12 object-contain rounded-md"
                      />
                    </TableCell>
                    <TableCell className="font-medium text-base">{product.name}</TableCell>
                    <TableCell className="text-base">{product.price} ج.م</TableCell>
                    <TableCell>
                      <Button 
                        onClick={() => handleProductSelect(product)} 
                        size="sm"
                        variant="ghost"
                        className="h-10 w-10"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {selectedProduct && (
        <Card className="p-6 border-2 border-primary/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <h4 className="font-semibold mb-3 text-lg font-cairo">المنتج المحدد:</h4>
              <div className="flex items-center gap-3">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-14 h-14 object-contain rounded-md" />
                <span className="text-base">{selectedProduct.name} - {selectedProduct.price} ج.م</span>
              </div>
            </div>
            
            {selectedProduct.colors.length > 0 && (
              <div>
                <label className="font-semibold mb-3 block text-lg font-cairo">اللون:</label>
                <select 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full p-3 border rounded-md text-base"
                >
                  {selectedProduct.colors.map((color: string) => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}
            
            {selectedProduct.sizes.length > 0 && (
              <div>
                <label className="font-semibold mb-3 block text-lg font-cairo">المقاس:</label>
                <select 
                  value={selectedSize} 
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full p-3 border rounded-md text-base"
                >
                  {selectedProduct.sizes.map((size: string) => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="mt-5 flex justify-end">
            <Button onClick={handleAddProduct} className="text-base py-6 px-5">
              <Plus className="ml-2 h-5 w-5" />
              إضافة للطلب
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ProductSearch;
