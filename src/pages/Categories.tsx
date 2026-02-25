
import React, { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Plus, Trash2, UploadCloud, Image as ImageIcon, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategories, addCategory, updateCategory, deleteCategory, toggleCategoryActive, Category } from "@/services/categoryService";
import { getProducts } from "@/services/productService";
import { fixCategoryImages } from "@/services/imageFixService";

const Categories = () => {
  const { toast } = useToast();
  const { trackAction } = useAuth();

  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [newCategoryOrder, setNewCategoryOrder] = useState<number>(0);
  const [newCategoryShowInHomepage, setNewCategoryShowInHomepage] = useState(true);
  const [newCategorySlug, setNewCategorySlug] = useState("");
  const [newCategorySeoTitle, setNewCategorySeoTitle] = useState("");
  const [newCategorySeoDescription, setNewCategorySeoDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false); // For mutations

  const [activeTab, setActiveTab] = useState("active");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editSelectedImage, setEditSelectedImage] = useState<string | null>(null);

  // حالة تبويب الإعدادات المتقدمة
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // useQuery for categories
  const { data: categoriesResponse, isLoading: isDataLoading } = useQuery({
    queryKey: ["categories", currentPage],
    queryFn: async () => {
      return getCategories(currentPage, ITEMS_PER_PAGE);
    },
    refetchInterval: 10000,
  });

  const categories = Array.isArray(categoriesResponse) ? categoriesResponse : (categoriesResponse?.data || []);
  const totalPages = Array.isArray(categoriesResponse) ? Math.ceil(categoriesResponse.length / ITEMS_PER_PAGE) : (categoriesResponse?.totalPages || 1);

  // Debug: Log categories to see if there are duplicates from server
  useEffect(() => {
    if (categories.length > 0) {
      console.log(`📊 Categories loaded: ${categories.length}`, categories.map(c => `ID:${c.id}, A:${c.active}, S:${c.status}`));
    }
  }, [categories]);

  const filteredCategories = categories.filter(cat => {
    const isActive = cat.active === true || cat.active === (1 as any) || cat.status === 'active';
    return activeTab === "active" ? isActive : !isActive;
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم القسم",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // إنشاء slug تلقائي إذا لم يتم إدخاله
      const slug = newCategorySlug.trim() || newCategoryName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-') // استبدال المسافات بشرطات
        .replace(/[^\w\u0621-\u064A-]/g, '') // إزالة الأحرف الخاصة مع الاحتفاظ بالأحرف العربية
        .replace(/--+/g, '-'); // استبدال الشرطات المتعددة بشرطة واحدة

      // إنشاء عنوان SEO تلقائي إذا لم يتم إدخاله
      const seoTitle = newCategorySeoTitle.trim() || newCategoryName.trim();

      // إنشاء وصف SEO تلقائي إذا لم يتم إدخاله
      const seoDescription = newCategorySeoDescription.trim() ||
        (newCategoryDescription.trim() ? newCategoryDescription.trim() : `تسوق منتجات ${newCategoryName} بأفضل الأسعار`);

      // الحصول على أعلى ترتيب موجود وإضافة 1 إليه
      const maxOrder = categories.length > 0
        ? Math.max(...categories.map(c => c.order || 0))
        : 0;
      const order = newCategoryOrder > 0 ? newCategoryOrder : maxOrder + 1;

      const newCategoryData: Omit<Category, 'id'> = {
        name: newCategoryName,
        description: newCategoryDescription,
        imageUrl: selectedImage || `https://placehold.co/200x200/3b82f6/ffffff?text=${encodeURIComponent(newCategoryName)}`,
        productsCount: 0,
        active: true,
        status: 'active' as const,
        order: order,
        showInHomepage: newCategoryShowInHomepage,
        slug: slug,
        seoTitle: seoTitle,
        seoDescription: seoDescription
      };

      const addedCategory = await addCategory(newCategoryData);

      // تتبع الحركة
      trackAction("إضافة قسم جديد");

      await queryClient.invalidateQueries({ queryKey: ["categories"] });

      // إعادة تعيين الحقول
      setNewCategoryName("");
      setNewCategoryDescription("");
      setNewCategoryOrder(0);
      setNewCategoryShowInHomepage(true);
      setNewCategorySlug("");
      setNewCategorySeoTitle("");
      setNewCategorySeoDescription("");
      setSelectedImage(null);
      setShowAdvancedSettings(false);
      setIsAddDialogOpen(false);

      toast({
        title: "تم بنجاح",
        description: "تم إضافة القسم الجديد",
      });
    } catch (error) {
      console.error("Error adding category:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة القسم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory || !newCategoryName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم القسم",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // إنشاء slug تلقائي إذا لم يتم إدخاله
      const slug = newCategorySlug.trim() || newCategoryName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\u0621-\u064A-]/g, '')
        .replace(/--+/g, '-');

      const seoTitle = newCategorySeoTitle.trim() || newCategoryName.trim();

      const seoDescription = newCategorySeoDescription.trim() ||
        (newCategoryDescription.trim() ? newCategoryDescription.trim() : `تسوق منتجات ${newCategoryName} بأفضل الأسعار`);

      // تحديد الصورة الجديدة
      let newImageUrl = selectedCategory.imageUrl;

      if (editSelectedImage === null) {
        newImageUrl = `https://placehold.co/200x200/3b82f6/ffffff?text=${encodeURIComponent(newCategoryName)}`;
      } else if (editSelectedImage && editSelectedImage !== selectedCategory.imageUrl) {
        newImageUrl = editSelectedImage;
      }

      const updatedData = {
        ...selectedCategory,
        name: newCategoryName,
        description: newCategoryDescription,
        imageUrl: newImageUrl,
        order: newCategoryOrder > 0 ? newCategoryOrder : selectedCategory.order,
        showInHomepage: newCategoryShowInHomepage,
        slug: slug,
        seoTitle: seoTitle,
        seoDescription: seoDescription
      };

      const result = await updateCategory(updatedData);

      if (result) {
        // تتبع الحركة
        trackAction(`تعديل قسم (${newCategoryName})`);

        await queryClient.invalidateQueries({ queryKey: ["categories"] });

        // Re-reset
        setNewCategoryName("");
        setNewCategoryDescription("");
        setNewCategoryOrder(0);
        setNewCategoryShowInHomepage(true);
        setNewCategorySlug("");
        setNewCategorySeoTitle("");
        setNewCategorySeoDescription("");
        setEditSelectedImage(null);
        setShowAdvancedSettings(false);
        setIsEditDialogOpen(false);
        setSelectedCategory(null);

        toast({
          title: "تم بنجاح",
          description: "تم تعديل القسم",
        });
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تعديل القسم",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (id: number) => { // This is actually deactivate
    setIsLoading(true);
    try {
      const result = await toggleCategoryActive(id, false);
      if (result) {
        // تتبع الحركة
        trackAction("إلغاء تنشيط قسم");

        await queryClient.invalidateQueries({ queryKey: ["categories"], refetchType: 'all' });
        toast({
          title: "تم بنجاح",
          description: "تم إلغاء تنشيط القسم",
        });
      }
    } catch (error) {
      console.error("Deactivate Error:", error);
      toast({
        title: "خطأ",
        description: "فشل إلغاء التنشيط. راجع وحدة التحكم للتفاصيل.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateCategory = async (id: number) => {
    setIsLoading(true);
    try {
      const result = await toggleCategoryActive(id, true);
      if (result) {
        // تتبع الحركة
        trackAction("تنشيط قسم");

        await queryClient.invalidateQueries({ queryKey: ["categories"], refetchType: 'all' });
        toast({
          title: "تم بنجاح",
          description: "تم تنشيط القسم",
        });
      }
    } catch (error) {
      console.error("Activate Error:", error);
      toast({
        title: "خطأ",
        description: "فشل تنشيط القسم. راجع وحدة التحكم للتفاصيل.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };


  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setIsDeleteDialogOpen(true);
  };

  // حذف القسم نهائياً
  const handlePermanentDeleteCategory = async () => {
    if (categoryToDelete) {
      setIsLoading(true);
      try {
        const success = await deleteCategory(categoryToDelete.id);
        if (success) {
          // تتبع الحركة
          trackAction(`حذف قسم نهائياً (${categoryToDelete.name})`);

          await queryClient.invalidateQueries({ queryKey: ["categories"] });
          toast({
            title: "تم بنجاح",
            description: `تم حذف قسم "${categoryToDelete.name}" نهائياً`,
          });
          setIsDeleteDialogOpen(false);
          setCategoryToDelete(null);
        }
      } catch (error) {
        toast({ title: "خطأ", description: "فشل حذف القسم", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setCategoryToDelete(null);
  };


  const openEditDialog = (category: Category) => {
    setSelectedCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || "");
    setNewCategoryOrder(category.order || 0);
    setNewCategoryShowInHomepage(category.showInHomepage || false);
    setNewCategorySlug(category.slug || "");
    setNewCategorySeoTitle(category.seoTitle || "");
    setNewCategorySeoDescription(category.seoDescription || "");
    setEditSelectedImage(category.imageUrl);
    setIsEditDialogOpen(true);
  };

  // Handle file selection for new category
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setSelectedImage(event.target.result as string);
        }
      };

      reader.readAsDataURL(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle file selection for edit category
  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setEditSelectedImage(event.target.result as string);
        }
      };

      reader.readAsDataURL(file);
      if (editFileInputRef.current) editFileInputRef.current.value = "";
    }
  };

  const handleImageUploadClick = () => fileInputRef.current?.click();
  const handleEditImageUploadClick = () => editFileInputRef.current?.click();
  const clearSelectedImage = () => setSelectedImage(null);
  const clearEditSelectedImage = () => setEditSelectedImage(null);

  return (
    <DashboardLayout>
      <div className="flex flex-col space-y-8">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">أقسام المنتجات</h2>
            <p className="text-muted-foreground mt-2">
              إدارة أقسام المنتجات في المتجر
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)} className="mt-4 md:mt-0">
            <Plus className="ml-2 h-4 w-4" />
            إضافة قسم جديد
          </Button>
        </div>

        <Card>
          <CardHeader>
            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="active">الأقسام النشطة ({categories.filter(c => c.active === true || c.active === (1 as any) || c.status === 'active').length})</TabsTrigger>
                <TabsTrigger value="inactive">الأقسام غير النشطة ({categories.filter(c => !(c.active === true || c.active === (1 as any) || c.status === 'active')).length})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0 bg-gray-50/30 min-h-[500px]">
            {isDataLoading && filteredCategories.length === 0 ? (
              <div className="flex justify-center items-center h-60">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-20">
                <div className="bg-white p-6 rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-sm mb-6">
                  <ImageIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">لا توجد أقسام</h3>
                <p className="mt-2 text-gray-500 max-w-sm mx-auto">
                  {activeTab === "active"
                    ? "لم يتم إضافة أي أقسام نشطة بعد. ابدأ بإضافة قسم جديد لعرض منتجاتك."
                    : "سلة المحذوفات فارغة. الأقسام التي يتم إلغاء تنشيطها ستظهر هنا."}
                </p>
                {activeTab === "active" && (
                  <Button onClick={() => setIsAddDialogOpen(true)} className="mt-8 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8">
                    <Plus className="ml-2 h-4 w-4" />
                    إضافة قسم جديد
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6">
                  {filteredCategories.map(category => (
                    <Card key={category.id} className="group overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 flex flex-col h-full bg-white relative">
                      {/* Image Section */}
                      <div className="relative h-48 w-full overflow-hidden">
                        <div className="absolute inset-0 bg-gray-200" />
                        <img
                          src={category.imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/600x400/e2e8f0/1e293b?text=${encodeURIComponent(category.name)}`;
                          }}
                        />

                        {/* Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                        <div className="absolute top-3 right-3 flex gap-2">
                          <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {category.productsCount} منتج
                          </div>
                        </div>

                        {category.showInHomepage && (
                          <div className="absolute top-3 left-3">
                            <div className="bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              الرئيسية
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Content Section */}
                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                            {category.name}
                          </h3>
                          {category.order > 0 && (
                            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded border">
                              #{category.order}
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                          {category.description || "لا يوجد وصف لهذا القسم."}
                        </p>

                        <div className="flex items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-100">
                          <div className="flex gap-2 flex-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                              disabled={isLoading}
                              className="flex-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 font-medium h-9"
                            >
                              <Pencil className="h-4 w-4 ml-1.5" />
                              تعديل
                            </Button>

                            {activeTab === "active" ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteCategory(category.id);
                                }}
                                disabled={isLoading}
                                className="flex-1 bg-amber-50 text-amber-600 hover:bg-amber-100 hover:text-amber-700 font-medium h-9"
                              >
                                <Trash2 className="h-4 w-4 ml-1.5" />
                                إلغاء التنشيط
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleActivateCategory(category.id);
                                }}
                                disabled={isLoading}
                                className="flex-1 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700 font-medium h-9"
                              >
                                <Check className="h-4 w-4 ml-1.5" />
                                تنشيط
                              </Button>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(category)}
                            disabled={isLoading}
                            className="w-9 h-9 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-md shrink-0"
                            title="حذف نهائي"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>

                      {/* Active Indicator Bar */}
                      <div className={`h-1 w-full ${(category.active === true || category.status === 'active') ? 'bg-blue-500' : 'bg-gray-300'}`} />
                    </Card>
                  ))}
                </div>
                <div className="p-6 pt-0">
                  <div className="flex flex-col items-center justify-center space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(prev => Math.max(1, prev - 1));
                          window.scrollTo(0, 0);
                        }}
                        disabled={currentPage === 1}
                      >
                        السابق
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => {
                              setCurrentPage(pageNum);
                              window.scrollTo(0, 0);
                            }}
                            className={currentPage === pageNum ? "bg-blue-600 hover:bg-blue-700" : ""}
                          >
                            {pageNum}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCurrentPage(prev => Math.min(totalPages, prev + 1));
                          window.scrollTo(0, 0);
                        }}
                        disabled={currentPage === totalPages}
                      >
                        التالي
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      صفحة {currentPage} من {totalPages}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>إضافة قسم جديد</DialogTitle>
            <DialogDescription>
              أدخل تفاصيل القسم الجديد أدناه. اختر اسماً واضحاً ومعبراً.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Fields remain mostly same but wrapped in loading check if needed, mostly handled by button disabled state */}
            <div className="space-y-2">
              <Label htmlFor="name">اسم القسم</Label>
              <Input
                id="name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="مثال: ملابس رجالية"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">وصف القسم</Label>
              <textarea
                id="description"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
                placeholder="أدخل وصفًا مختصرًا للقسم"
              />
            </div>

            {/* Image upload section (simplified/standardized) */}
            <div className="space-y-2">
              <Label htmlFor="image">صورة القسم</Label>
              {selectedImage ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={selectedImage} alt="Selected" className="w-full object-cover rounded-md aspect-square" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg" onClick={clearSelectedImage} type="button"><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleImageUploadClick} type="button" className="flex-1"><UploadCloud className="h-4 w-4 ml-2" />تغيير الصورة</Button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleImageUploadClick}>
                  <UploadCloud className="h-10 w-10 text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">اضغط أو اسحب الصورة هنا</p>
                  <Button variant="outline" size="sm" className="mt-4" onClick={(e) => { e.preventDefault(); handleImageUploadClick(); }} type="button"><UploadCloud className="h-4 w-4 ml-2" />اختيار صورة</Button>
                </div>
              )}
              <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="showInHomepage" checked={newCategoryShowInHomepage} onCheckedChange={(c) => setNewCategoryShowInHomepage(c as boolean)} />
              <Label htmlFor="showInHomepage">عرض في الصفحة الرئيسية</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="order">ترتيب العرض</Label>
              <Input id="order" type="number" min="0" value={newCategoryOrder || ""} onChange={(e) => setNewCategoryOrder(parseInt(e.target.value) || 0)} placeholder="0 للترتيب التلقائي" />
            </div>

            <div className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="w-full">
                {showAdvancedSettings ? "إخفاء الإعدادات المتقدمة" : "عرض الإعدادات المتقدمة"}
              </Button>
            </div>

            {showAdvancedSettings && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label htmlFor="slug">الرابط المخصص</Label>
                  <Input id="slug" value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} placeholder="مثال: mens-clothing" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">عنوان SEO</Label>
                  <Input id="seoTitle" value={newCategorySeoTitle} onChange={(e) => setNewCategorySeoTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoDescription">وصف SEO</Label>
                  <textarea id="seoDescription" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCategorySeoDescription} onChange={(e) => setNewCategorySeoDescription(e.target.value)} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleAddCategory} disabled={!newCategoryName.trim() || isLoading}>
              {isLoading ? "جاري الإضافة..." : "إضافة القسم"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل القسم</DialogTitle>
            <DialogDescription>قم بتعديل تفاصيل القسم أدناه.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="edit-name">اسم القسم</Label>
              <Input id="edit-name" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">وصف القسم</Label>
              <textarea id="edit-description" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCategoryDescription} onChange={(e) => setNewCategoryDescription(e.target.value)} />
            </div>
            {/* Edit Image Section */}
            <div className="space-y-2">
              <Label htmlFor="edit-image">صورة القسم</Label>
              {editSelectedImage ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img src={editSelectedImage} alt="Selected" className="w-full object-cover rounded-md aspect-square" />
                    <Button variant="destructive" size="icon" className="absolute top-2 right-2 rounded-full h-8 w-8 shadow-lg" onClick={clearEditSelectedImage} type="button"><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleEditImageUploadClick} type="button" className="flex-1">تغيير الصورة</Button>
                  </div>
                </div>
              ) : (
                <div className="border border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleEditImageUploadClick}>
                  <p className="text-sm text-gray-500">اضغط أو اسحب الصورة هنا</p>
                </div>
              )}
              <input type="file" accept="image/*" ref={editFileInputRef} className="hidden" onChange={handleEditFileSelect} />
            </div>

            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox id="edit-showInHomepage" checked={newCategoryShowInHomepage} onCheckedChange={(c) => setNewCategoryShowInHomepage(c as boolean)} />
              <Label htmlFor="edit-showInHomepage">عرض في الصفحة الرئيسية</Label>
            </div>
            {/* Same advanced settings structure for edit */}
            <div className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} className="w-full">
                {showAdvancedSettings ? "إخفاء الإعدادات المتقدمة" : "عرض الإعدادات المتقدمة"}
              </Button>
            </div>
            {showAdvancedSettings && (
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2"><Label>الرابط المخصص</Label><Input value={newCategorySlug} onChange={(e) => setNewCategorySlug(e.target.value)} /></div>
                <div className="space-y-2"><Label>عنوان SEO</Label><Input value={newCategorySeoTitle} onChange={(e) => setNewCategorySeoTitle(e.target.value)} /></div>
                <div className="space-y-2"><Label>وصف SEO</Label><textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newCategorySeoDescription} onChange={(e) => setNewCategorySeoDescription(e.target.value)} /></div>
              </div>
            )}
          </div>
          <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-4">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleEditCategory} disabled={isLoading}>{isLoading ? "جاري الحفظ..." : "حفظ التغييرات"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center"><X className="h-6 w-6 text-red-600" /></div>
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription className="text-base pt-4">هل أنت متأكد من حذف قسم <span className="font-bold text-gray-900">"{categoryToDelete?.name}"</span> نهائياً؟</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">سيتم حذف القسم نهائياً من النظام. لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={cancelDelete} className="flex-1">إلغاء</Button>
            <Button variant="destructive" onClick={handlePermanentDeleteCategory} disabled={isLoading} className="flex-1 bg-red-600 hover:bg-red-700">{isLoading ? "جاري الحذف..." : "نعم، احذف نهائياً"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Categories;
