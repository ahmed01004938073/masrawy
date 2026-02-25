import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import SafeImage from '@/components/common/SafeImage';

interface Product {
  id: string;
  name: string;
  price: number;
  variants?: string[];
  sizes?: string[];
  thumbnail?: string;
  description?: string;
}

interface ProductSearchProps {
  products: Product[];
  value: string;
  onChange: (productId: string) => void;
  label?: string;
  className?: string;
}

const ProductSearch: React.FC<ProductSearchProps> = ({
  products,
  value,
  onChange,
  label,
  className,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Set initial search term based on selected product
  useEffect(() => {
    const selectedProduct = products.find(p => p.id === value);
    if (selectedProduct) {
      setSearchTerm(selectedProduct.name);
    } else {
      setSearchTerm('');
    }
  }, [value, products]);

  // Filter products based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    onChange(productId);
    setIsDropdownOpen(false);

    // Set focus back to input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => setIsDropdownOpen(true)}
          className="pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      </div>

      {isDropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredProducts.length === 0 ? (
            <div className="p-2 text-center text-gray-500">لا توجد منتجات مطابقة</div>
          ) : (
            filteredProducts.map(product => (
              <div
                key={product.id}
                className="flex items-center gap-2 p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSelectProduct(product.id)}
              >
                <div className="h-10 w-10 rounded-md overflow-hidden flex-shrink-0">
                  <SafeImage
                    src={product.thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=product${product.id}`}
                    alt={product.name}
                    className="h-full w-full object-cover"
                    fallbackSeed={`product${product.id}`}
                  />
                </div>
                <div className="flex-grow">
                  <div className="font-medium">{product.name}</div>
                  <div className="text-sm text-gray-500">
                    {product.price} ج.م
                    {product.variants?.length ? ` - ${product.variants.join(', ')}` : ''}
                    {product.sizes?.length ? ` - المقاسات: ${product.sizes.join(', ')}` : ''}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ProductSearch;
