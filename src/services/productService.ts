import { API_URL } from "@/config/apiConfig";
import { fetchJson } from "@/utils/apiUtils";

export interface Product {
  id: string;
  name: string;
  driveLink: string;
  price: number;
  wholesalePrice: number;
  commission: number;
  category: string;
  sku?: string;
  category_id?: string | number; // For compatibility
  categoryId?: string | number;  // For compatibility
  variants: string[];
  sizes: string[];
  stock: number;
  thumbnail: string;
  images?: string[]; // Added images array
  description?: string;
  isHidden?: boolean;
  manufacturerId?: string;
  manufacturerName?: string;
  detailedVariants?: {
    color: string;
    size: string;
    quantity: number;
  }[];
  sales_count?: number;
  rating?: number;
}

// الحصول على المنتجات من API
export const getProducts = async (page?: number, limit?: number, search?: string, category?: string, status?: string): Promise<Product[] | { data: Product[], total: number, page: number, totalPages: number, stats?: { totalProducts: number, totalStock: number, lowStockCount: number, hiddenCount: number } }> => {
  try {
    let url = `${API_URL}/products?_t=${Date.now()}`;
    if (page && limit) {
      url += `&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (status) url += `&status=${encodeURIComponent(status)}`;
    }
    const response = await fetch(url, {
      headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '0' }
    });

    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();

    const mapItem = (item: any) => ({
      ...item,
      sku: item.sku || "",
      categoryId: item.category_id || item.categoryId, // Ensure ID is passed
      category_id: item.category_id,
      category: item.category || "غير مصنف", // backend already provides name or id here
      wholesalePrice: item.minSellingPrice || item.wholesalePrice || 0,
      thumbnail: item.thumbnail || item.image_url || "",
      images: typeof item.images === 'string' ? JSON.parse(item.images) : (item.images || []),
      variants: item.colors || item.variants || [],
      sizes: item.sizes || [],
      stock: Number(item.stock || item.quantity || 0),
      isHidden: item.isArchived === 1 || item.isHidden === true,
      manufacturerName: item.manufacturerName || "", // backend already provides name or id here
      detailedVariants: typeof item.detailedVariants === 'string'
        ? JSON.parse(item.detailedVariants)
        : (item.detailedVariants || []),
    });

    if (data.data && Array.isArray(data.data)) {
      return {
        ...data,
        data: data.data.map(mapItem)
      };
    }

    // Map backend fields to frontend interface (Legacy fallback)
    return data.map(mapItem);
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};



// الحصول على منتج محدد
export const getProductById = async (id: string): Promise<Product | undefined> => {
  const result = await getProducts();
  const products = Array.isArray(result) ? result : result.data;
  return products.find(product => product.id === id);
};

// إضافة منتج جديد
export const addProduct = async (product: Product): Promise<void> => {
  try {
    const payload = {
      ...product,
      sku: product.sku,
      quantity: product.stock,
      minSellingPrice: product.wholesalePrice,
      wholesalePrice: product.wholesalePrice,
      colors: product.variants,
      isArchived: product.isHidden ? 1 : 0,
      date: new Date().toISOString(),
      category_id: product.category, // Explicitly pass category ID
      categoryId: product.category   // Fallback key
    };

    // Remove frontend-only helper properties
    delete (payload as any).stock;
    delete (payload as any).isHidden;
    delete (payload as any).variants;

    // Use global fetchJson which handles token automatically
    await fetchJson(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    window.dispatchEvent(new Event('products-updated'));
  } catch (error) {
    console.error('Error adding product:', error);
  }
};

// تحديث منتج
export const updateProduct = async (updatedProduct: Product): Promise<Product> => {
  try {
    const oldProduct = await getProductById(updatedProduct.id);

    const payload = {
      ...updatedProduct,
      sku: updatedProduct.sku || (oldProduct?.sku) || "", // Maintain SKU from old if missing
      quantity: updatedProduct.stock,
      minSellingPrice: updatedProduct.wholesalePrice,
      wholesalePrice: updatedProduct.wholesalePrice,
      colors: updatedProduct.variants,
      isArchived: updatedProduct.isHidden ? 1 : 0,
      category_id: updatedProduct.category_id || updatedProduct.categoryId,
      categoryId: updatedProduct.category_id || updatedProduct.categoryId
    };

    console.log(`📡 Updating product ${updatedProduct.id} with SKU: ${payload.sku}`);

    // Remove frontend-only helper properties
    delete (payload as any).stock;
    delete (payload as any).isHidden;
    delete (payload as any).variants;

    // Use global fetchJson which handles token automatically
    await fetchJson(`${API_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    window.dispatchEvent(new Event('products-updated'));
    return updatedProduct;
  } catch (error) {
    console.error('Error updating product:', error);
    return updatedProduct;
  }
};

// حذف منتج
export const deleteProduct = async (id: string): Promise<void> => {
  try {
    console.log(`🗑️ Fetching delete for: ${API_URL}/products/${id}`);

    await fetchJson(`${API_URL}/products/${id}`, {
      method: 'DELETE'
    });

    window.dispatchEvent(new Event('products-updated'));
  } catch (error) {
    console.error('Error deleting product:', error);
  }
};

// تبديل حالة إخفاء المنتج
export const toggleProductVisibility = async (id: string): Promise<Product | null> => {
  const product = await getProductById(id);
  if (!product) return null;

  const updatedProduct = { ...product, isHidden: !product.isHidden };
  await updateProduct(updatedProduct);
  return updatedProduct;
};

// تهيئة المنتجات
export const initializeProducts = async (): Promise<void> => {
  const result = await getProducts();
  const products = Array.isArray(result) ? result : result.data;
  if (products.length === 0) {
    // Seed data if needed
  }
};

// خصم من المخزون


// زيادة المخزون (إرجاع)
export const increaseStock = async (
  id: string,
  quantity: number,
  color?: string,
  size?: string,
  productName?: string
): Promise<void> => {
  try {
    let product = await getProductById(id);

    // Fallback: Try finding by name if ID lookup fails
    if (!product && productName) {
      console.warn(`Product ID ${id} not found. Trying fallback by name: ${productName}`);
      const result = await getProducts();
      const allProducts = Array.isArray(result) ? result : result.data;
      product = allProducts.find(p => p.name.trim() === productName.trim());
    }

    if (!product) {
      console.error(`Error increaseStock: Product not found (ID: ${id}, Name: ${productName})`);
      return;
    }

    // Update total stock
    const newStock = product.stock + quantity;

    // Update variant-specific quantity if color and size are provided
    let updatedVariants = product.detailedVariants || [];

    if (color && size && updatedVariants.length > 0) {
      let variantFound = false;
      updatedVariants = updatedVariants.map(variant => {
        // Robust comparison: trim and case-insensitive
        const vColor = (variant.color || "").trim().toLowerCase();
        const vSize = (variant.size || "").trim().toLowerCase();
        const tColor = (color || "").trim().toLowerCase();
        const tSize = (size || "").trim().toLowerCase();

        if (vColor === tColor && vSize === tSize) {
          variantFound = true;
          return {
            ...variant,
            quantity: variant.quantity + quantity
          };
        }
        return variant;
      });

      if (!variantFound) {
        console.warn(`Variant not found for restoration: ${color}/${size} in product ${product.name}`);
      }
    }

    console.log(`Restoring stock for ${product.name}: Total ${newStock} (+${quantity})`);

    await updateProduct({
      ...product,
      sku: product.sku, // Explicitly pass SKU
      stock: newStock,
      detailedVariants: updatedVariants,
      isHidden: newStock > 0 ? false : product.isHidden, // Auto-restore if stock exists
      category_id: product.category_id || product.categoryId, // Ensure consistency
    });
  } catch (error) {
    console.error(`Error increasing stock for product ${id}:`, error);
  }
};
