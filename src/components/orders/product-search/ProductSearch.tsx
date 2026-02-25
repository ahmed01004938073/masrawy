
import React, { useState } from "react";
import { OrderItem } from "@/pages/Orders";
import ProductSearchInput from "./ProductSearchInput";
import SearchResults from "./SearchResults";
import SelectedProduct from "./SelectedProduct";
import { useProductSearch } from "./useProductSearch";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface ProductSearchProps {
  orderItems: OrderItem[];
  onAddProduct: (product: any, color: string, size: string, quantity: number, price: number) => void;
}

const ProductSearch: React.FC<ProductSearchProps> = ({ orderItems, onAddProduct }) => {
  const {
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
  } = useProductSearch();

  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

  const handleProductSelect = (product: any) => {
    setSelectedProduct(product);
    setSelectedColor(product.colors[0] || "");
    setSelectedSize(product.sizes[0] || "");
    setPrice(product.price);
    setQuantity(1);
  };

  const handleAddProduct = () => {
    if (selectedProduct && (selectedColor || !selectedProduct.colors.length) && (selectedSize || !selectedProduct.sizes.length)) {
      onAddProduct(selectedProduct, selectedColor, selectedSize, quantity, price);
      setSelectedProduct(null);
      setSelectedColor("");
      setSelectedSize("");
      setSearchQuery("");
      setQuantity(1);
      setPrice(0);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <ProductSearchInput 
          searchQuery={searchQuery} 
          setSearchQuery={setSearchQuery} 
          isSearching={isSearching} 
        />
        <Button
          onClick={() => setSearchQuery(searchQuery || " ")}
          className="flex items-center gap-2 h-10"
          variant="outline"
        >
          <Plus className="h-5 w-5" />
          إضافة منتج
        </Button>
      </div>

      {(searchResults.length > 0 || searchQuery.trim()) && (
        <SearchResults 
          searchResults={searchResults} 
          handleProductSelect={handleProductSelect} 
        />
      )}

      {selectedProduct && (
        <SelectedProduct 
          selectedProduct={selectedProduct}
          selectedColor={selectedColor}
          setSelectedColor={setSelectedColor}
          selectedSize={selectedSize}
          setSelectedSize={setSelectedSize}
          handleAddProduct={handleAddProduct}
          quantity={quantity}
          setQuantity={setQuantity}
          price={price}
          setPrice={setPrice}
        />
      )}
    </div>
  );
};

export default ProductSearch;
