
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Upload,
  X,
  Check,
  Plus,
  ArrowRight,
  Package,
  Palette,
  Maximize,
  Trash2,
  ChevronLeft
} from "lucide-react";
import { getProductById, updateProduct, Product } from "@/services/productService";
import { getManufacturers, Manufacturer } from "@/services/manufacturerService";
import { getCategories, Category } from "@/services/categoryService";
import { getSiteSettings } from "@/services/siteSettingsService";

const commonSizes = [
  "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL",
  "34", "36", "38", "40", "42", "44", "46", "35", "37", "39", "41", "43", "45",
  "مقاس موحد", "صغير", "متوسط", "كبير"
];

type ProductVariant = {
  color: string;
  size: string;
  quantity: number;
};

// Helper: safely parse a value that might be a JSON string, array, or null/undefined
const safeParseArray = (value: any): string[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return value ? [value] : [];
    }
  }
  return [];
};

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackAction } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");
  const [product, setProduct] = useState<any>(null);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState("");
  const [newSizeInput, setNewSizeInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Record<string, string[]>>({});

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    wholesalePrice: 0,
    commission: 0,
    category: "",
    stock: 0,
    driveLink: "",
    description: "",
    manufacturerId: "",
    sku: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchData = async () => {
      setManufacturers(await getManufacturers());
      const catsResult = await getCategories();
      const cats = Array.isArray(catsResult) ? catsResult : (catsResult.data || []);
      setCategories(cats.filter(cat => cat.active));

      const settings = await getSiteSettings();
      setAvailableColors(settings.productColors || []);
      setAvailableSizes(settings.productSizes || {});
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchProduct = async () => {
      const foundProduct = await getProductById(id || "");
      if (foundProduct) {
        setProduct(foundProduct);
        setFormData({
          name: foundProduct.name,
          price: foundProduct.price,
          wholesalePrice: foundProduct.wholesalePrice,
          commission: foundProduct.commission,
          category: String(foundProduct.category_id || foundProduct.categoryId || ""),
          stock: foundProduct.stock,
          driveLink: foundProduct.driveLink || "",
          description: foundProduct.description || "",
          manufacturerId: foundProduct.manufacturerId || "",
          sku: foundProduct.sku || (() => {
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const randomLetters = Array.from({ length: 4 }, () =>
              letters.charAt(Math.floor(Math.random() * letters.length))
            ).join('');
            const randomNumbers = Math.floor(1000 + Math.random() * 9000);
            return `${randomLetters}${randomNumbers}`;
          })(),
        });

        setSelectedColors(safeParseArray(foundProduct.variants));
        setSelectedSizes(safeParseArray(foundProduct.sizes));
        const rawVariants = foundProduct.detailedVariants;
        if (Array.isArray(rawVariants)) {
          setProductVariants(rawVariants);
        } else if (typeof rawVariants === "string") {
          try { setProductVariants(JSON.parse(rawVariants) || []); } catch { setProductVariants([]); }
        } else {
          setProductVariants([]);
        }
        setThumbnailUrl(foundProduct.thumbnail || "");

        if (foundProduct.images && foundProduct.images.length > 0) {
          setImagePreviewUrls(foundProduct.images);
        } else {
          setImagePreviewUrls([]);
        }
        setIsLoading(false);
      } else {
        toast.error("المنتج غير موجود");
        navigate("/admin/products");
      }
    };
    fetchProduct();
  }, [id, navigate]);

  useEffect(() => {
    if (!isLoading) {
      const newVariants: ProductVariant[] = [];
      selectedColors.forEach(color => {
        selectedSizes.forEach(size => {
          const existing = productVariants.find(v => v.color === color && v.size === size);
          newVariants.push({
            color,
            size,
            quantity: existing ? existing.quantity : (existing === undefined ? 1 : existing.quantity)
          });
        });
      });
      setProductVariants(newVariants);
    }
  }, [selectedColors, selectedSizes, isLoading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[name];
        return updated;
      });
    }
  };

  const toggleColor = (color: string) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const addCustomColor = () => {
    if (newColorInput && !selectedColors.includes(newColorInput)) {
      setSelectedColors([...selectedColors, newColorInput]);
      setNewColorInput("");
    }
  };

  const addCustomSize = () => {
    if (newSizeInput && !selectedSizes.includes(newSizeInput)) {
      setSelectedSizes([...selectedSizes, newSizeInput]);
      setNewSizeInput("");
    }
  };

  const updateVariantQuantity = (index: number, quantity: number) => {
    const updated = [...productVariants];
    if (quantity >= 0) {
      updated[index].quantity = quantity;
      setProductVariants(updated);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "اسم المنتج مطلوب";
    if (!formData.category) newErrors.category = "الفئة مطلوبة";
    if (!formData.manufacturerId) newErrors.manufacturerId = "المصنع مطلوب";
    if (!formData.description) newErrors.description = "وصف المنتج مطلوب";
    if (!formData.wholesalePrice || formData.wholesalePrice <= 0) newErrors.wholesalePrice = "سعر الجملة مطلوب";
    if (!formData.price || formData.price <= 0) newErrors.price = "سعر البيع مطلوب";

    if (!thumbnailUrl) {
      toast.error("يرجى إضافة الصورة الأساسية للمنتج");
      return false;
    }

    if (productVariants.length === 0) {
      toast.error("يرجى اختيار لون ومقاس واحد على الأقل للمنتج");
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const totalStock = productVariants.reduce((sum, v) => sum + v.quantity, 0);
    console.log("🧪 [FRONTEND DEBUG] handleSubmit called");
    console.log("🧪 [FRONTEND DEBUG] productVariants:", productVariants);
    console.log("🧪 [FRONTEND DEBUG] calculated totalStock:", totalStock);

    const updatedProduct: Product = {
      ...product,
      name: formData.name,
      price: Number(formData.price),
      wholesalePrice: Number(formData.wholesalePrice),
      commission: Number(formData.commission),
      category: formData.category, // Keep for display purposes
      category_id: formData.category, // Send ID for backend
      categoryId: formData.category,  // Fallback
      stock: totalStock,
      driveLink: formData.driveLink,
      description: formData.description,
      variants: selectedColors,
      sizes: selectedSizes,
      detailedVariants: productVariants,
      manufacturerId: formData.manufacturerId || undefined,
      thumbnail: thumbnailUrl,
      images: imagePreviewUrls,
      sku: formData.sku,
    };

    try {
      await updateProduct(updatedProduct);

      // تتبع الحركة
      trackAction("تعديل بيانات منتج");

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("تم تحديث المنتج بنجاح");
      navigate("/admin/products");
    } catch (error) {
      toast.error("حدث خطأ أثناء التحديث");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-96">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xl font-bold text-slate-600">جاري تحميل بيانات المنتج...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="font-cairo space-y-8 pb-10">
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
                تعديل المنتج: <span className="text-blue-400">{product.name}</span>
              </h1>
              <p className="text-slate-300 mt-2 text-lg opacity-90">تحديث تفاصيل وأسعار المنتج</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/products")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm h-12 px-6 rounded-xl"
            >
              <ArrowRight className="ml-2 h-5 w-5" /> العودة
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="shadow-card-hover border-slate-200 overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-50/80 border-b pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
                      <Package className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">بيانات المنتج</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-3">
                    <Label className="text-md font-bold text-slate-700 flex justify-between">
                      اسم المنتج
                      <span className="text-red-500 text-xs">* إجباري</span>
                    </Label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`h-12 text-lg border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl ${errors.name ? 'border-red-500 ring-red-100' : ''}`}
                    />
                    {errors.name && <p className="text-red-500 text-xs font-bold">{errors.name}</p>}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-md font-bold text-slate-700 flex justify-between items-center">
                      <span>كود المنتج (SKU)</span>
                      <span className="text-amber-600 text-xs flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        كود ثابت
                      </span>
                    </Label>
                    <Input
                      name="sku"
                      value={formData.sku}
                      disabled
                      placeholder="لم يتم توليد كود"
                      className="h-12 text-lg border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl font-mono"
                    />
                    <p className="text-xs text-slate-500">لا يمكن تغيير كود المنتج بعد إنشائه للحفاظ على سجل التتبع</p>
                  </div>


                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-md font-bold text-slate-700 flex justify-between">
                        الفئة
                        <span className="text-red-500 text-xs">* إجباري</span>
                      </Label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className={`w-full h-12 border border-slate-200 rounded-xl px-4 bg-background focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${errors.category ? 'border-red-500' : ''}`}
                      >
                        <option value="">اختر الفئة</option>
                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                      </select>
                      {errors.category && <p className="text-red-500 text-xs font-bold">{errors.category}</p>}
                    </div>
                    <div className="space-y-3">
                      <Label className="text-md font-bold text-slate-700 flex justify-between">
                        المصنع / البراند
                        <span className="text-red-500 text-xs">* إجباري</span>
                      </Label>
                      <select
                        name="manufacturerId"
                        value={formData.manufacturerId}
                        onChange={handleInputChange}
                        className={`w-full h-12 border border-slate-200 rounded-xl px-4 bg-background focus:ring-2 focus:ring-blue-500/20 outline-none ${errors.manufacturerId ? 'border-red-500' : ''}`}
                      >
                        <option value="">اختر المصنع</option>
                        {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                      {errors.manufacturerId && <p className="text-red-500 text-xs font-bold">{errors.manufacturerId}</p>}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-md font-bold text-slate-700 flex justify-between">
                      وصف المنتج
                      <span className="text-red-500 text-xs">* إجباري</span>
                    </Label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className={`text-lg border-slate-200 focus:ring-blue-500/20 focus:border-blue-500 rounded-xl resize-none ${errors.description ? 'border-red-500 ring-red-100' : ''}`}
                    />
                    {errors.description && <p className="text-red-500 text-xs font-bold">{errors.description}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label className="text-md font-bold text-slate-700">رابط جوجل درايف (اختياري)</Label>
                    <Input
                      name="driveLink"
                      value={formData.driveLink}
                      onChange={handleInputChange}
                      placeholder="https://drive.google.com/..."
                      className="h-12 rounded-xl border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-50 border-b pb-6">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-lg text-white shadow-lg">
                      <Palette className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-2xl font-bold flex justify-between w-full">
                      الألوان والمقاسات
                      <span className="text-red-500 text-sm">* إجباري اختيار واحد</span>
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                  <div className="space-y-5">
                    <Label className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-6 bg-blue-600 rounded-full"></span> الألوان المتاحة:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(color => (
                        <Button
                          key={color}
                          type="button"
                          variant={selectedColors.includes(color) ? "default" : "outline"}
                          onClick={() => toggleColor(color)}
                          className={`rounded-xl h-10 px-5 font-bold transition-all shadow-sm ${selectedColors.includes(color) ? 'bg-blue-600 scale-105' : 'hover:border-blue-400'}`}
                        >
                          {color}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Label className="text-lg font-black text-slate-800 flex items-center gap-2">
                      <span className="w-2 h-6 bg-teal-600 rounded-full"></span> المقاسات المتاحة:
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {(() => {
                        const selectedCategory = categories.find(c => String(c.id) === String(formData.category));
                        const categoryName = selectedCategory?.name || '';
                        const sizesForCategory = (categoryName && availableSizes[categoryName]) ? availableSizes[categoryName] : commonSizes;
                        return sizesForCategory.map(size => (
                          <Button
                            key={size}
                            type="button"
                            variant={selectedSizes.includes(size) ? "default" : "outline"}
                            onClick={() => toggleSize(size)}
                            className={`rounded-xl h-10 px-5 font-bold transition-all shadow-sm ${selectedSizes.includes(size) ? 'bg-teal-600 scale-105' : 'hover:border-teal-400'}`}
                          >
                            {size}
                          </Button>
                        ));
                      })()}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-2xl border-blue-200 overflow-hidden rounded-2xl border-2">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-white/20 p-2 rounded-xl text-white">
                        <Maximize className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-2xl font-black">جدول تحديث المخزون</CardTitle>
                    </div>
                    <div className="text-left">
                      <span className="text-xs uppercase tracking-widest opacity-70 block mb-1 font-bold">إجمالي القطع</span>
                      <span className="text-3xl font-black">{productVariants.reduce((s, v) => s + v.quantity, 0)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {productVariants.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-center">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 font-bold">
                            <th className="px-8 py-5 text-md">اللون</th>
                            <th className="px-8 py-5 text-md">المقاس</th>
                            <th className="px-8 py-5 text-md">الكمية</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {productVariants.map((v, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                              <td className="px-8 py-6 font-bold text-slate-800 text-lg">{v.color}</td>
                              <td className="px-8 py-6">
                                <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-xl text-sm font-black shadow-sm ring-1 ring-blue-100">
                                  {v.size}
                                </span>
                              </td>
                              <td className="px-8 py-6 text-center">
                                <div className="flex items-center justify-center gap-4">
                                  <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={() => updateVariantQuantity(idx, v.quantity - 1)} disabled={v.quantity <= 0}>-</Button>
                                  <Input type="number" className="w-24 text-center font-black h-11 text-xl border-slate-200 rounded-xl bg-slate-50" value={v.quantity} onChange={(e) => updateVariantQuantity(idx, parseInt(e.target.value) || 0)} />
                                  <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={() => updateVariantQuantity(idx, v.quantity + 1)}>+</Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-20 text-center text-slate-400 font-black">
                      <p className="text-xl">اختر الألوان والمقاسات ليظهر جدول التوزيع</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl">
                <CardHeader className="bg-slate-50/80 border-b pb-6"><CardTitle className="text-xl font-bold">الأسعار</CardTitle></CardHeader>
                <CardContent className="p-8 space-y-5">
                  <div className="space-y-2">
                    <Label className="font-bold opacity-60 flex justify-between">
                      سعر الجملة
                      <span className="text-red-500 text-xs">* إجباري</span>
                    </Label>
                    <Input
                      name="wholesalePrice"
                      type="number"
                      value={formData.wholesalePrice}
                      onChange={handleInputChange}
                      className={`h-11 rounded-xl ${errors.wholesalePrice ? 'border-red-500 ring-red-100' : ''}`}
                    />
                    {errors.wholesalePrice && <p className="text-red-500 text-xs font-bold">{errors.wholesalePrice}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold flex justify-between">
                      سعر البيع
                      <span className="text-red-500 text-xs">* إجباري</span>
                    </Label>
                    <Input
                      name="price"
                      type="number"
                      value={formData.price}
                      onChange={handleInputChange}
                      className={`h-11 rounded-xl text-lg font-bold ${errors.price ? 'border-red-500 ring-red-100' : ''}`}
                    />
                    {errors.price && <p className="text-red-500 text-xs font-bold">{errors.price}</p>}
                  </div>
                  <div className="space-y-2"><Label className="font-bold text-green-700">عمولة المسوق</Label><Input name="commission" type="number" value={formData.commission} onChange={handleInputChange} className="h-11 rounded-xl border-green-200 text-green-700 font-bold" /></div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl relative">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">الصورة الأساسية</div>
                </div>
                <CardHeader className="bg-slate-50 border-b pb-6">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">الصورة الرئيسية للمنتج</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center text-slate-800">
                  <div className="max-w-[200px] mx-auto mb-4">
                    {thumbnailUrl ? (
                      <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-blue-50 shadow-inner">
                        <img src={thumbnailUrl} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={() => setThumbnailUrl("")}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-slate-400 cursor-pointer"
                        onClick={() => mainImageInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 mb-2" />
                        <span className="text-xs font-bold">إضافة الصورة الرئيسية</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={mainImageInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setThumbnailUrl(reader.result as string);
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Button type="button" variant="outline" className="w-full h-11 rounded-xl border-blue-100 text-blue-700 hover:bg-blue-50" onClick={() => mainImageInputRef.current?.click()}>
                    {thumbnailUrl ? "تغيير الصورة الأساسية" : "اختر الصورة الأساسية"}
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl bg-white/50">
                <CardHeader className="bg-slate-50 border-b pb-6"><CardTitle className="text-xl font-bold text-slate-800">بقية صور المنتج (المعرض)</CardTitle></CardHeader>
                <CardContent className="p-8 text-center text-slate-800">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {imagePreviewUrls.map((img, index) => (
                      <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white">
                        <img src={img} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => setImagePreviewUrls(prev => prev.filter((_, i) => i !== index))}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                    <div className="aspect-square rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 flex flex-col items-center justify-center text-slate-400 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-8 w-8 mb-2" />
                      <span className="text-xs font-bold">إضافة صورة</span>
                    </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      Array.from(files).forEach(file => {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setImagePreviewUrls(prev => [...prev, reader.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                    }
                  }} />
                  <Button type="button" variant="outline" className="w-full h-12 rounded-xl" onClick={() => fileInputRef.current?.click()}>إضافة صور للمعرض</Button>
                </CardContent>
                <CardFooter className="bg-slate-50 border-t p-6">
                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 h-14 text-xl font-black rounded-xl shadow-lg">
                    حفظ التغييرات
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
};

export default EditProduct;
