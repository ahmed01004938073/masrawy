import React from 'react';
import { Combobox } from '@/components/ui/combobox';
import { Label } from '@/components/ui/label';

interface Product {
  id: string;
  name: string;
  price: number;
  variants?: string[];
  sizes?: string[];
  thumbnail?: string;
  description?: string;
}

interface ProductComboboxProps {
  products: Product[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

const ProductCombobox: React.FC<ProductComboboxProps> = ({
  products,
  value,
  onChange,
  label,
  className,
}) => {
  const options = products.map(product => ({
    value: product.id,
    label: product.name,
    image: product.thumbnail || `https://api.dicebear.com/7.x/shapes/svg?seed=product${product.id}`,
    description: `${product.price} ج.م${product.variants?.length ? ` - ${product.variants.join(', ')}` : ''}${product.sizes?.length ? ` - المقاسات: ${product.sizes.join(', ')}` : ''}`,
  }));

  return (
    <div className={className}>
      {label && <Label className="mb-2 block">{label}</Label>}
      <Combobox
        options={options}
        value={value}
        onChange={onChange}
        placeholder="اختر منتج..."
        emptyText="لا توجد منتجات مطابقة"
        searchPlaceholder="ابحث عن منتج..."
      />
    </div>
  );
};

export default ProductCombobox;
