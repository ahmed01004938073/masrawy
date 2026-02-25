import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { getProducts, Product as ServiceProduct } from "@/services/productService";
import { toast } from "sonner";

// تعريف واجهة المنتج (متوافقة مع المتجر)
// تعريف واجهة المنتج (متوافقة مع المتجر)
export interface Product {
  id: string; // Changed to string
  name: string;
  price: number;
  image: string;
  images?: string[]; // Added images array
  colors: string[];
  sizes: string[]; // إضافة المقاسات
  stock: Record<string, number>;
  categoryId: string | number; // Allow both string and number
  category: string; // إضافة اسم القسم
  description?: string;
  driveLink?: string; // رابط صور المنتج
  sku?: string; // كود المنتج
  detailedVariants?: { color: string; size: string; quantity: number; }[]; // Granular stock
  sales_count?: number; // عدد المبيعات
  rating?: number; // التقييم
}

interface ProductsContextType {
  products: Product[];
  refreshProducts: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);

  const loadProducts = async () => {
    try {
      const response = await getProducts();
      const serviceProducts = Array.isArray(response) ? response : (response.data || []);

      // تحويل منتجات الخدمة (Dashboard) إلى شكل منتجات المتجر
      const mappedProducts: Product[] = serviceProducts
        .filter(p => !p.isHidden) // إخفاء المنتجات المخفية
        .map(p => {
          const stockPerColor: Record<string, number> = {};

          // Parse variants - handle both string and array formats
          let variants: string[] = ["Default"];
          try {
            if (p.variants) {
              // If variants is a string, parse it as JSON
              if (typeof p.variants === 'string') {
                variants = JSON.parse(p.variants);
              } else if (Array.isArray(p.variants) && p.variants.length > 0) {
                variants = p.variants;
              }
            }
          } catch (e) {
            console.warn(`Failed to parse variants for product ${p.name}:`, e);
            variants = ["Default"];
          }

          // 1. Initialize all variant stocks to 0
          variants.forEach(v => stockPerColor[v] = 0);

          // 2. If we have detailedVariants (Real Data), use them
          if (p.detailedVariants && Array.isArray(p.detailedVariants) && p.detailedVariants.length > 0) {
            try {
              p.detailedVariants.forEach(dv => {
                if (dv && dv.color) {
                  // Add quantity to the specific color
                  stockPerColor[dv.color] = (stockPerColor[dv.color] || 0) + (Number(dv.quantity) || 0);
                }
              });
            } catch (e) {
              console.warn("Stock mapping error:", e);
            }
          }
          // 3. Fallback: If no detailedVariants but we have total stock (Legacy/Simple products)
          else if (p.stock && p.stock > 0) {
            const stock = p.stock;
            const baseStock = Math.floor(stock / variants.length);
            let remainder = stock % variants.length;

            variants.forEach(v => {
              stockPerColor[v] = baseStock + (remainder > 0 ? 1 : 0);
              remainder--;
            });
          }

          // Use actual category from database (already joined by backend)
          const categoryName = p.category || "";

          return {
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.thumbnail,
            images: p.images || [], // Map images array
            colors: p.variants || [],
            sizes: p.sizes || [], // تمرير المقاسات
            stock: stockPerColor,
            categoryId: p.category_id || p.categoryId || 1,
            category: p.category || "غير مصنف", // تمرير اسم القسم
            description: p.description || "لا يوجد وصف",
            driveLink: p.driveLink || "", // تمرير رابط الدرايف
            sku: p.sku || "", // تمرير كود المنتج
            detailedVariants: p.detailedVariants, // Pass detailed variants for granular stock (Size/Color)
            sales_count: p.sales_count || 0, // تمرير عدد المبيعات
            rating: p.rating // تمرير التقييم
          };
        });

      setProducts(mappedProducts);

      // DEBUG: Log for user to see in browser console
      console.log("=== ProductsContext Debug ===");
      console.log(`Total products loaded: ${mappedProducts.length}`);
      if (mappedProducts.length > 0) {
        console.log("First product:", mappedProducts[0].name);
      } else {
        console.warn("⚠️  NO PRODUCTS LOADED! Check API response or filtering.");
      }

      if (mappedProducts.length === 0) {
        console.warn("DEBUG: No products mapped!");
        // Optional: Alert user if truly no products found
        // toast.warning("لم يتم العثور على منتجات في المتجر");
      }

    } catch (err) {
      console.error("CRITICAL ERROR IN LOAD PRODUCTS:", err);
      // Toast disabled - too annoying for users when multiple instances are running
      // The real fix is: USER MUST RUN ONLY ONE INSTANCE!
    }
  };

  useEffect(() => {
    // Initial fetch
    loadProducts();

    let intervalId: NodeJS.Timeout;

    const startPolling = () => {
      if (intervalId) clearInterval(intervalId);
      // Poll every 30 seconds (30000ms) for better performance
      // This reduces API calls and improves battery life on mobile devices
      intervalId = setInterval(loadProducts, 30000);
    };

    const stopPolling = () => {
      if (intervalId) clearInterval(intervalId);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Immediate update when user comes back
        loadProducts();
        startPolling();
      }
    };

    // الاستماع لحدث تحديث المنتجات
    const handleProductsUpdated = () => {
      loadProducts();
    };

    // الاستماع لأي تحديثات في التخزين (للمزامنة بين التبويبات)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "products") {
        loadProducts();
      }
    };

    // Start polling if visible
    if (!document.hidden) {
      startPolling();
    }

    window.addEventListener("products-updated", handleProductsUpdated);
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      window.removeEventListener("products-updated", handleProductsUpdated);
      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
    <ProductsContext.Provider value={{ products, refreshProducts: loadProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};
