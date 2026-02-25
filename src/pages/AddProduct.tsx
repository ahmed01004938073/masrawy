
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Plus,
  ArrowRight,
  Trash2,
  Package,
  Check,
  Upload,
  Palette,
  Maximize
} from "lucide-react";
import { addProduct, Product } from "@/services/productService";
import { getManufacturers, Manufacturer } from "@/services/manufacturerService";
import { getCategories, Category } from "@/services/categoryService";
import { getSiteSettings } from "@/services/siteSettingsService";

const commonSizes = [
  "XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL",
  "34", "36", "38", "40", "42", "44", "46",
  "35", "37", "39", "41", "43", "45",
  "مقاس موحد", "صغير", "متوسط", "كبير"
];

type ProductVariant = {
  color: string;
  size: string;
  quantity: number;
};

type FormValues = {
  name: string;
  driveLink: string;
  description: string;
  price: string;
  wholesalePrice: string;
  commission: string;
  category: string;
  stock: string;
  manufacturerId: string;
  sku: string;
};

// Generate unique product SKU (4 letters + 4 numbers)
const generateProductSKU = () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = Array.from({ length: 4 }, () =>
    letters.charAt(Math.floor(Math.random() * letters.length))
  ).join('');
  const randomNumbers = Math.floor(1000 + Math.random() * 9000); // 4-digit number
  return `${randomLetters}${randomNumbers}`;
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { trackAction } = useAuth();
  const queryClient = useQueryClient();
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [newVariant, setNewVariant] = useState("");
  const [newSize, setNewSize] = useState("");
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableColors, setAvailableColors] = useState<string[]>([]);
  const [availableSizes, setAvailableSizes] = useState<Record<string, string[]>>({});
  const [thumbnail, setThumbnail] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mainImageInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      name: "",
      driveLink: "",
      description: "",
      price: "",
      wholesalePrice: "",
      commission: "0",
      category: "",
      stock: "0",
      manufacturerId: "",
      sku: generateProductSKU(),
    },
  });

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

  const onSubmit = async (data: FormValues) => {
    // التحقق من الصور
    // التحقق من الصور الأساسية
    if (!thumbnail) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى إضافة الصورة الأساسية للمنتج",
        variant: "destructive",
      });
      return;
    }

    // التحقق من المتغيرات
    if (productVariants.length === 0) {
      toast({
        title: "خطأ في التحقق",
        description: "يرجى اختيار لون ومقاس واحد على الأقل للمنتج لإنشاء المتغيرات",
        variant: "destructive",
      });
      return;
    }

    const totalStock = productVariants.reduce((sum, variant) => sum + variant.quantity, 0);

    const newProduct: Product = {
      id: Date.now().toString(),
      name: data.name,
      driveLink: data.driveLink,
      description: data.description,
      price: parseFloat(data.price),
      wholesalePrice: parseFloat(data.wholesalePrice),
      commission: parseFloat(data.commission),
      category: data.category,
      stock: totalStock,
      variants: selectedColors,
      sizes: selectedSizes,
      detailedVariants: productVariants,
      thumbnail: thumbnail,
      images: images,
      isHidden: false,
      manufacturerId: data.manufacturerId,
      sku: data.sku
    };

    try {
      await addProduct(newProduct);

      // تتبع الحركة
      trackAction("إضافة منتج جديد");

      await queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "تم إضافة المنتج بنجاح" });
      navigate("/admin/products");
    } catch (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء إضافة المنتج.",
        variant: "destructive",
      });
    }
  };

  const toggleSize = (size: string) => {
    if (selectedSizes.includes(size)) {
      setSelectedSizes(prev => prev.filter(s => s !== size));
      setProductVariants(prev => prev.filter(v => v.size !== size));
    } else {
      setSelectedSizes(prev => [...prev, size]);
      const newVariants = selectedColors.map(color => ({
        color,
        size,
        quantity: 1
      }));
      setProductVariants(prev => [...prev, ...newVariants]);
    }
  };

  const toggleColor = (color: string) => {
    if (selectedColors.includes(color)) {
      setSelectedColors(prev => prev.filter(c => c !== color));
      setProductVariants(prev => prev.filter(v => v.color !== color));
    } else {
      setSelectedColors(prev => [...prev, color]);
      const newVariants = selectedSizes.map(size => ({
        color,
        size,
        quantity: 1
      }));
      setProductVariants(prev => [...prev, ...newVariants]);
    }
  };

  const addCustomSize = () => {
    if (newSize && !selectedSizes.includes(newSize)) {
      const sizeToAdd = newSize;
      setSelectedSizes([...selectedSizes, sizeToAdd]);
      const newVariants = selectedColors.map(color => ({ color, size: sizeToAdd, quantity: 1 }));
      setProductVariants(prev => [...prev, ...newVariants]);
      setNewSize("");
    }
  };

  const addCustomColor = () => {
    if (newVariant && !selectedColors.includes(newVariant)) {
      const colorToAdd = newVariant;
      setSelectedColors([...selectedColors, colorToAdd]);
      const newVariants = selectedSizes.map(size => ({ color: colorToAdd, size, quantity: 1 }));
      setProductVariants(prev => [...prev, ...newVariants]);
      setNewVariant("");
    }
  };

  const removeVariant = (index: number) => {
    const updated = [...productVariants];
    updated.splice(index, 1);
    setProductVariants(updated);
  };

  const updateVariantQuantity = (index: number, quantity: number) => {
    const updated = [...productVariants];
    if (quantity >= 0) {
      updated[index].quantity = quantity;
      setProductVariants(updated);
    }
  };

  return (
    <DashboardLayout>
      <div className="font-cairo space-y-8 pb-10">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl font-black tracking-tight">إضافة منتج جديد</h1>
              <p className="text-blue-100 mt-2 text-lg">أدخل بيانات المنتج بدقة لضمان أفضل تجربة للمسوقين</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/admin/products")}
              className="bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm h-12 px-6 rounded-xl"
            >
              <ArrowRight className="ml-2 h-5 w-5" /> الرجوع للمنتجات
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-8 space-y-8">
                <Card className="shadow-card-hover border-slate-200 overflow-hidden rounded-2xl">
                  <CardHeader className="bg-slate-50/80 border-b pb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg text-white shadow-lg">
                        <Package className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-slate-800">بيانات المنتج الأساسية</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      rules={{ required: "اسم المنتج مطلوب" }}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-md font-bold text-slate-700 text-right w-full flex justify-between">
                            اسم المنتج
                            <span className="text-red-500 text-xs">* إجباري</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثال: فستان سهرة مخملي"
                              className="h-12 text-lg border-slate-200 focus:ring-blue-500/20 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-md font-bold text-slate-700 text-right w-full flex justify-between items-center">
                            <span>كود المنتج (SKU)</span>
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              تم التوليد تلقائياً
                            </span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="مثال: DR-101"
                              className="h-12 text-lg border-slate-200 bg-slate-50 cursor-not-allowed rounded-xl font-mono"
                              disabled
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-slate-500">هذا الكود فريد ولا يمكن تغييره لضمان تتبع المنتج بدقة</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        rules={{ required: "الفئة مطلوبة" }}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-md font-bold text-slate-700 flex justify-between">
                              الفئة
                              <span className="text-red-500 text-xs">* إجباري</span>
                            </FormLabel>
                            <select {...field} className="w-full h-12 border border-slate-200 rounded-xl px-4 focus:ring-2 focus:ring-blue-500/20 outline-none">
                              <option value="">اختر الفئة الرئيسية</option>
                              {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="manufacturerId"
                        rules={{ required: "المصنع مطلوب" }}
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel className="text-md font-bold text-slate-700 flex justify-between">
                              المصنع
                              <span className="text-red-500 text-xs">* إجباري</span>
                            </FormLabel>
                            <select {...field} className="w-full h-12 border border-slate-200 rounded-xl px-4 outline-none">
                              <option value="">اختر المصنع</option>
                              {manufacturers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      rules={{ required: "وصف المنتج مطلوب" }}
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel className="text-md font-bold text-slate-700 flex justify-between">
                            وصف المنتج
                            <span className="text-red-500 text-xs">* إجباري</span>
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              rows={5}
                              placeholder="اكتب تفاصيل المنتج بوضوح..."
                              className="text-lg border-slate-200 focus:ring-blue-500/20 rounded-xl"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField control={form.control} name="driveLink" render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel className="text-md font-bold text-slate-700">رابط جوجل درايف (اختياري)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://drive.google.com/..." className="h-12 text-lg border-slate-200 focus:ring-blue-500/20 rounded-xl" {...field} />
                        </FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl">
                  <CardHeader className="bg-slate-50 border-b pb-6">
                    <div className="flex items-center gap-3">
                      <div className="bg-teal-600 p-2 rounded-lg text-white">
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
                      <Label className="text-lg font-black flex items-center gap-2">الألوان المتاحة:</Label>
                      <div className="flex flex-wrap gap-2">
                        {availableColors.map(color => (
                          <Button
                            key={color}
                            type="button"
                            variant={selectedColors.includes(color) ? "default" : "outline"}
                            onClick={() => toggleColor(color)}
                            className={`rounded-xl h-10 px-5 font-bold ${selectedColors.includes(color) ? 'bg-blue-600' : ''}`}
                          >
                            {color}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-5">
                      <Label className="text-lg font-black flex items-center gap-2">المقاسات المتاحة:</Label>
                      <div className="flex flex-wrap gap-2">
                        {(form.watch("category") && availableSizes[form.watch("category") as string] ? availableSizes[form.watch("category") as string] : commonSizes).map(size => (
                          <Button
                            key={size}
                            type="button"
                            variant={selectedSizes.includes(size) ? "default" : "outline"}
                            onClick={() => toggleSize(size)}
                            className={`rounded-xl h-10 px-5 font-bold ${selectedSizes.includes(size) ? 'bg-teal-600' : ''}`}
                          >
                            {size}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-2xl border-blue-200 overflow-hidden rounded-2xl border-2">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-xl">
                          <Maximize className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-2xl font-black">جدول تفاصيل المخزون</CardTitle>
                      </div>
                      <div className="text-left font-black text-2xl">
                        {productVariants.reduce((sum, v) => sum + v.quantity, 0)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {productVariants.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 font-bold">
                              <th className="px-8 py-5">اللون</th>
                              <th className="px-8 py-5">المقاس</th>
                              <th className="px-8 py-5">الكمية</th>
                              <th className="px-8 py-5">حذف</th>
                            </tr>
                          </thead>
                          <tbody>
                            {productVariants.map((variant, index) => (
                              <tr key={index} className="border-b">
                                <td className="px-8 py-6 font-bold">{variant.color}</td>
                                <td className="px-8 py-6">
                                  <span className="bg-blue-100 text-blue-700 px-5 py-2 rounded-xl">{variant.size}</span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <div className="flex items-center justify-center gap-4">
                                    <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={() => updateVariantQuantity(index, variant.quantity - 1)} disabled={variant.quantity <= 0}>-</Button>
                                    <Input type="number" className="w-24 text-center font-black h-11 text-xl" value={variant.quantity} onChange={(e) => updateVariantQuantity(index, parseInt(e.target.value) || 0)} />
                                    <Button type="button" size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={() => updateVariantQuantity(index, variant.quantity + 1)}>+</Button>
                                  </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                  <Button type="button" size="icon" variant="ghost" className="text-red-500" onClick={() => removeVariant(index)}>
                                    <Trash2 className="h-5 w-5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="py-24 text-center text-slate-400">
                        <p className="text-xl font-bold">اختر الألوان والمقاسات ليظهر جدول التوزيع</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4 space-y-8">
                <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl">
                  <CardHeader className="bg-slate-50/80 border-b">
                    <CardTitle className="text-xl font-bold">إعدادات التسعير</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-5">
                    <FormField
                      control={form.control}
                      name="wholesalePrice"
                      rules={{ required: "سعر الجملة مطلوب" }}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-bold flex justify-between">
                            سعر الجملة
                            <span className="text-red-500 text-xs">* إجباري</span>
                          </FormLabel>
                          <FormControl><Input type="number" placeholder="0.00" className="h-11 rounded-xl" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    <FormField
                      control={form.control}
                      name="price"
                      rules={{ required: "سعر البيع مطلوب" }}
                      render={({ field }) => (
                        <FormItem className="space-y-2">
                          <FormLabel className="font-bold flex justify-between">
                            سعر البيع النهائي
                            <span className="text-red-500 text-xs">* إجباري</span>
                          </FormLabel>
                          <FormControl><Input type="number" placeholder="0.00" className="h-11 rounded-xl text-lg font-bold" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    <FormField control={form.control} name="commission" render={({ field }) => (
                      <FormItem className="space-y-2">
                        <FormLabel className="font-bold text-green-700">عمولة المسوق</FormLabel>
                        <FormControl><Input type="number" placeholder="0.00" className="h-11 rounded-xl border-green-200 text-green-700 font-bold" {...field} /></FormControl>
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl relative">
                  <div className="absolute top-4 right-4 z-10">
                    <div className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">إجباري</div>
                  </div>
                  <CardHeader className="bg-slate-50 border-b pb-6">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      الصورة الأساسية للمنتج
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    {thumbnail ? (
                      <div className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-blue-100 shadow-inner max-w-[200px] mx-auto">
                        <img src={thumbnail} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button type="button" variant="destructive" size="icon" className="h-10 w-10 rounded-full" onClick={() => setThumbnail("")}>
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all flex flex-col items-center justify-center text-slate-400 cursor-pointer max-w-[200px] mx-auto group"
                        onClick={() => mainImageInputRef.current?.click()}
                      >
                        <Upload className="h-10 w-10 mb-2 group-hover:text-blue-500 transition-colors" />
                        <span className="text-xs font-bold">اضغط لإضافة الصورة الرئيسية</span>
                      </div>
                    )}
                    <input
                      type="file"
                      ref={mainImageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setThumbnail(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {!thumbnail && (
                      <Button type="button" variant="outline" className="w-full mt-4 h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => mainImageInputRef.current?.click()}>
                        اختر الصورة الأساسية
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-card border-slate-200 overflow-hidden rounded-2xl bg-white/50">
                  <CardHeader className="bg-slate-50 border-b pb-6">
                    <CardTitle className="text-xl font-bold">بقية صور المنتج (المعرض)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {images.map((img, index) => (
                        <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-white">
                          <img src={img} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button type="button" variant="destructive" size="icon" className="h-8 w-8 rounded-full" onClick={() => setImages(prev => prev.filter((_, i) => i !== index))}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <div
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition-all flex items-center justify-center text-slate-400 cursor-pointer"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8" />
                      </div>
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setImages(prev => [...prev, reader.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                      }
                    }} />
                    <Button type="button" variant="outline" className="w-full h-11 rounded-xl" onClick={() => fileInputRef.current?.click()}>إضافة صور للمعرض</Button>
                  </CardContent>
                </Card>
              </div>

              <div className="col-span-1 md:col-span-12 flex justify-end gap-5 mt-12 bg-white/50 p-6 rounded-2xl border sticky bottom-6 z-50 shadow-xl backdrop-blur-md">
                <Button type="button" variant="ghost" className="h-14 px-8 text-lg font-bold" onClick={() => navigate("/admin/products")}>إلغاء</Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700 h-14 px-12 text-xl font-black rounded-xl">إضافة المنتج للمتجر</Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
};

export default AddProduct;
