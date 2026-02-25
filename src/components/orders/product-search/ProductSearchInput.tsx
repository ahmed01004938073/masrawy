
import React from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ProductSearchInputProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearching: boolean;
}

const ProductSearchInput: React.FC<ProductSearchInputProps> = ({ 
  searchQuery, 
  setSearchQuery, 
  isSearching 
}) => {
  return (
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
  );
};

export default ProductSearchInput;
