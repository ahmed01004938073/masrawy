
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SelectedProductProps {
  selectedProduct: any;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
  selectedSize: string;
  setSelectedSize: (size: string) => void;
  handleAddProduct: () => void;
  quantity?: number;
  setQuantity?: (quantity: number) => void;
  price?: number;
  setPrice?: (price: number) => void;
}

interface ProductState {
  price: number;
  quantity: number;
}

const SelectedProduct: React.FC<SelectedProductProps> = ({ 
  selectedProduct,
  selectedColor,
  setSelectedColor,
  selectedSize,
  setSelectedSize,
  handleAddProduct,
  quantity = 1,
  setQuantity = () => {},
  price,
  setPrice = () => {}
}) => {
  const [productState, setProductState] = React.useState<ProductState>({
    price: selectedProduct.price,
    quantity: 1
  });
  return (
    <Card className="p-6 border-2 border-primary/20">
      <div className="mb-6">
        <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-contain rounded-lg border-2 border-primary/10" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <div>
          <h4 className="font-semibold mb-3 text-lg font-cairo">المنتج المحدد:</h4>
          <div className="flex items-center gap-3">
            <img src={selectedProduct.image} alt={selectedProduct.name} className="w-14 h-14 object-contain rounded-md" />
            <span className="text-base">{selectedProduct.name}</span>
          </div>
        </div>

        <div>
          <label className="font-semibold mb-3 block text-lg font-cairo">السعر:</label>
          <input
            type="number"
            value={productState.price}
            onChange={(e) => setProductState(prev => ({ ...prev, price: Number(e.target.value) }))}
            className="w-full p-3 border rounded-md text-base"
            min="0"
          />
        </div>

        <div>
          <label className="font-semibold mb-3 block text-lg font-cairo">الكمية:</label>
          <input
            type="number"
            value={productState.quantity}
            onChange={(e) => setProductState(prev => ({ ...prev, quantity: Number(e.target.value) }))}
            className="w-full p-3 border rounded-md text-base"
            min="1"
          />
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
      
      <div>
        <label className="font-semibold mb-3 block text-lg font-cairo">الكمية:</label>
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          min="1"
          className="w-full p-3 border rounded-md text-base"
        />
      </div>

      <div>
        <label className="font-semibold mb-3 block text-lg font-cairo">السعر:</label>
        <input
          type="number"
          value={price || selectedProduct.price}
          onChange={(e) => setPrice(parseFloat(e.target.value) || selectedProduct.price)}
          min="0"
          step="0.01"
          className="w-full p-3 border rounded-md text-base"
        />
      </div>

      <div className="mt-5 flex justify-end col-span-full">
        <Button onClick={handleAddProduct} className="text-base py-6 px-5">
          <Plus className="ml-2 h-5 w-5" />
          إضافة للطلب
        </Button>
      </div>
    </Card>
  );
};

export default SelectedProduct;
