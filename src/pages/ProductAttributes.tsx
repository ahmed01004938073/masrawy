import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Plus,
    X,
    Save,
    Loader2,
    Palette,
    Ruler,
    ArrowRight,
    Trash2,
    ChevronLeft
} from "lucide-react";
import { toast } from "sonner";
import { getSiteSettings, updateSiteSettings } from "@/services/siteSettingsService";
import { getCategories, Category } from "@/services/categoryService";
import { useNavigate } from "react-router-dom";

const ProductAttributes = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [newColor, setNewColor] = useState("");
    const [newSize, setNewSize] = useState("");
    const [activeSizeCategory, setActiveSizeCategory] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch settings
    const { data: settings, isLoading: isLoadingSettings } = useQuery({
        queryKey: ['site-settings'],
        queryFn: getSiteSettings,
    });

    // Fetch categories
    const { data: categories, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: getCategories,
    });

    const [colors, setColors] = useState<string[]>([]);
    const [sizes, setSizes] = useState<Record<string, string[]>>({});

    useEffect(() => {
        if (settings) {
            setColors(settings.productColors || []);
            setSizes(settings.productSizes || {});
        }
    }, [settings]);

    useEffect(() => {
        if (categories && categories.length > 0 && !activeSizeCategory) {
            setActiveSizeCategory(categories[0].name);
        }
    }, [categories, activeSizeCategory]);

    // Colors Management
    const handleAddColor = () => {
        if (newColor && !colors.includes(newColor)) {
            setColors([...colors, newColor]);
            setNewColor("");
        }
    };

    const handleRemoveColor = (colorToRemove: string) => {
        setColors(colors.filter(c => c !== colorToRemove));
    };

    // Sizes Management
    const handleAddSize = () => {
        if (newSize && activeSizeCategory) {
            const currentCategorySizes = sizes[activeSizeCategory] || [];
            if (!currentCategorySizes.includes(newSize)) {
                setSizes({
                    ...sizes,
                    [activeSizeCategory]: [...currentCategorySizes, newSize]
                });
                setNewSize("");
            }
        }
    };

    const handleRemoveSize = (sizeToRemove: string) => {
        const currentCategorySizes = sizes[activeSizeCategory] || [];
        setSizes({
            ...sizes,
            [activeSizeCategory]: currentCategorySizes.filter(s => s !== sizeToRemove)
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await updateSiteSettings({
                productColors: colors,
                productSizes: sizes
            });
            await queryClient.invalidateQueries({ queryKey: ['site-settings'] });
            toast.success("تم حفظ التغييرات بنجاح");
        } catch (error) {
            console.error("Failed to save attributes", error);
            toast.error("حدث خطأ أثناء الحفظ");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoadingSettings || isLoadingCategories) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[500px]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    // Use actual categories for tabs
    const categoryTabs = categories?.map(c => c.name) || [];

    return (
        <DashboardLayout>
            <div className="space-y-6 container mx-auto max-w-5xl font-cairo pb-10">

                {/* Header with Back Button */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            onClick={() => navigate('/admin/products')}
                            className="hover:bg-slate-100 rounded-xl h-12 px-4 gap-2 text-slate-600"
                        >
                            <ArrowRight className="w-5 h-5" />
                            <span className="font-bold text-lg">رجوع</span>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800">إدارة سمات المنتجات</h1>
                            <p className="text-slate-500 font-medium mt-1">تخصيص الألوان والمقاسات لكافة أقسام المتجر</p>
                        </div>
                    </div>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white h-12 px-8 rounded-xl font-bold shadow-lg shadow-green-600/20 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        حفظ كافة التغييرات
                    </Button>
                </div>

                <div className="grid gap-8 md:grid-cols-1">
                    {/* Colors Section */}
                    <Card className="shadow-lg border-slate-200 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                                    <Palette className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-800">الألوان المتاحة</CardTitle>
                                    <CardDescription className="text-slate-500 mt-1">هذه الألوان ستظهر كخيارات عند إضافة أي منتج جديد</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex gap-3 mb-8">
                                <Input
                                    placeholder="اكتب اسم اللون (مثال: نبيتي غامق)..."
                                    value={newColor}
                                    onChange={(e) => setNewColor(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddColor()}
                                    className="max-w-md h-12 text-lg rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                                <Button onClick={handleAddColor} className="h-12 px-6 rounded-xl font-bold bg-blue-600 hover:bg-blue-700">
                                    <Plus className="w-5 h-5 ml-2" />
                                    إضافة لون
                                </Button>
                            </div>

                            <div className="flex flex-wrap gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 min-h-[120px]">
                                {colors.map((color) => (
                                    <div
                                        key={color}
                                        className="group relative flex items-center bg-white border border-slate-200 shadow-sm rounded-xl px-4 py-2.5 hover:shadow-md hover:border-blue-200 transition-all cursor-default"
                                    >
                                        <div className="w-4 h-4 rounded-full bg-slate-200 ml-3 shadow-inner" style={{ backgroundColor: CSS_COLOR_NAMES[color] || color }}></div>
                                        <span className="font-bold text-slate-700 text-lg">{color}</span>
                                        <button
                                            onClick={() => handleRemoveColor(color)}
                                            className="mr-3 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                {colors.length === 0 && (
                                    <div className="flex flex-col items-center justify-center w-full text-slate-400 py-8">
                                        <Palette className="w-10 h-10 mb-3 opacity-20" />
                                        <p>لا توجد ألوان مضافة حتى الآن</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sizes Section */}
                    <Card className="shadow-lg border-slate-200 rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="bg-teal-100 p-2.5 rounded-xl text-teal-600">
                                    <Ruler className="w-6 h-6" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-slate-800">قوائم المقاسات</CardTitle>
                                    <CardDescription className="text-slate-500 mt-1">حدد المقاسات المتاحة لكل قسم من أقسام المتجر</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {categoryTabs.length > 0 ? (
                                <Tabs value={activeSizeCategory || categoryTabs[0]} onValueChange={setActiveSizeCategory} className="w-full">
                                    <div className="mb-6 overflow-x-auto pb-2">
                                        <TabsList className="flex w-max h-auto gap-2 bg-transparent p-0">
                                            {categoryTabs.map(cat => (
                                                <TabsTrigger
                                                    key={cat}
                                                    value={cat}
                                                    className="rounded-xl px-6 py-3 font-bold text-slate-600 border border-slate-200 data-[state=active]:bg-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border-teal-600 transition-all"
                                                >
                                                    {cat}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                    </div>

                                    {categoryTabs.map(category => (
                                        <TabsContent key={category} value={category} className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <div className="flex gap-3">
                                                <Input
                                                    placeholder={`أضف مقاس جديد لقسم ${category}...`}
                                                    value={newSize}
                                                    onChange={(e) => setNewSize(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSize()}
                                                    className="max-w-md h-12 text-lg rounded-xl border-slate-200 focus:border-teal-500 focus:ring-teal-500/20"
                                                />
                                                <Button onClick={handleAddSize} className="h-12 px-6 rounded-xl font-bold bg-teal-600 hover:bg-teal-700">
                                                    <Plus className="w-5 h-5 ml-2" />
                                                    إضافة
                                                </Button>
                                            </div>

                                            <div className="flex flex-wrap gap-3 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 min-h-[120px]">
                                                {sizes[category]?.map((size) => (
                                                    <div
                                                        key={`${category}-${size}`}
                                                        className="group flex items-center bg-white border border-slate-200 shadow-sm rounded-xl px-5 py-2.5 hover:shadow-md hover:border-teal-200 transition-all cursor-default"
                                                    >
                                                        <span className="font-bold text-slate-700 text-lg">{size}</span>
                                                        <button
                                                            onClick={() => handleRemoveSize(size)}
                                                            className="mr-3 p-1 rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                                {(!sizes[category] || sizes[category].length === 0) && (
                                                    <div className="flex flex-col items-center justify-center w-full text-slate-400 py-8">
                                                        <Ruler className="w-10 h-10 mb-3 opacity-20" />
                                                        <p>لا توجد مقاسات مضافة لهذا القسم</p>
                                                        <p className="text-sm opacity-60 mt-1">ابدأ بإضافة المقاسات من الحقل أعلاه</p>
                                                    </div>
                                                )}
                                            </div>
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-slate-500 font-bold">يرجى إضافة أقسام للمتجر أولاً لتتمكن من إدارة مقاساتها</p>
                                    <Button variant="outline" onClick={() => navigate('/admin/categories')} className="mt-4">
                                        الذهاب للأقسام
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </DashboardLayout>
    );
};

// Simple Color Name to Hex mapping helper (or just relying on browser default colors)
const CSS_COLOR_NAMES: any = {
    // basic colors could be added here if needed for visual preview
};

export default ProductAttributes;
