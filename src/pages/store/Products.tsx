import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/store/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Eye,
  ShoppingCart,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Heart,
  Upload,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  TrendingUp,
  MessageCircle,
  Home,
  User,
  Wallet,
  PlusCircle,
  Zap,
  Star
} from "lucide-react";
import { useCart } from "@/contexts/store/CartContext";
import { useFavorites } from "@/contexts/store/FavoritesContext";
import { useProducts } from "@/contexts/store/ProductsContext";
import { useOrders } from "@/contexts/store/OrdersContext";
import { useUser } from "@/contexts/store/UserContext";
import { getMarketerById, getMarketers, getMarketerStats } from "@/services/marketerService";
import { getSiteSettings } from "@/services/siteSettingsService";
import { getCategories } from "@/services/categoryService";
import PriceDisplay from "@/components/store/PriceDisplay";
import CategorySection from "@/components/store/CategorySection";
import OrderStats from "@/components/store/OrderStats";
import StarRating from "@/components/store/StarRating";

import StoreFooter from "@/components/store/StoreFooter";

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { favorites, toggleFavorite, isFavorite } = useFavorites();
  const { products } = useProducts();
  const { orders } = useOrders(); // إضافة سياق الطلبات
  const { user } = useUser();
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20; // عدد المنتجات في كل صفحة
  const [productsLoading, setProductsLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const productsRef = useRef<HTMLDivElement>(null); // مرجع لقسم المنتجات

  // استخراج معرف القسم ونص البحث من عنوان URL
  const urlParams = new URLSearchParams(location.search);
  const categoryId = urlParams.get('category');
  const searchQuery = urlParams.get('search') || '';

  useEffect(() => {
    // Simulate initial loading for skeleton demo (remove if real loading is sufficient)
    const timer = setTimeout(() => setProductsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  // Reset page when filtering changes
  useEffect(() => {
    setCurrentPage(1);

    // Scroll to products if on mobile and a category is selected
    if (categoryId || searchQuery) {
      if (productsRef.current) {
        productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [categoryId, searchQuery]);

  // تحميل إعدادات الموقع
  const { data: settings } = useQuery({
    queryKey: ['site-settings'],
    queryFn: getSiteSettings,
  });

  // تحميل الأقسام الرسمية
  const { data: rawCategories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => getCategories(),
  });

  // تحميل إحصائيات المحفظة للمسوق
  const { data: marketerStats } = useQuery({
    queryKey: ['marketer-stats', user?.id],
    queryFn: () => getMarketerStats(user?.id || ""),
    enabled: !!user?.id,
  });

  const categories = useMemo(() => {
    if (Array.isArray(rawCategories)) return rawCategories;
    if (rawCategories && typeof rawCategories === 'object' && 'data' in rawCategories) {
      return (rawCategories as any).data || [];
    }
    return [];
  }, [rawCategories]);

  const bannerImage = settings?.storeBannerUrl || "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200";


  const isMobileHome = !categoryId && !searchQuery;

  // فلفترة المنتجات حسب القسم والبحث مع تحسين الأداء باستخدام useMemo
  const filteredProducts = useMemo(() => {
    let result = products;

    // تصفية المنتجات حسب القسم إذا تم تحديد قسم
    if (categoryId) {
      const searchCatOrig = categoryId.trim().toLowerCase();
      const searchCatNorm = searchCatOrig
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/ئ/g, 'ي')
        .replace(/ؤ/g, 'و');

      // Find official category to get its ID for fallback matching
      const officialCat = categories.find(c =>
        String(c.name || "").trim().toLowerCase() === searchCatOrig ||
        String(c.id || "").trim().toLowerCase() === searchCatOrig
      );

      result = result.filter(product => {
        const productCatOrig = String(product.category || "").trim().toLowerCase();
        const productCatNorm = productCatOrig
          .replace(/أ|إ|آ/g, 'ا')
          .replace(/ة/g, 'ه')
          .replace(/ى/g, 'ي')
          .replace(/ئ/g, 'ي')
          .replace(/ؤ/g, 'و');
        const productCatId = String(product.categoryId || "").trim().toLowerCase();

        return productCatNorm === searchCatNorm ||
          productCatId === searchCatOrig ||
          (officialCat && productCatId === String(officialCat.id).toLowerCase());
      });
    }

    // تصفية المنتجات حسب البحث
    if (searchQuery) {
      const lowerCaseQuery = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(lowerCaseQuery) ||
        (product.category && product.category.toLowerCase().includes(lowerCaseQuery))
      );
    }

    return result;
  }, [products, categoryId, searchQuery, categories]);

  // حساب إحصائيات الطلبات (للوحة الديسكطوب)
  const orderStats = useMemo(() => {
    return orders.reduce(
      (acc, order) => {
        const s = order.status;
        if (s === "pending" || (s as string) === "new") acc.pending++;
        else if (s === "processing" || s === "confirmed" || (s as string) === "warehouse") acc.processing++;
        else if (s === "shipped") acc.shipped++;
        else if (s === "in_delivery" || (s as string) === "out_for_delivery") acc.inDelivery++;
        else if (s === "delivered" || (s as string) === "completed") acc.completed++;
        else if (s === "cancelled" || (s as string) === "returned" || (s as string) === "rejected" || s === "delivery_rejected") acc.cancelled++;
        else if (s === "partially_delivered" || (s as string) === "partial") acc.partial++;
        return acc;
      },
      { pending: 0, processing: 0, shipped: 0, inDelivery: 0, completed: 0, cancelled: 0, partial: 0 }
    );
  }, [orders]);



  // حساب عدد الصفحات المطلوبة
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  // حساب المنتجات التي يجب عرضها في الصفحة الحالية
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);

  // DEBUG: Check sales count
  useEffect(() => {
    if (currentProducts.length > 0) {
      console.log("DEBUG: First Product Data:", {
        name: currentProducts[0].name,
        id: currentProducts[0].id,
        sales_count: currentProducts[0].sales_count,
        has_sales_prop: 'sales_count' in currentProducts[0]
      });
    }
  }, [currentProducts]);

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      quantity: 1,
      image: product.image,
      availableColors: product.colors,
      availableSizes: product.sizes && product.sizes.length > 0 ? product.sizes : ["Free Size"],
    });

    // Animation feedback
    setAddingToCart(product.id);
    setTimeout(() => setAddingToCart(null), 1000);
  };

  // تغيير الصفحة
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // الصفحة التالية
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // الصفحة السابقة
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // عند تغيير الصفحة، قم بتمرير الصفحة إلى الأعلى
  useEffect(() => {
    // التمرير إلى قسم المنتجات عند تغيير الصفحة
    if (productsRef.current) {
      productsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentPage]);

  // الحصول على اسم القسم من القائمة الرسمية
  const getCategoryName = useCallback((idOrName: string | number) => {
    const category = categories.find(cat =>
      cat.id === Number(idOrName) || cat.name === String(idOrName)
    );
    return category ? category.name : "جميع المنتجات";
  }, [categories]);

  // حساب إجمالي المخزون لكل منتج
  const getTotalStock = (product: typeof products[0]) => {
    return Object.values(product.stock).reduce((total, quantity) => total + quantity, 0);
  };

  // تجميع المنتجات حسب الأقسام (للعرض الأفقي في الموبايل)
  const productsByCategory = useMemo(() => {
    const grouped: Record<string, typeof products> = {};

    // جمع كل أسماء الأقسام من المنتجات
    const allProductCategories = Array.from(new Set(
      products.map(p => p.category?.trim()).filter(Boolean) as string[]
    ));

    // إنشاء خريطة للأقسام الرسمية (العرض فقط - الاسم المعياري -> الاسم الرسمي)
    const officialCategoryMap = new Map<string, string>();
    categories.filter(cat => cat.active).forEach(cat => {
      officialCategoryMap.set(cat.name.trim().toLowerCase(), cat.name.trim());
    });

    // تحديد قائمة الأقسام للعرض: الأقسام الموجودة في المنتجات باستخدام الأسماء الرسمية إن وجدت
    const categoryList = allProductCategories.map(productCat => {
      const normalized = productCat.toLowerCase();
      return officialCategoryMap.get(normalized) || productCat;
    });

    // إزالة التكرارات
    const uniqueCategoryList = Array.from(new Set(categoryList));

    // ترتيب الأقسام: الرسمية أولاً حسب order، ثم الباقي
    const officialCategories = categories
      .filter(cat => cat.active && cat.showInHomepage)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(cat => cat.name.trim());

    const orderedCategoryList = [
      ...officialCategories.filter(cat => uniqueCategoryList.includes(cat)),
      ...uniqueCategoryList.filter(cat =>
        !officialCategories.some(official => official.toLowerCase() === cat.toLowerCase())
      )
    ];

    orderedCategoryList.forEach(categoryName => {
      const categoryProducts = products.filter(p =>
        p.category?.trim().toLowerCase() === categoryName.toLowerCase()
      );
      if (categoryProducts.length > 0) {
        // ترتيب المنتجات داخل كل قسم (الأحدث أولاً) وأخذ أول 10
        grouped[categoryName] = [...categoryProducts]
          .sort((a, b) => Number(b.id) - Number(a.id))
          .slice(0, 10);
      }
    });

    return grouped;
  }, [products, categories]);


  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Navbar />




      {/* Products Grid */}
      {/* Main Content Area with Side-by-Side Layout */}
      <div ref={productsRef} className="max-w-[1440px] mx-auto px-0 md:px-6 pt-2 md:pt-8 pb-32 md:pb-8 relative z-10">
        {/* WhatsApp Chat Button */}
        {settings?.whatsappNumber && (
          <div className="fixed bottom-32 md:bottom-6 left-6 z-40">
            <a
              href={`https://wa.me/${settings.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 p-3 md:p-4"
            >
              <MessageCircle className="w-6 h-6 md:w-7 md:h-7" />
            </a>
          </div>
        )}

        <div className="flex flex-row items-start w-full min-h-screen relative">

          <div className="flex-1 w-full min-w-0 p-4 md:px-10 md:pt-0 md:pb-10">
            {/* Content Column (Banner, Stats, Categories, Products) */}
            <div className="flex-1 w-full overflow-hidden">
              {/* App Banner Wrapper */}
              <div className="relative transform hover:scale-[1.005] transition-transform duration-700 z-0">
                {bannerImage && (
                  <>
                    <div className="relative rounded-2xl md:rounded-[2.5rem] overflow-hidden h-36 md:h-72 shadow-xl border-4 border-white dark:border-zinc-900 mx-1 md:mx-0">
                      <img
                        src={bannerImage}
                        alt="Promotional Banner"
                        className="w-full h-full object-cover object-center transition-all duration-700 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      {/* Welcome Message - Hidden on Mobile to use the new Header Dashboard */}
                      {user?.name && (
                        <div className="hidden md:flex absolute top-2 right-2 md:top-6 md:right-8 z-20 animate-in fade-in slide-in-from-top-4 duration-700 group/welcome">
                          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-1.5 py-0.5 md:px-4 md:py-2 flex items-center gap-1 md:gap-3 shadow-2xl transition-all duration-500 hover:bg-white/20 hover:scale-105">
                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg transform transition-transform group-hover/welcome:rotate-12">
                              <User className="w-3.5 h-3.5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-[7.5px] md:text-xs text-white/70 font-bold uppercase tracking-widest leading-none mb-0.5">أهلاً بك</span>
                              <span className="text-[9px] md:text-base text-white font-black font-cairo drop-shadow-sm leading-none">{user.name} 👋</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Wallet Balance Message - Hidden on Mobile to use the new Header Dashboard */}
                      {user && (
                        <div className="hidden md:flex absolute top-2 left-2 md:top-6 md:left-8 z-20 animate-in fade-in slide-in-from-top-4 duration-700 delay-100 group/wallet">
                          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl px-1.5 py-0.5 md:px-4 md:py-2 flex items-center gap-1 md:gap-3 shadow-2xl transition-all duration-500 hover:bg-white/20 hover:scale-105">
                            <div className="w-6 h-6 md:w-10 md:h-10 rounded-lg bg-gradient-to-tr from-emerald-500 to-green-400 flex items-center justify-center shadow-lg transform transition-transform group-hover/wallet:-rotate-12">
                              <Wallet className="w-3.5 h-3.5 md:w-6 md:h-6 text-white" />
                            </div>
                            <div className="flex flex-col items-start leading-tight">
                              <span className="text-[7.5px] md:text-xs text-white/70 font-bold uppercase tracking-widest leading-none mb-0.5">رصيدك المتاح</span>
                              <span className="text-[9px] md:text-base text-white font-black font-cairo drop-shadow-sm leading-none">
                                {marketerStats?.available?.toLocaleString() || 0} <span className="text-[7px] md:text-[10px] opacity-80">ج.م</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Order Statistics Bar - Desktop ONLY */}
              <div className="hidden md:block relative z-20 px-2 md:px-0 mt-8 md:mt-12 mb-8">
                <OrderStats stats={orderStats} />
              </div>



              {/* Premium Categories Frame - Visible on Desktop, Hidden on Mobile */}
              <div className="hidden md:block relative z-10 px-4 md:px-0 pb-4 mt-8">
                <div className="w-full md:w-fit mx-auto bg-background dark:bg-zinc-900 rounded-3xl md:rounded-[2.5rem] p-3 md:p-3 border border-gray-100 dark:border-zinc-800 shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
                  {categories.length > 0 && (
                    <div className="overflow-x-auto no-scrollbar py-1">
                      <div className="flex justify-start md:justify-center gap-5 md:gap-8 min-w-max px-2 md:px-8">
                        {/* Home Button Desktop */}
                        <button onClick={() => navigate("/products")} className="flex flex-col items-center gap-2 group cursor-pointer">
                          <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center border transition-all duration-300 ${!categoryId ? "bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105" : "bg-gray-50/50 border-gray-100 group-hover:border-primary/50 text-gray-400"}`}>
                            <Home className="w-7 h-7 md:w-10 md:h-10 transition-transform group-hover:scale-110" />
                          </div>
                          <div className={`px-2.5 py-0.5 md:py-1 rounded-full shadow-sm transition-all duration-300 ${!categoryId ? "bg-amber-500 text-white scale-105" : "bg-gray-100/80 text-gray-600 group-hover:bg-amber-100 group-hover:text-amber-600"}`}>
                            <span className="text-[10px] md:text-xs font-bold transition-colors font-cairo whitespace-nowrap">الرئيسية</span>
                          </div>
                        </button>
                        {/* Categories Desktop */}
                        {categories.filter(cat => cat.active).map((category) => {
                          const isActive = categoryId === category.name;
                          return (
                            <button key={category.id} onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)} className="flex flex-col items-center gap-2 group cursor-pointer">
                              <div className={`w-14 h-14 md:w-20 md:h-20 rounded-full overflow-hidden border transition-all duration-500 relative ${isActive ? "border-amber-500 ring-2 md:ring-4 ring-amber-500/20 shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-110" : "border-gray-200/50 group-hover:border-amber-300"}`}>
                                <img src={category.imageUrl || `https://placehold.co/400x400/e2e8f0/1e293b?text=${encodeURIComponent(category.name)}`} alt={category.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className={`absolute inset-0 transition-opacity duration-500 ${isActive ? "bg-amber-500/10 opacity-100" : "bg-black/5 opacity-0 group-hover:opacity-100"}`} />
                              </div>
                              <div className={`px-2.5 md:px-3 py-0.5 md:py-1 rounded-full transition-all duration-500 ${isActive ? "bg-gradient-to-r from-amber-500 to-yellow-600 text-white scale-105 shadow-lg shadow-amber-500/20" : "text-gray-500 group-hover:text-amber-600"}`}>
                                <span className="text-[10px] md:text-sm font-black transition-all font-cairo line-clamp-1 max-w-[80px] md:max-w-[140px]">{category.name}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile "Browse Smart!" Header */}
              <div className="md:hidden flex items-center justify-between px-1 mb-4">
                <h3 className="text-sm font-black text-foreground font-cairo">تصفح بذكاء! ✨</h3>
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center">
                  <ChevronLeft className="w-4 h-4 text-slate-500" />
                </div>
              </div>

              {/* Mobile "Stories" Style Categories - Refined for App Feel */}
              <div className="md:hidden mb-6 overflow-x-auto no-scrollbar scroll-smooth">
                <div className="flex gap-4 px-1 py-2 min-w-max">
                  {/* Home Story Refined */}
                  <div
                    className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                    onClick={() => navigate("/products")}
                  >
                    <div className={`w-16 h-16 rounded-[2rem] p-[2px] flex items-center justify-center transition-all ${!categoryId ? "bg-gradient-to-tr from-emerald-500 to-green-400 p-[3px] shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-zinc-800"}`}>
                      <div className={`w-full h-full rounded-[1.8rem] flex items-center justify-center bg-white dark:bg-zinc-900 ${!categoryId ? "text-emerald-500" : "text-gray-400"}`}>
                        <Home className="w-6 h-6" />
                      </div>
                    </div>
                    <span className={`text-[10px] font-black font-cairo ${!categoryId ? "text-emerald-600" : "text-gray-500"}`}>الكل</span>
                  </div>

                  {/* Category Stories Refined */}
                  {categories.filter(cat => cat.active).map((category) => {
                    const isActive = categoryId === category.name;
                    return (
                      <div
                        key={category.id}
                        className="flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
                        onClick={() => navigate(`/products?category=${encodeURIComponent(category.name)}`)}
                      >
                        <div className={`w-16 h-16 rounded-[2rem] p-[2px] transition-all ${isActive ? "bg-gradient-to-tr from-emerald-500 to-green-400 p-[3px] shadow-lg shadow-emerald-500/20" : "bg-slate-100 dark:bg-zinc-800"}`}>
                          <div className="w-full h-full rounded-[1.8rem] overflow-hidden border-2 border-white dark:border-zinc-900 shadow-sm">
                            <img
                              src={category.imageUrl || `https://placehold.co/400x400/e2e8f0/1e293b?text=${encodeURIComponent(category.name)}`}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                        <span className={`text-[10px] font-black font-cairo line-clamp-1 max-w-[64px] text-center ${isActive ? "text-emerald-600" : "text-gray-500"}`}>
                          {category.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Products Gallery Section (Now scrolls along with Header) */}
              <div className="w-full">
                {/* Category-specific banner in View All mode */}
                {!isMobileHome && categoryId && settings?.categoryBanners?.[categoryId] && (
                  <div className="mb-8">
                    <div className="relative rounded-lg overflow-hidden shadow-sm h-32 md:h-48 w-full">
                      <img
                        src={settings.categoryBanners[categoryId]}
                        alt={categoryId}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/10" />
                    </div>
                  </div>
                )}

                {/* Products Gallery Section - Clean & Expanded Layout */}
                <div className="relative z-0">
                  {/* Aligned and Styled Title Section - Desktop Only - Refined Size */}
                  <div className="hidden md:flex mb-8 flex-col md:flex-row md:items-center gap-4 px-2">
                    <div className="w-fit bg-background/40 dark:bg-zinc-900/40 backdrop-blur-md rounded-2xl p-1.5 border border-gray-100 dark:border-zinc-800 shadow-sm transition-all duration-500 hover:shadow-emerald-500/5">
                      <div className="relative overflow-hidden bg-zinc-900 text-white rounded-xl px-6 py-2.5 shadow-lg group/title flex items-center gap-2.5">
                        <TrendingUp className="w-4 h-4 text-emerald-400 opacity-80" />
                        <h2 className="text-sm font-bold font-cairo relative z-10 tracking-wide">
                          {searchQuery
                            ? `نتائج البحث عن: "${searchQuery}"`
                            : categoryId
                              ? `منتجات ${categoryId}`
                              : "وصل حديثاً .. اكتشف جديدنا"}
                        </h2>
                        {/* Luxury Shine Effect */}
                        <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                    </div>
                    {(searchQuery || categoryId) && (
                      <div className="bg-white/50 dark:bg-zinc-900/20 rounded-xl px-4 py-2 border border-gray-100 dark:border-zinc-800/50">
                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 font-cairo">
                          {searchQuery
                            ? `عرض ${currentProducts.length} نتيجة`
                            : `عرض ${currentProducts.length} منتج في فئة ${categoryId}`}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Desktop View: Expanded Grid (Full Width) */}
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 md:gap-10 hidden md:grid mt-4 px-2">
                    {productsLoading ? (
                      // Skeletons for Desktop
                      Array.from({ length: 15 }).map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-background">
                          <div className="h-64 skeleton w-full" />
                          <div className="p-4 space-y-3">
                            <div className="h-4 skeleton w-3/4 rounded" />
                            <div className="h-4 skeleton w-1/2 rounded" />
                            <div className="h-8 skeleton w-full rounded mt-4" />
                          </div>
                        </div>
                      ))
                    ) : (
                      currentProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="group overflow-hidden card-hover-effect border-border/40 bg-background/50 backdrop-blur-sm rounded-2xl"
                        >
                          <div
                            className="relative overflow-hidden aspect-square cursor-pointer"
                            onClick={() => {
                              console.log("Navigating to product:", product.id);
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />

                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-3 right-3 bg-white/90 backdrop-blur-md hover:bg-white w-8 h-8 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(product.id);
                              }}
                            >
                              <Heart
                                className={`w-4 h-4 ${isFavorite(product.id)
                                  ? 'fill-rose-500 text-rose-500'
                                  : 'text-gray-600'
                                  }`}
                              />
                            </Button>
                            <div className="absolute top-3 left-3">
                              <Badge
                                className={`glass-badge text-[10px] px-2 py-1 backdrop-blur-md ${getTotalStock(product) > 10
                                  ? "bg-green-500/80 text-white"
                                  : getTotalStock(product) > 5
                                    ? "bg-yellow-500/80 text-white"
                                    : "bg-rose-500/80 text-white"
                                  }`}
                              >
                                {getTotalStock(product) > 0 ? `المخزون: ${getTotalStock(product)}` : 'نفذت الكمية'}
                              </Badge>
                            </div>
                          </div>

                          <CardContent className="p-3.5">
                            <h3 className="text-sm font-bold text-gray-800 mb-1 group-hover:text-primary transition-colors line-clamp-2 min-h-[40px] font-cairo">
                              {product.name}
                            </h3>

                            {/* Star Rating Desktop */}
                            <div className="mb-2 h-4">
                              <StarRating salesCount={product.sales_count || 0} rating={product.rating} />
                            </div>

                            <div className="flex flex-row items-center justify-between gap-1 mb-3 w-full">
                              <div className="flex flex-col items-center justify-center bg-blue-50/50 rounded-lg px-3 py-1 border border-blue-100 shadow-sm">
                                <span className="text-[10px] text-blue-600 font-bold mb-0.5 w-full text-center">السعر</span>
                                <div className="flex items-baseline gap-1">
                                  <div className="text-xl font-black text-blue-800 font-cairo">
                                    {Math.floor(product.price)}
                                  </div>
                                  <div className="text-xs text-blue-600 font-medium">
                                    جنيه
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-center bg-orange-500 rounded-lg px-2 py-1 shadow-sm h-full group/badge">
                                <span className="text-[10px] font-bold text-white relative z-10">عمولة مفتوحة</span>
                              </div>
                            </div>

                            <Button
                              className={`w-full text-sm font-bold h-10 transition-all duration-300 shadow-md relative group/btn ${addingToCart === product.id
                                ? "bg-emerald-600 text-white scale-95"
                                : "bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white border-0"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              disabled={addingToCart === product.id}
                            >
                              {addingToCart === product.id ? (
                                <div className="flex items-center gap-2 relative z-10">
                                  <CheckCircle className="w-4 h-4 animate-bounce" />
                                  <span>تمت الإضافة</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 relative z-10">
                                  <ShoppingCart className="w-4 h-4" />
                                  <span>إضافة للسلة</span>
                                </div>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Mobile View: List Layout (Hidden on Desktop) */}
                  <div className="md:hidden flex flex-col gap-3 pb-6 mt-4">
                    {productsLoading ? (
                      // Skeletons for Mobile
                      Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex flex-row h-32 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-background">
                          <div className="w-32 shrink-0 h-full skeleton" />
                          <div className="flex-1 p-3 space-y-2">
                            <div className="h-4 skeleton w-3/4 rounded" />
                            <div className="h-4 skeleton w-1/2 rounded" />
                            <div className="flex justify-between items-end mt-4">
                              <div className="h-6 skeleton w-12 rounded" />
                              <div className="h-8 skeleton w-8 rounded-lg" />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      currentProducts.map((product) => (
                        <Card
                          key={product.id}
                          className="group overflow-hidden card-hover-effect border-border/40 shadow-sm rounded-xl flex flex-row h-32 bg-white dark:bg-zinc-900"
                        >
                          {/* Image Section */}
                          <div
                            className="relative w-32 shrink-0 bg-gray-50 cursor-pointer overflow-hidden"
                            onClick={() => {
                              console.log("Navigating to product:", product.id);
                              navigate(`/product/${product.id}`);
                            }}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              loading="lazy"
                            />
                            {/* Fav Button - Mobile (On Image) */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(product.id);
                              }}
                              className="absolute top-1 right-1 bg-white/70 backdrop-blur-sm p-1.5 rounded-full shadow-sm text-gray-500 hover:text-rose-500 transition-colors z-10"
                            >
                              <Heart className={`w-3.5 h-3.5 ${isFavorite(product.id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>
                          </div>

                          {/* Details Section */}
                          <CardContent className="p-3 flex flex-col justify-between flex-1">
                            <div className="flex justify-between items-start w-full gap-2 mt-1">
                              <div className="flex flex-col gap-1 w-full text-right">
                                <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight font-cairo">
                                  {product.name}
                                </h3>
                                <StarRating salesCount={product.sales_count || 0} rating={product.rating} />
                              </div>
                              {/* Stock Display - Reverted to Details Area */}
                              <Badge
                                className={`shrink-0 text-[8.5px] px-2 py-0.5 h-auto flex border-0 ${getTotalStock(product) > 10
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                  : getTotalStock(product) > 5
                                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                    : "bg-rose-50 text-rose-700 hover:bg-rose-50"
                                  }`}
                              >
                                <span className="font-bold">المخزون: {getTotalStock(product)}</span>
                              </Badge>
                            </div>

                            <div className="flex items-end justify-between mt-auto">
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex flex-col items-center justify-center bg-blue-50/80 rounded-lg px-2 py-1 border border-blue-100 shadow-sm min-w-[50px]">
                                  <span className="text-[9px] text-blue-600 font-bold mb-0.5">السعر</span>
                                  <div className="flex items-baseline gap-0.5">
                                    <span className="text-sm font-extrabold text-blue-700 leading-none">
                                      {Math.floor(Number(product.price))}
                                    </span>
                                    <span className="text-[8px] text-blue-600 font-medium">
                                      جنيه
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Badge className="bg-orange-500 text-white border-none text-[8.5px] font-bold w-fit px-2 py-0.5 h-auto flex items-center justify-center whitespace-nowrap mx-auto shadow-sm">
                                <span>عمولة مفتوحة</span>
                              </Badge>

                              <Button size="icon"
                                className={`h-9 w-9 rounded-lg shadow-md active:scale-95 transition-all shrink-0 group/btn ${addingToCart === product.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-gradient-to-tr from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white"
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(product);
                                }}
                                disabled={addingToCart === product.id}
                              >
                                {addingToCart === product.id ? (
                                  <CheckCircle className="w-5 h-5 animate-bounce" />
                                ) : (
                                  <ShoppingCart className="w-5 h-5" />
                                )}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-10 gap-2 pb-10 md:pb-8">
                      <Button
                        onClick={prevPage}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>

                      {(() => {
                        const pages = [];
                        if (totalPages <= 7) {
                          for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                          for (let i = 1; i <= 5; i++) pages.push(i);
                          pages.push("...");
                          pages.push(totalPages);
                        }

                        return pages.map((page, index) => (
                          <Button
                            key={index}
                            onClick={() => typeof page === 'number' ? paginate(page) : null}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            className={`${currentPage === page ? "gradient-primary" : ""} ${typeof page !== 'number' ? "cursor-default hover:bg-transparent border-none" : ""}`}
                            disabled={typeof page !== 'number'}
                          >
                            {page}
                          </Button>
                        ));
                      })()}
                      <Button
                        onClick={nextPage}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Footer - Hidden on Mobile for App-like feel, visible on Desktop */}
      <div className="hidden md:block">
        <StoreFooter />
      </div>
    </div>
  );
};

export default Products;
