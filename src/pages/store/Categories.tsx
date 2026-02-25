import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/store/Navbar";
import { getCategories } from "@/services/categoryService";
import { useProducts } from "@/contexts/store/ProductsContext";
import { ImageIcon } from "lucide-react";
import { useMemo } from "react";

// Robust Arabic normalization helper
const normalizeArabic = (text: any): string => {
  if (text === null || text === undefined) return "";
  const str = String(text).trim().toLowerCase();
  return str
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ئ/g, 'ي')
    .replace(/ؤ/g, 'و');
};

const Categories = () => {
  const navigate = useNavigate();
  const { products } = useProducts();

  // Load categories using React Query for caching and automatic updates
  const { data: rawCategories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const result = await getCategories();
      return Array.isArray(result) ? result : result.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Calculate product counts per category with memoization and normalization
  const categoriesWithCount = useMemo(() => {
    // Standardize category status filtering
    const activeCategories = rawCategories.filter((cat: any) =>
      cat.active === true || cat.active === 1 || cat.status === 'active' || cat.status === 'نشط'
    );

    return activeCategories.map((cat: any) => {
      const normalizedCatName = normalizeArabic(cat.name);
      const catIdString = String(cat.id || "");

      const count = products.filter(p => {
        if (p.isHidden) return false;

        // 1. Try matching by Category ID (Most reliable)
        const prodCatId = String(p.categoryId || "");
        if (catIdString && prodCatId === catIdString) return true;

        // 2. Fallback: Try matching by Category Name
        const normalizedProdCat = normalizeArabic(p.category || "");
        return normalizedProdCat === normalizedCatName;
      }).length;

      return {
        ...cat,
        productsCount: count
      };
    }).sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  }, [rawCategories, products]);

  const CategorySkeleton = () => (
    <div className="flex flex-col items-center">
      <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-muted animate-pulse mb-4" />
      <div className="h-6 w-24 bg-muted animate-pulse rounded mb-2" />
      <div className="h-4 w-32 bg-muted animate-pulse rounded opacity-50" />
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pb-24">
        <div className="mb-10 text-center md:text-right">
          <h1 className="text-4xl font-extrabold mb-3 font-cairo text-foreground">الأقسام</h1>
          <p className="text-muted-foreground font-medium">تصفح المنتجات حسب الفئة المتاحة</p>
        </div>

        {categoriesLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
            {Array.from({ length: 10 }).map((_, i) => (
              <CategorySkeleton key={i} />
            ))}
          </div>
        ) : categoriesWithCount.length === 0 ? (
          <div className="text-center py-16 bg-card/40 backdrop-blur-sm rounded-3xl border border-dashed border-muted-foreground/20">
            <div className="flex justify-center mb-6">
              <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground">لا توجد أقسام متاحة</h3>
            <p className="text-muted-foreground mt-2 max-w-xs mx-auto">لم يتم إضافة أي أقسام للمتجر بعد. يرجى العودة لاحقاً.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-10">
            {categoriesWithCount.map((category) => (
              <div
                key={category.id}
                className="group flex flex-col items-center cursor-pointer"
                onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
              >
                {/* Image Container */}
                <div className="relative w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 rounded-full blur-xl group-hover:blur-2xl group-hover:scale-110 transition-all duration-500" />

                  <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-background shadow-2xl group-hover:shadow-emerald-500/20 group-hover:scale-105 transition-all duration-500 ring-1 ring-border/50">
                    <img
                      src={category.imageUrl ? category.imageUrl : `https://placehold.co/400x400/e2e8f0/1e293b?text=${encodeURIComponent(category.name)}`}
                      alt={category.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />

                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-white font-bold text-sm bg-emerald-600/80 px-4 py-1.5 rounded-full backdrop-blur-md shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        تصفح
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Badge */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white dark:bg-zinc-900 text-[10px] font-black text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full shadow-xl border border-emerald-100 dark:border-emerald-900/30 whitespace-nowrap z-10 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {category.productsCount} منتج
                  </div>
                </div>

                {/* Content */}
                <div className="text-center group-hover:translate-y-[-4px] transition-all duration-300">
                  <h3 className="font-bold text-lg text-foreground group-hover:text-emerald-600 transition-colors font-cairo">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1.5 max-w-[160px] mx-auto opacity-80 font-medium">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Categories;
