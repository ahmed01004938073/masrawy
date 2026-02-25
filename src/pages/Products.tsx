
import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  FileCheck,
  ExternalLink,
  Package,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  Palette,
  LayoutGrid,
  List,
  ArrowUpDown,
  History,
  TrendingDown,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  ChevronDown,
  Image as ImageIcon
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { getProducts, deleteProduct, toggleProductVisibility, Product } from "@/services/productService";
import { getCategories } from "@/services/categoryService";
import { toast } from "sonner";
import { fixProductImages } from "@/services/imageFixService";
import { usePriceFormatter } from "@/hooks/usePriceFormatter";

// Product categories for filter dropdown - now dynamic
// const categories = ["الكل", "ملابس", "أحذية", "إكسسوارات", "حقائب", "إلكترونيات"];

const ITEMS_PER_PAGE = 20;

const Products = () => {
  const { formatPrice } = usePriceFormatter();
  const { hasPermission, trackAction } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("الكل");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [totalStock, setTotalStock] = useState(0);

  // Reset to first page when search, category or status changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStatus]);

  // useQuery for products with smart polling
  const { data: productResponse, refetch: refreshProducts, isLoading } = useQuery({
    queryKey: ["products", currentPage, searchTerm, selectedCategory, selectedStatus],
    queryFn: async () => {
      const response = await getProducts(
        currentPage,
        ITEMS_PER_PAGE,
        searchTerm,
        selectedCategory === "الكل" ? undefined : selectedCategory,
        selectedStatus === "all" ? undefined : selectedStatus
      );
      return response;
    },
    refetchInterval: 10000, // Smart Polling: 10s
  });

  const allProducts = Array.isArray(productResponse) ? productResponse : (productResponse?.data || []);

  // Fetch dynamic categories
  const { data: dynamicCategoriesResult = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const result = await getCategories();
      return Array.isArray(result) ? result : result.data;
    },
  });

  const dynamicCategories = Array.isArray(dynamicCategoriesResult) ? dynamicCategoriesResult : [];

  const filterCategories = ["الكل", ...dynamicCategories.map(c => c.name)];

  // تحديث الإحصائيات عند تحديث البيانات
  useEffect(() => {
    if (allProducts.length > 0) {
      fixProductImages();
    }

    if (productResponse && !Array.isArray(productResponse) && productResponse.stats) {
      setTotalStock(Number(productResponse.stats.totalStock || 0));
    }
  }, [allProducts, productResponse]);

  // Use the products from the response
  const displayedProducts = allProducts;

  // Calculate pagination locally if needed or use server data
  useEffect(() => {
    if (Array.isArray(productResponse)) {
      setTotalPages(Math.ceil(productResponse.length / ITEMS_PER_PAGE));
    } else if (productResponse?.totalPages) {
      setTotalPages(productResponse.totalPages);
    } else if (productResponse && !Array.isArray(productResponse)) {
      // Fallback for cases where totalPages might be missing but it's a paginated object
      setTotalPages(1);
    }
  }, [productResponse]);

  // Generate page numbers for pagination
  const getPaginationItems = () => {
    let pages = [];
    const maxVisiblePages = 5;

    // Always show first page
    pages.push(1);

    if (totalPages <= maxVisiblePages) {
      // If we have 5 or fewer pages, show them all
      for (let i = 2; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Complex pagination with ellipsis
      if (currentPage <= 3) {
        // Near the start
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        // Somewhere in the middle
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    return pages;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      // الحصول على المنتج قبل حذفه لتحديث إجمالي المخزون
      const product = allProducts.find(p => p.id === productToDelete);

      // حذف المنتج
      await deleteProduct(productToDelete);

      // تتبع الحركة
      trackAction("حذف منتج");

      // تحديث الكاش
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      // تحديث إجمالي المخزون
      if (product) {
        setTotalStock(prevTotal => prevTotal - product.stock);
      }
      toast.success("تم حذف المنتج بنجاح");
    } catch (error: any) {
      console.error("Error deleting product:", error);
      toast.error(error.message || "حدث خطأ أثناء حذف المنتج");
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const handleEditProduct = (id: string) => {
    navigate(`/admin/edit-product/${id}`);
  };

  // تبديل حالة إخفاء/إظهار المنتج
  const handleToggleVisibility = async (productId: string) => {
    try {
      const updatedProduct = await toggleProductVisibility(productId);
      if (updatedProduct) {
        await queryClient.invalidateQueries({ queryKey: ["products"] });

        // تتبع الحركة
        trackAction(updatedProduct.isHidden ? "إخفاء منتج" : "إظهار منتج");

        const status = updatedProduct.isHidden ? "مخفي من المتجر" : "ظاهر في المتجر";
        toast.success(`تم تغيير حالة المنتج إلى: ${status}`);
      }
    } catch (error) {
      console.error("Error toggling product visibility:", error);
      toast.error("حدث خطأ أثناء تغيير حالة المنتج");
    }
  };

  // تم إزالة وظائف عرض المنتج لأننا أزلنا الزر المرتبط بها

  const handleAddProduct = () => {
    navigate("/admin/products/add");
  };

  const canManageProducts = hasPermission("products", "edit") || hasPermission("all", "all");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">المنتجات</h1>
            <p className="text-muted-foreground">إدارة وعرض جميع منتجات المتجر</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {canManageProducts && (
              <>
                <Button variant="outline" onClick={() => navigate('/admin/manufacturers')} className="gap-2">
                  <Building2 className="h-4 w-4" />
                  إدارة المصانع
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/products/attributes')} className="gap-2">
                  <Palette className="h-4 w-4" />
                  سمات المنتجات
                </Button>
                <Button onClick={handleAddProduct}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة منتج
                </Button>
              </>
            )}
          </div>
        </div>

        {/* بطاقات إحصائية مستعادة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* إجمالي المنتجات */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">إجمالي المنتجات</p>
                  <h3 className="text-2xl font-bold">
                    {(!Array.isArray(productResponse) && productResponse?.stats?.totalProducts) || allProducts.length}
                  </h3>
                  <p className="text-xs text-blue-600 mt-1">منتج متاح في المتجر</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                  <Package className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إجمالي المخزون */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">إجمالي المخزون</p>
                  <h3 className="text-2xl font-bold">{totalStock}</h3>
                  <p className="text-xs text-green-600 mt-1">قطعة متاحة في المخزن</p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200">
                  <FileCheck className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المنتجات منخفضة المخزون */}
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600 mb-1">منخفض المخزون</p>
                  <h3 className="text-2xl font-bold">
                    {(!Array.isArray(productResponse) && productResponse?.stats?.lowStockCount) || 0}
                  </h3>
                  <p className="text-xs text-amber-600 mt-1">منتج يحتاج لتجديد المخزون</p>
                </div>
                <div className="h-12 w-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                  <AlertCircle className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* المنتجات المخفية */}
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600 mb-1">منتجات مخفية</p>
                  <h3 className="text-2xl font-bold">
                    {(!Array.isArray(productResponse) && productResponse?.stats?.hiddenCount) || 0}
                  </h3>
                  <p className="text-xs text-red-600 mt-1">منتج مخفي من المتجر</p>
                </div>
                <div className="h-12 w-12 bg-red-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <EyeOff className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardHeader>
            <CardTitle>قائمة المنتجات</CardTitle>
            <CardDescription>
              اعرض وأدر قائمة منتجاتك وتحكم في المخزون والأسعار
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* Search Bar - Takes larger width */}
                <div className="w-full md:flex-1 relative">
                  <Search className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="ابحث بالاسم أو المعرف..."
                    className="pr-10 h-10 w-full bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Category Filter */}
                <div className="w-full md:w-[200px] lg:w-[240px] relative">
                  <select
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white appearance-none text-sm font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer font-cairo hover:border-gray-300"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {filterCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <Filter className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Status Filter */}
                <div className="w-full md:w-[180px] lg:w-[200px] relative">
                  <select
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-gray-200 bg-gray-50/50 focus:bg-white appearance-none text-sm font-medium focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer font-cairo hover:border-gray-300"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    <option value="all">كل الحالات</option>
                    <option value="hidden">🚫 منتجات مخفية</option>
                    <option value="low-stock">📉 منخفض المخزون</option>
                  </select>
                  <AlertCircle className="absolute top-1/2 -translate-y-1/2 right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <ChevronDown className="absolute top-1/2 -translate-y-1/2 left-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setSelectedCategory("الكل");
                      setSelectedStatus("all");
                    }}
                    className="h-10 flex-1 md:flex-none hover:bg-gray-100 hover:text-red-600 transition-colors border-dashed px-4"
                    title="إعادة تعيين الفلاتر"
                  >
                    <History className="h-4 w-4 ml-2" />
                    إعادة ضبط
                  </Button>


                </div>
              </div>
            </div>

            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px] text-center">الصورة</TableHead>
                      <TableHead className="text-center">اسم المنتج</TableHead>
                      <TableHead className="text-center">كود المنتج</TableHead>
                      <TableHead className="text-center">رابط جوجل درايف</TableHead>
                      <TableHead className="text-center">سعر البيع</TableHead>
                      <TableHead className="text-center">سعر الجملة</TableHead>
                      <TableHead className="text-center">العمولة</TableHead>
                      <TableHead className="text-center">القسم</TableHead>
                      <TableHead className="text-center">المصنع</TableHead>
                      <TableHead className="text-center">المخزون</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                      {canManageProducts && <TableHead className="w-[120px] text-center">الإجراءات</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={canManageProducts ? 12 : 11} className="h-24 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <span>جاري تحميل المنتجات...</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : displayedProducts.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canManageProducts ? 12 : 11}
                          className="h-24 text-center"
                        >
                          لا توجد منتجات متطابقة مع البحث
                        </TableCell>
                      </TableRow>
                    ) : (
                      displayedProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <img
                                src={product.thumbnail}
                                alt={product.name}
                                className="w-10 h-10 rounded object-cover"
                                loading="lazy"
                              />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-center">
                            {product.name}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded">
                              {product.sku || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center">
                              <a
                                href={product.driveLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-500 hover:text-blue-700"
                              >
                                <ExternalLink className="h-3 w-3 ml-1" /> عرض المجلد
                              </a>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{formatPrice(product.price)} ج.م</TableCell>
                          <TableCell className="text-center">
                            {product.wholesalePrice > 0 ? `${formatPrice(product.wholesalePrice)} ج.م` : "-"}
                          </TableCell>
                          <TableCell className="text-center">{formatPrice(product.commission)} ج.م</TableCell>
                          <TableCell className="text-center">{product.category}</TableCell>
                          <TableCell className="text-center">{product.manufacturerName || "-"}</TableCell>
                          <TableCell className="text-center">
                            <span className={product.stock < 20 ? "text-red-500" : "text-green-600"}>
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleVisibility(product.id)}
                                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${product.isHidden
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                              >
                                {product.isHidden ? (
                                  <>
                                    <EyeOff className="h-3 w-3" />
                                    مخفي
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3" />
                                    ظاهر
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                          {canManageProducts && (
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditProduct(product.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-500 hover:text-red-600"
                                  onClick={() => handleDeleteClick(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent className="rtl overflow-hidden">
                <AlertDialogHeader className="text-right">
                  <AlertDialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    تأكيد الحذف
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-base py-2">
                    هل أنت متأكد من حذف هذا المنتج؟ هذا الإجراء سيقوم بحذف المنتج نهائياً من قاعدة البيانات ولا يمكن التراجع عنه.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse sm:flex-row-reverse gap-2 sm:gap-0 mt-4">
                  <AlertDialogCancel
                    onClick={() => setIsDeleteDialogOpen(false)}
                    className="mt-0 w-full sm:w-auto"
                  >
                    إلغاء
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                  >
                    نعم، احذف المنتج
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                        />
                      </PaginationItem>
                    )}

                    {getPaginationItems().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === '...' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            isActive={page === currentPage}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page as number);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Products;
