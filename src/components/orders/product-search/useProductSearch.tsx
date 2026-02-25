
import { useState, useEffect } from "react";

// Mock products for demonstration (moved from the original component)
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

export const useProductSearch = () => {
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

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    selectedProduct,
    setSelectedProduct,
    selectedColor,
    setSelectedColor,
    selectedSize,
    setSelectedSize,
    isSearching
  };
};
