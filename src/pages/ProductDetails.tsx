import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ProductMessages from '@/components/products/ProductMessages';
import SafeImage from '@/components/common/SafeImage';

interface Product {
  id: string;
  name: string;
  driveLink: string;
  price: number;
  wholesalePrice: number;
  commission: number;
  category: string;
  variants: string[];
  sizes: string[];
  stock: number;
  thumbnail: string;
  marketerId?: string;
  marketerName?: string;
}

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // في التطبيق الحقيقي، سنقوم بجلب بيانات المنتج من API
  const product: Product = {
    id: id || '1',
    name: 'قميص أنيق',
    driveLink: 'https://drive.google.com/folder/d/example1',
    price: 299,
    wholesalePrice: 250,
    commission: 25,
    category: 'ملابس',
    variants: ['أحمر', 'أزرق', 'أبيض'],
    sizes: ['S', 'M', 'L', 'XL'],
    stock: 45,
    thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=product1',
    marketerId: 'm2',
    marketerName: 'فاطمة حسن',
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <SafeImage
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-full h-auto rounded-lg shadow-lg"
                  fallbackSeed={product.id}
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">التفاصيل</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">سعر البيع</p>
                      <p className="font-semibold">{Math.floor(product.price)} ج.م</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">سعر الجملة</p>
                      <p className="font-semibold">{product.wholesalePrice} ج.م</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">العمولة</p>
                      <p className="font-semibold">{product.commission} ج.م</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">المخزون</p>
                      <p className="font-semibold">{product.stock} قطعة</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">الألوان المتاحة</h3>
                  <div className="flex gap-2">
                    {product.variants.map((variant) => (
                      <Badge key={variant} variant="secondary">
                        {variant}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">المقاسات المتاحة</h3>
                  <div className="flex gap-2">
                    {product.sizes.map((size) => (
                      <Badge key={size} variant="outline">
                        {size}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">الفئة</h3>
                  <Badge variant="secondary">{product.category}</Badge>
                </div>

                <div className="pt-4">
                  <Button
                    className="w-full"
                    onClick={() => window.open(product.driveLink, '_blank')}
                  >
                    عرض الصور في Google Drive
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Product Messages Component */}
        <div className="mt-6">
          <ProductMessages
            productId={product.id}
            marketerId={product.marketerId}
            marketerName={product.marketerName}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProductDetails;